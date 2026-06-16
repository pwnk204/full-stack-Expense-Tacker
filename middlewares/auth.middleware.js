import jwt from "jsonwebtoken";

import { AppError, logger } from "../utils/index.js"; 
import { StatusCodes } from "http-status-codes";
import { User } from '../models/index.js';

export const isLoggedin = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

   
    if (!token) {
      logger.warn("Authentication rejected: No token provided in cookies", { path: req.originalUrl });
      return next(
        new AppError(
          "Access denied. Please log in to continue.",
          StatusCodes.UNAUTHORIZED,
        ),
      );
    }

    

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      
      logger.warn("Authentication rejected: User attached to token no longer exists", { userId: decoded.userId });
      return next(
        new AppError(
          "The user belonging to this token no longer exists.",
          StatusCodes.UNAUTHORIZED,
        ),
      );
    }

    req.userId = decoded.userId;

  
    logger.debug("User authenticated successfully", { userId: req.userId, path: req.originalUrl });

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      
      logger.warn("Authentication rejected: Invalid token signature", { path: req.originalUrl });
      return next(
        new AppError(
          "Invalid token. Please log in again.",
          StatusCodes.UNAUTHORIZED,
        ),
      );
    }
    
    if (error.name === "TokenExpiredError") {
     
      logger.info("Authentication rejected: Token expired naturally");
      return next(
        new AppError(
          "Your token has expired. Please log in again.",
          StatusCodes.UNAUTHORIZED,
        ),
      );
    }

    
    logger.error("Critical error in authentication middleware", { error: error.message });
    next(error);
  }
};