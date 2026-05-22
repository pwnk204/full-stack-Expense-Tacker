import { Expense } from "../models/index.js";
import AppError from "../utils/errors/app.error.js";
import { StatusCodes } from "http-status-codes";

const createExpense = async (req, res, next) => {
  try {
    const { amount, date, category, description, transactionType, userId } = req.body;

    if (!category || !date || !amount || !description || !transactionType || !userId) {
      return next(new AppError("All fields are required", "BAD_REQUEST", 400));
    }

    const expense = await Expense.create({
      description: description,
      category: category,
      date: date,
      amount: amount,
      transactionType: transactionType,
      userId: userId
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "expense created successfully",
      data: { expense: expense },
    });
  } catch (error) {
    next(
      new AppError(
        "Error creating expense",
        String(StatusCodes.INTERNAL_SERVER_ERROR),
        500,
        { cause: error },
      ),
    );
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.findAll();

    res.status(StatusCodes.OK).json({
      success: "true",
      message: "fetched all the expenses successfully",
      data: { expenses: expenses },
    });
  } catch (error) {
    next(
      new AppError(
        "Error fetching expenses",
        String(StatusCodes.INTERNAL_SERVER_ERROR),
        500,
        { cause: error },
      ),
    );
  }
};

export {
    createExpense,
    getExpenses,
}
