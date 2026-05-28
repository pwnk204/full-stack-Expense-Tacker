

const errorHandler = async (err, req, res, next) => {

    // console.log("entered into the errorHanlder, let's check statusCode: ", err);
    console.log("Inside errhandler funtion: ", err.cause);
    console.log(err.statusCode);

    const errorResponse = {
        success : err.success,
        message: err.message,
    }

    // console.log("response through errorHandler: ", errorResponse);

    res.status(err.statusCode).json(errorResponse);
};

export default errorHandler;