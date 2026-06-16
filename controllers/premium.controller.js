import { Expense, User, sequelize } from "../models/index.js";
import { AppError, ApiResponse, logger } from "../utils/index.js";
import { StatusCodes } from "http-status-codes";

const getLeaderboard = async (req, res, next) => {
  try {
   
    logger.info("Leaderboard request initiated", { userId: req.userId });

    const requester = await User.findByPk(req.userId);

    if (!requester.isPremium) {
      
      logger.warn("Leaderboard access denied: User is not premium", { userId: req.userId });
      
      return next(
        new AppError(
          "Access Denied. Premium members only.",
          StatusCodes.FORBIDDEN,
        ),
      );
    }

    const leaderboard = await User.findAll({
      attributes: ["id", "userName", "totalExpense"],
      order: [["totalExpense", "DESC"]],
    });

   
    logger.info("Leaderboard fetched successfully", { 
        userId: req.userId, 
        totalRecords: leaderboard.length 
    });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("Leaderboard fetched successfully", StatusCodes.OK, { leaderboard: leaderboard }));
      
  } catch (error) {
  
    logger.error("Error while fetching leaderboard", { 
        userId: req.userId, 
        error: error.message,
        stack: error.stack 
    });
    next(error);
  }
};

export { getLeaderboard };