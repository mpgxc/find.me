import { Result } from '../../../common/logic'

export type NotificationQueueMessageInput<Content> = {
  content: Content | Content[]
  queueUrl: string
  messageGroupId?: string
}

export interface NotificationService {
  /**
   * Send a message to a topic
   */
  sendToTopic(
    message: object,
    topicArn: string,
    subject?: string,
  ): Promise<void>

  /**
   * Send a message to a queue
   */
  sendToQueue<Content>(
    props: NotificationQueueMessageInput<Content>,
  ): Promise<Result<unknown, Error>>
}
