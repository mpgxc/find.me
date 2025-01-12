import { handler } from './main'

describe('Handler', () => {
  it('should return a valid response', async () => {
    const { body, statusCode } = await handler({} as never, {} as never)

    expect(statusCode).toBe(200)
    expect(body).toBeDefined()

    const { health } = JSON.parse(body)

    expect(health).toBeDefined()
    expect(health.message).toBe('Ok')
    expect(health.uptime).toBeDefined()
    expect(health.timestamp).toBeDefined()
  })
})
