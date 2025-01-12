import { z } from 'zod'

/**
 * lambdaResponse is a helper function that returns a lambda response object.
 */
export const lambdaResponse = (
  data: Record<string, unknown>,
  statusCode: number,
  toApiGateway = false,
) => {
  const body = (
    Object.keys(data).length ? JSON.stringify(data) : undefined
  ) as string

  const payload = {
    statusCode,
    body,
  }

  if (toApiGateway && !String(statusCode).startsWith('2')) {
    throw new Error(JSON.stringify(payload))
  }

  return payload
}

/**
 * zodErrorPretty is a helper function that returns a pretty error message from a zod error.
 */
export const zodPrettyIssues = ({ issues }: z.ZodError) =>
  issues.map(({ message, path }) => `${path.join('.')}: ${message}`)

export const jsonSafeParse = (json: string) => {
  try {
    return JSON.parse(json)
  } catch (error) {
    return null
  }
}
