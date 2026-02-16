// errorHandler.js

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode
    let message = err.message || 'Internal Server Error'

    // 🔐 JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401
        message = 'Invalid token'
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401
        message = 'Token expired'
    }

    // 🧠 Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 400
        message = `Invalid ${err.path}`
    }

    // 🧾 Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400
        message = `Duplicate field value: ${Object.keys(err.keyValue)}`
    }

    res.status(statusCode).json({
        success: false,
        message,
        // show stack only in development
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    })
    }

export default errorHandler

