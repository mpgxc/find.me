import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'
import { HttpStatusCode } from './common/enums'
import { lambdaResponse } from './common/helpers'

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.info({ event, context }, 'event > start')

  const health = {
    message: 'Ok',
    uptime: `${process.uptime()}s`,
    timestamp: new Date().toISOString(),
  }

  return lambdaResponse({ health }, HttpStatusCode.OK, true)
}
