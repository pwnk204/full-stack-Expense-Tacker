import { StatusCodes } from 'http-status-codes';
import { User } from '../models/index.js';
import { AppError, logger } from '../utils/index.js';

export const requireVerification = async (req, res, next) => {
    try {

        const user = await User.findByPk(req.userId);

        if (!user) {
            return next(new AppError("User not found", StatusCodes.NOT_FOUND));
        }

        if (!user.isVerified) {
            logger.warn("Access denied: Unverified user attempted to use protected feature", { 
                userId: req.userId, 
                path: req.originalUrl 
            });
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "Please verify your email to access this feature.",
                requiresVerification: true  
            });
        }

        next();
    } catch (error) {
        logger.error("Error during verification check", { error: error.message });
        next(error);
    }
};