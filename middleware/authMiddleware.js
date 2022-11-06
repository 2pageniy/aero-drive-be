const jwt = require('jsonwebtoken');
const ApiError = require("../error/ApiError");

module.exports = function (req, res, next) {
    try {
        if (req.method === 'OPTIONS') {
            return next()
        }

        const authorizationHeader = req.headers.authorization
        if (!authorizationHeader) {
            next(ApiError.unauthorizedError())
        }

        const token = authorizationHeader.split(' ')[1]
        if(!token) {
            next(ApiError.unauthorizedError())
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        req.user = decoded;

        return next();
    } catch (e) {
        next(ApiError.unauthorizedError())
    }
}