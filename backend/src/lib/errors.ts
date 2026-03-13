/**
 * 统一错误类型
 */
export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly code?: string
    ) {
        super(message)
        this.name = 'AppError'
    }
}

export const NotFoundError = (msg = 'Not found') => new AppError(404, msg, 'NOT_FOUND')
export const BadRequestError = (msg: string) => new AppError(400, msg, 'BAD_REQUEST')
export const UnauthorizedError = (msg = 'Unauthorized') => new AppError(401, msg, 'UNAUTHORIZED')
export const ConflictError = (msg: string) => new AppError(409, msg, 'CONFLICT')
