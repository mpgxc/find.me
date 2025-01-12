import { S3Client as AWS_S3Client } from '@aws-sdk/client-s3'
import { environment } from '../../environment'
import { S3Client } from './s3-client'

jest.mock('@aws-sdk/client-s3')

jest.mock('../../environment', () => ({
  environment: {
    AWS_REGION_DEFAULT: 'us-east-1',
  },
}))

describe('S3Client', () => {
  it('should create a singleton instance', () => {
    expect(S3Client.getInstance()).toBe(S3Client.getInstance())
  })

  it('should create an instance with the correct region', () => {
    const instance = S3Client.getInstance()

    expect(AWS_S3Client).toHaveBeenCalledWith({
      region: environment.AWS_REGION_DEFAULT,
    })

    expect(instance).toBeInstanceOf(AWS_S3Client)
  })

  it('should throw an error if the constructor is called', () => {
    expect(() => new (S3Client as any)()).toThrow(
      new Error('This class cannot be instantiated'),
    )
  })
})
