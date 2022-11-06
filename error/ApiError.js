module.exports = class ApiError extends Error {
    status;
    errors;

    constructor(status, message, errors = []) {
        super(message);
        this.status = status
        this.errors = errors
    }

    static unauthorizedError() {
        return new ApiError(401, 'Пользователь не авторизован')
    }

    static badRequest(message, errors = []) {
        return new ApiError(400, message, errors)
    }

    static forbidden() {
        return new ApiError(403, "Нет доступа")
    }

    static notFound() {
        return new ApiError(404, 'Страница не существует')

    }

    static internal(message, errors = []) {
        return new ApiError(500, message, errors)
    }
}
