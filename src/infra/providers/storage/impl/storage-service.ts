import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { HttpStatusCode } from '../../../../common/enums'
import { Result } from '../../../../common/logic'
import { StorageRetrieveObjectProps, StorageService } from '../storage-service'

export class ImplStorageService implements StorageService {
  constructor(
    private readonly client: S3Client,
    private readonly bucketName: string,
  ) {}

  async retrieveObject({
    key,
    isBase64 = false,
  }: StorageRetrieveObjectProps): Promise<Result<string | Buffer, Error>> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const { Body, $metadata } = await this.client.send(command)

      if (
        ![HttpStatusCode.OK, HttpStatusCode.CREATED].includes(
          $metadata.httpStatusCode!,
        )
      ) {
        throw new Error('Failed to retrieve object')
      }

      console.info(
        'StorageService.retrieveObject: Object retrieved successfully',
      )

      if (isBase64) {
        const content = await Body!.transformToString('base64')

        return Result.Ok(content)
      }

      const content = await Body!.transformToString()

      return Result.Ok(Buffer.from(content))
    } catch (e) {
      const error = e as Error

      console.error(
        `StorageService.retrieveObject: Failed to retrieve object: ${error.message}`,
      )

      return Result.Err(error)
    }
  }
}
