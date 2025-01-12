/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs'
import { HttpStatusCode } from '../../../../common/enums'
import { Result } from '../../../../common/logic'
import {
  NotificationQueueMessageInput,
  NotificationService,
} from '../notification-service'

export class ImplNotificationService implements NotificationService {
  constructor(private readonly client: SQSClient) {}

  async sendToTopic(
    message: object,
    topicArn: string,
    subject?: string,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async sendToQueue<Content>({
    content,
    queueUrl,
    messageGroupId,
  }: NotificationQueueMessageInput<Content>): Promise<Result<unknown, Error>> {
    try {
      const command = Array.isArray(content)
        ? new SendMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: content.map((message, index) => ({
              Id: `message-${new Date().getTime()}-${index}`,
              MessageBody: JSON.stringify(message),
              MessageGroupId: messageGroupId,
            })),
          })
        : new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(content),
            MessageGroupId: messageGroupId,
          })

      const { $metadata } = await this.client.send(
        command as SendMessageBatchCommand & SendMessageCommand,
      )

      if (
        ![HttpStatusCode.OK, HttpStatusCode.CREATED].includes(
          $metadata.httpStatusCode!,
        )
      ) {
        throw new Error('Failed to send message to queue')
      }

      console.info('NotificationService.sendToQueue: Message sent successfully')

      return Result.Ok()
    } catch (e) {
      const error = e as Error

      console.error(
        `NotificationService.sendToQueue: Unexpected error: ${error.message}`,
      )

      return Result.Err(error)
    }
  }
}
