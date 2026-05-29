import { Expense, User, sequelize } from "../models/index.js";
import AppError from "../utils/errors/app.error.js";
import { StatusCodes } from "http-status-codes";

const getLeaderboard = async (req, res, next) => {
  try {
    const requester = await User.findByPk(req.userId);

    if (!requester.isPremium) {
      return next(
        new AppError(
          "Access Denied. Premium members only.",
          "Forbidden",
          StatusCodes.FORBIDDEN,
        ),
      );
    }

    const leaderboard = await User.findAll({
      attributes: ["id", "userName", "totalExpense"], 
      order: [["totalExpense", "DESC"]],
    });

    res.status(StatusCodes.OK).json(leaderboard);
  } catch (error) {
    console.log("Error while fetching leaderboard: ", error);
    return next(
      new AppError(
        "Something went wrong with leaderboard premium service",
        "Forbidden",
        StatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      ),
    );
  }
};

export { getLeaderboard };
