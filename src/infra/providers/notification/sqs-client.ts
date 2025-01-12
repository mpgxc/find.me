import { SQSClient as Client } from '@aws-sdk/client-sqs'
import { environment } from '../../environment'

export class SqsClient {
  private static instance: Client

  private constructor() {
    throw new Error('This class cannot be instantiated')
  }

  static getInstance = (): Client => {
    if (!SqsClient.instance) {
      SqsClient.instance = SqsClient.createInstance()
    }

    return SqsClient.instance
  }

  private static createInstance = (): Client =>
    new Client({
      region: environment.AWS_REGION_DEFAULT,
    })
}
