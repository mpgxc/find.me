type ApplicationErrorProps = {
  type:
    | 'ApplicationError'
    | 'ValidationError'
    | 'UnexpectedError'
    | 'RepositoryError'
  name: string
  message: string
}

export class ApplicationError extends Error {
  public timestamp: Date
  public name: string
  public type: string

  private constructor({ message, name, type }: ApplicationErrorProps) {
    super(message)

    this.name = name
    this.type = type
    this.timestamp = new Date()
  }

  get formatedMessage() {
    return `[${this.timestamp.toLocaleDateString()}] - ${this.type}/${
      this.name
    } - ${this.message}`
  }

  static build({ message, name, type }: ApplicationErrorProps) {
    return new this({
      type,
      name,
      message,
    })
  }
}

export type ExternalException = Error & {
  response: {
    data?: {
      message: string
    }
  }
}
