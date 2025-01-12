import { z } from 'zod'
import { zodPrettyIssues } from '../common/helpers'

const schema = z.object({
  M2_API_CONSUMER_KEY: z.string().min(1),
  M2_API_CONSUMER_SECRET: z.string().min(1),
  M2_API_ENDPOINT: z.string().min(1),
  M2_API_TOKEN: z.string().min(1),
  M2_API_TOKEN_SECRET: z.string().min(1),
  AWS_REGION_DEFAULT: z.string().min(1).default('us-east-1'),
  AWS_UPLOADS_BUCKET_NAME: z.string().min(1),
  AWS_UPLOADS_PROCESSING_QUEUE_URL: z.string().min(1),
  AWS_UPLOADS_PROCESSING_QUEUE_DLQ_URL: z.string().min(1),
})

const env = schema.safeParse(process.env)

if (!env.success) {
  throw new Error(zodPrettyIssues(env.error).join('\n'))
}

export const environment = env.data
