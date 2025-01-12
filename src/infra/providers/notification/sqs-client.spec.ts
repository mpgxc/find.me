import { SQSClient } from '@aws-sdk/client-sqs'
import { environment } from '../../environment'
import { SqsClient } from './sqs-client'

jest.mock('@aws-sdk/client-sqs')

jest.mock('../../environment', () => ({
  environment: {
    AWS_REGION_DEFAULT: 'us-east-1',
  },
}))

describe('SqsClient', () => {
  it('should create a singleton instance', () => {
    expect(SqsClient.getInstance()).toBe(SqsClient.getInstance())
  })

  it('should create an instance with the correct region', () => {
    const instance = SqsClient.getInstance()

    expect(SQSClient).toHaveBeenCalledWith({
      region: environment.AWS_REGION_DEFAULT,
    })

    expect(instance).toBeInstanceOf(SQSClient)
  })

  it('should throw an error if the constructor is called', () => {
    expect(() => new (SqsClient as any)()).toThrow(
      new Error('This class cannot be instantiated'),
    )
  })
})
