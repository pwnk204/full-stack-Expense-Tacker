import {getReasonPhrase} from 'http-status-codes';

class AppError extends Error {
    constructor(message, statusCode, options = {}){

        super(message, options); //parent class Error

        this.name = this.constructor.name;
        this.message = message;
        this.statusCode = statusCode;
        this.success = false;

        try {
            this.statusMessage = getReasonPhrase(this.statusCode);
        } catch (error) {
            this.statusMessage = 'ERROR'; 
        }


        Error.captureStackTrace(this, this.constructor);
    }
    
};


export default AppError