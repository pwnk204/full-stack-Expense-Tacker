import { Expense } from "../models/index.js";
import AppError from "../utils/errors/app.error.js";
import { StatusCodes } from "http-status-codes";

const createExpense = async (req, res, next) => {
  try {
    console.log("inside createExpense: ", req.userId);
    const { amount, date, category, description, transactionType } = req.body;

    console.log("req.body: ", req.body);

    if (
      !category ||
      !date ||
      !amount ||
      !description ||
      !transactionType ||
      !req.userId
    ) {
      return next(new AppError("All fields are required", "BAD_REQUEST", 400));
    }

    const expense = await Expense.create({
      description: description,
      category: category,
      date: date,
      amount: amount,
      transactionType: transactionType,
      userId: req.userId,
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
        "INTERNAL_SERVER_ERROR",
        StatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      ),
    );
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.findAll({where: {userId: req.userId}});

    res.status(StatusCodes.OK).json({
      success: "true",
      message: "fetched all the expenses successfully",
      expenses: expenses,
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

const deleteExpense = async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const userId = req.userId;

    const deletedExpenseRow = await Expense.destroy({
      where: { id: expenseId, userId: userId },
    });

    if (deletedExpenseRow === 0) {
      return next(
        new AppError(
          "Expense not found or unauthorized",
          "NOT_FOUND",
          StatusCodes.NOT_FOUND,
        ),
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Expense deleted successfully!",
    });
  } catch (error) {
    console.log("delete Expense error: ", error);
    return next(
      new AppError(
        "Internal server error during deleting expense.",
        "INTERNAL_SERVER_ERROR",
        StatusCodes.INTERNAL_SERVER_ERROR,
        {cause: error}
      ),
    );
  }
};

export { createExpense, getExpenses, deleteExpense };
