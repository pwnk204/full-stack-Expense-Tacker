export const errorHandler = async (err, req, res, next) => {

    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;
    error.success = err.success !== undefined ? err.success : false;

    console.error("Error Log:", err.name, err.message);

    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = `Duplicate field value entered: ${err.errors[0].message}`;
        error = new AppError(message, "BAD_REQUEST", 400);
    }

    
    if (err.name === 'SequelizeValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new AppError(message, "VALIDATION_ERROR", 400);
    }

    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token. Please log in again.';
        error = new AppError(message, "UNAUTHORIZED", 401);
    }

    if (process.env.NODE_ENV === 'production' && error.statusCode === 500) {
        error.message = "Something went wrong on our end. Please try again later.";
    }

    res.status(error.statusCode).json({
        success: error.success,
        statusMessage: error.statusMessage || "ERROR",
        message: error.message,
        
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};
