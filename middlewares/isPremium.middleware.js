import { StatusCodes } from 'http-status-codes';
import { User } from '../models/index.js';
import { AppError, logger } from '../utils/index.js';

export const requirePremium = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId);

        if (!user) {
            
            logger.warn("Premium check failed: User not found in database", { 
                userId: req.userId, 
                path: req.originalUrl 
            });
            return next(new AppError("User not found", StatusCodes.NOT_FOUND));
        }
        
        if (user.isPremium === true) {
            
            logger.debug("Premium access granted", { 
                userId: req.userId, 
                path: req.originalUrl 
            });
            next(); 
        } else {
           
            logger.warn("Premium access denied: Free user hit paywall", { 
                userId: req.userId, 
                path: req.originalUrl 
            });

            return res.status(StatusCodes.FORBIDDEN).json({ 
                success: false, 
                message: "This feature requires a Premium Membership.",
                requiresUpgrade: true 
            });
        }
    } catch (error) {
       
        logger.error("Critical error during premium authorization", { 
            userId: req.userId, 
            path: req.originalUrl,
            error: error.message 
        });
        next(error);
    }
};