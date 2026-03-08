export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, message);
}

export function unauthorized(message = "Unauthorized"): ApiError {
  return new ApiError(401, message);
}

export function forbidden(message = "Forbidden"): ApiError {
  return new ApiError(403, message);
}

export function notFound(message = "Not found"): ApiError {
  return new ApiError(404, message);
}
