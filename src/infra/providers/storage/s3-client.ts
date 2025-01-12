import { S3Client as Client } from '@aws-sdk/client-s3'
import { environment } from '../../environment'

export class S3Client {
  private static instance: Client

  private constructor() {
    throw new Error('This class cannot be instantiated')
  }

  static getInstance = (): Client => {
    if (!S3Client.instance) {
      S3Client.instance = S3Client.createInstance()
    }

    return S3Client.instance
  }

  private static createInstance = (): Client =>
    new Client({
      region: environment.AWS_REGION_DEFAULT,
    })
}
