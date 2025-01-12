import { SQSEvent, SQSRecord } from 'aws-lambda'
import { basename, extname } from 'node:path'
import { Result } from '../common/logic'
import { environment } from '../infra/environment'
import { Magento2Client } from '../infra/external/magento-client'
import { ImplNotificationService } from '../infra/providers/notification/impl/notification-service'
import { SqsClient } from '../infra/providers/notification/sqs-client'
import { ImplStorageService } from '../infra/providers/storage/impl/storage-service'
import { S3Client } from '../infra/providers/storage/s3-client'
import { MessageContent } from './upload-processing-producer'

type PrincipalImageProcessingInput = {
  megaErpCode: string
  name: string
  position: number
  sku: string
  image: string
  attempts: number
  objectKey: string
}

const magento = new Magento2Client()
const storage = new ImplStorageService(
  S3Client.getInstance(),
  environment.AWS_UPLOADS_BUCKET_NAME,
)
const notification = new ImplNotificationService(SqsClient.getInstance())

const MAX_ATTEMPTS = 5

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const message of event.Records) {
    try {
      await processMessagesAsync(message)
    } catch (error) {
      throw new Error(
        `Unexpected error on processing message <${message}> - ${error}`,
      )
    }
  }
}

export const processMessagesAsync = async (
  message: SQSRecord,
): Promise<void> => {
  const { attempts, objectKey } = JSON.parse(message.body) as MessageContent

  console.info(`Processing message <${objectKey}>`, {
    attempts,
    objectKey,
  })

  if (1 + attempts > MAX_ATTEMPTS) {
    console.error(
      `Max attempts reached for message <${objectKey}> - Attempts: <${attempts + 1}>`,
    )

    return await retryOnQueue(objectKey, attempts, true, {
      reason: 'Max attempts reached',
      objectKey,
      attempts,
    })
  }

  const [megaErpCode, productPosition] = basename(
    objectKey,
    extname(objectKey),
  ).split('_')

  const product = await magento.getProductByCode(megaErpCode)

  if (!product.isOk || !product?.value.items.length) {
    console.error(`Error getting product by code <${megaErpCode}>!`, {
      attempts,
      objectKey,
    })

    return await retryOnQueue(objectKey, attempts)
  }

  const position = Number(productPosition)

  const [{ name, media_gallery_entries, sku }] = product.value.items

  const entry = media_gallery_entries.find(o => o.position === position)

  if (entry) {
    console.warn(
      `Product <${name}> already has an entry at position <${position}>!`,
      {
        sku,
        attempts,
        objectKey,
      },
    )

    const removeImageResponse = await magento.removeProductImage({
      sku,
      entry,
      position,
    })

    if (!removeImageResponse.isOk) {
      console.warn(`Error removing image from Magento.`, {
        sku,
        attempts,
        objectKey,
      })

      return await retryOnQueue(objectKey, attempts)
    }

    console.info(`Product <${name}> image at position <${position}> removed!`, {
      sku,
      attempts,
      objectKey,
    })
  }

  const retrieveResponse = (await storage.retrieveObject({
    key: objectKey,
    isBase64: true,
  })) as Result<string, Error>

  if (!retrieveResponse.isOk) {
    console.error(`Error retrieving image from S3.`, {
      sku,
      attempts,
      objectKey,
    })

    return await retryOnQueue(objectKey, attempts)
  }

  const uploadResponse = await magento.uploadProductImage({
    position,
    sku,
    name,
    image: retrieveResponse.value,
  })

  if (!uploadResponse.isOk) {
    console.error(`Error uploading image to Magento!`, {
      sku,
      attempts,
      objectKey,
    })

    return await retryOnQueue(objectKey, attempts)
  }

  /**
   * If the image is the principal image, we need to process it.
   */
  if (position === 0) {
    await principalImageProcessing({
      megaErpCode,
      name,
      position,
      sku,
      image: retrieveResponse.value,
      attempts,
      objectKey,
    })
  }

  console.info(
    `Product <${name}> image at position <${position}> uploaded! Finished!`,
    {
      sku,
      attempts,
      objectKey,
    },
  )
}

const principalImageProcessing = async ({
  megaErpCode,
  name,
  position,
  sku,
  image,
  attempts,
  objectKey,
}: PrincipalImageProcessingInput) => {
  try {
    const { isOk, value } = await magento.getProductByCode(megaErpCode)

    if (!isOk) {
      console.error(`Error getting product by code <${megaErpCode}>!`, {
        sku,
        attempts,
        objectKey,
      })

      return await retryOnQueue(objectKey, attempts)
    }

    const [{ media_gallery_entries }] = value.items

    const entry = media_gallery_entries.find(o => o.position === position)

    /**
     * @TODO: Understand why magic number 2 is being used here.
     */
    if (entry && entry?.types?.length < 2) {
      console.warn(
        `Product <${name}> image at position <${position}> is missing types! `,
        {
          sku,
          attempts,
          objectKey,
        },
      )

      const removeImageResponse = await magento.removeProductImage({
        sku,
        entry,
        position,
      })

      if (!removeImageResponse.isOk) {
        console.warn(`Error removing image from Magento.`, {
          sku,
          attempts,
          objectKey,
        })

        return await retryOnQueue(objectKey, attempts)
      }

      console.info(
        `Product <${name}> image at position <${position}> removed! `,
        {
          sku,
          attempts,
          objectKey,
        },
      )

      const uploadImageResponse = await magento.uploadProductImage({
        position,
        sku,
        name,
        image,
      })

      if (!uploadImageResponse.isOk) {
        console.error(`Error uploading image to Magento!`, {
          sku,
          attempts,
          objectKey,
        })

        return await retryOnQueue(objectKey, attempts)
      }

      console.info(
        `Product <${name}> image at position <${position}> uploaded! `,
        {
          sku,
          attempts,
          objectKey,
        },
      )
    }

    console.info(`Processing principal image for product <${name}>! `, {
      sku,
      attempts,
      objectKey,
    })
  } catch (e) {
    const error = e as Error

    console.error(`Error processing principal image: ${error.message}`, {
      sku,
      attempts,
      objectKey,
    })

    return await retryOnQueue(objectKey, attempts)
  }
}

const retryOnQueue = async (
  objectKey: string,
  attempts: number,
  toDlq = false,
  extra?: Record<string, any>,
): Promise<void> => {
  const { isOk } = await notification.sendToQueue<MessageContent>({
    content: {
      objectKey,
      attempts: attempts + 1,
      extra,
    },
    queueUrl: toDlq
      ? environment.AWS_UPLOADS_PROCESSING_QUEUE_DLQ_URL
      : environment.AWS_UPLOADS_PROCESSING_QUEUE_URL,
  })

  if (!isOk) {
    console.error(
      `Retry: Error sending message to queue! - Image: <${objectKey}>`,
    )
  } else {
    console.info(`Retry: Message <${objectKey}> sent to queue!`)
  }
}
