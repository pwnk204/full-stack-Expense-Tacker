import jwt from "jsonwebtoken"
import AppError from '../utils/errors/app.error.js';
import {StatusCodes} from 'http-status-codes';

const isLoggedin = async (req, res, next) => {

    try {
        console.log("inside auth middleware: ", req.body);
        
        const token = req.cookies?.token

        if(!token) {
            return next(new AppError("Access denied. Please log in to continue.","BAD_REQUEST" , StatusCodes.BAD_REQUEST));
        }

        const decoded = await jwt.verify(token, process.env.JWT_SECRET);

        console.log("decoded: ", decoded);

        req.userId = decoded.userId;

        console.log("auth mid added userId in req. object: ", req.body);

        next();
    } catch (error) {

        console.error("Auth Middleware Error:", error);
        return next(new AppError(  
            "Invalid or expired token. Please log in again.",
            "UNAUTHORIZED",
            StatusCodes.UNAUTHORIZED
        ));
        
    }

}

export default isLoggedin