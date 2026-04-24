export class ServiceError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details: unknown

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details: unknown = {}
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError
}
