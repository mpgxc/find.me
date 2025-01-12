import { S3Event } from 'aws-lambda'
import { environment } from '../infra/environment'
import { ImplNotificationService } from '../infra/providers/notification/impl/notification-service'
import { SqsClient } from '../infra/providers/notification/sqs-client'

const notification = new ImplNotificationService(SqsClient.getInstance())

export type MessageContent = {
  objectKey: string
  attempts: number
  extra?: Record<string, any>
}

export const handler = async (event: S3Event): Promise<void> => {
  try {
    const [{ s3 }] = event.Records

    console.info(
      `Producer Handler: Processing S3 object <${s3.object.key}> from bucket <${s3.bucket.name}>`,
    )

    const { isOk, value } = await notification.sendToQueue<MessageContent>({
      content: {
        objectKey: s3.object.key,
        attempts: 0,
      },
      queueUrl: environment.AWS_UPLOADS_PROCESSING_QUEUE_URL,
    })

    if (!isOk) {
      throw new Error(
        `Producer Handler: Error sending S3 object <${s3.object.key}> to queue <${environment.AWS_UPLOADS_PROCESSING_QUEUE_URL}>: ${value}`,
      )
    }

    console.info(
      `Producer Handler: S3 object <${s3.object.key}> sent to queue <${environment.AWS_UPLOADS_PROCESSING_QUEUE_URL}>`,
    )
  } catch (e) {
    const error = e as Error

    console.error(`Error processing S3 event: ${error.message}`)

    throw error
  }
}
