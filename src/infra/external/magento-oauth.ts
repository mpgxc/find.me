import { Method } from 'axios'
import * as crypto from 'node:crypto'
import * as OAuth from 'oauth-1.0a'
import { environment } from '../environment'

export const buildAuthorizationHeaderToken = (method: Method, url: string) => {
  const oauth = new OAuth({
    consumer: {
      key: environment.M2_API_CONSUMER_KEY,
      secret: environment.M2_API_CONSUMER_SECRET,
    },
    signature_method: 'HMAC-SHA256',
    hash_function: (base_string, key) =>
      crypto.createHmac('sha256', key).update(base_string).digest('base64'),
  })

  const authorization = oauth.authorize(
    {
      url: `${environment.M2_API_ENDPOINT}${url}`,
      method,
    },
    {
      key: environment.M2_API_TOKEN,
      secret: environment.M2_API_TOKEN_SECRET,
    },
  )

  return oauth.toHeader(authorization).Authorization
}
