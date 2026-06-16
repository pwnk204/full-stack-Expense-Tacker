import { Expense, sequelize } from "../models/index.js";
import { Op, Sequelize } from "sequelize";
import { AppError, ApiResponse, logger } from "../utils/index.js";
import { INTERNAL_SERVER_ERROR, StatusCodes } from "http-status-codes";
import { GoogleGenerativeAI } from "@google/generative-ai";

const createExpense = async (req, res, next) => {
  try {
    const { amount, date, description, transactionType } = req.body;

    
    logger.info("Expense creation initiated", { userId: req.userId, transactionType, amount });

    if (!date || !amount || !description || !transactionType || !req.userId) {
      return next(new AppError("All fields are required", "BAD_REQUEST", 400));
    }

    let category = "other";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    try {
      const prompt = `
            You are an AI assistant for an expense tracker application. 
            Categorize the following expense based on its description and amount.
            
            Description: "${description}"
            Amount: ${amount}
            
            You MUST reply with exactly ONE word from this exact list: 
            [Food, Transport, Utilities, Entertainment, Health, Shopping, Salary, Other]
            
            Do not include punctuation, explanations, or any other words. Just the category name.
        `;

      const result = await model.generateContent(prompt);
      const categoryResponse = result.response.text().trim();

      category = categoryResponse;
    } catch (error) {
     
      logger.warn("Gemini AI categorization failed, falling back to 'other'", { 
          userId: req.userId, 
          error: error.message 
      });
    }

    const newExpense = await sequelize.transaction(async (t) => {
      const expense = await Expense.create(
        {
          description: description,
          date: date,
          amount: amount,
          transactionType: transactionType,
          userId: req.userId,
          category: category,
        },
        { transaction: t },
      );
      return expense;
    });

   
    logger.info("Expense created successfully", { expenseId: newExpense.id, userId: req.userId, category });

    res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse("expense created successfully", StatusCodes.CREATED),
      );
  } catch (error) {
    logger.error("Error creating expense", { userId: req.userId, error: error.message });
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    logger.info("Fetching all expenses for user", { userId: req.userId });

    const expenses = await Expense.findAll({ where: { userId: req.userId } });

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          "fetched all the expenses successfully",
          StatusCodes.OK,
          { expenses: expenses },
        ),
      );
  } catch (error) {
    logger.error("Error fetching all expenses", { userId: req.userId, error: error.message });
    next(error);
  }
};

const getExpensesByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    const pageNo = parseInt(req.query.pageNo) || 1;
    const offset = (pageNo - 1) * limit;

    logger.info("Fetching expenses by date", { userId: req.userId, date, pageNo });

    const { count, rows } = await Expense.findAndCountAll({
      where: { date: date, userId: req.userId },
      offset: offset,
      limit: limit,
    });

    
    logger.info("Expenses by date fetched successfully", { userId: req.userId, recordCount: count });

    res.status(StatusCodes.OK).json(
      new ApiResponse("fetched all the expenses successfully", StatusCodes.OK, {
        expenses: rows,
        count: count,
      }),
    );
  } catch (error) {
    logger.error("Error fetching expenses by date", { userId: req.userId, error: error.message });
    next(error);
  }
};

const getMonthlyExpense = async (req, res, next) => {
  try {
    const { year } = req.query;
    const month = parseInt(req.query.month);
    
    logger.info("Fetching monthly expense summary", { userId: req.userId, year, month });

    const formattedMonth = (month + 1).toString().padStart(2, "0");
    const lastDay = new Date(year, month + 1, 0).getDate();

    const startDate = `${year}-${formattedMonth}-01`;
    const endDate = `${year}-${formattedMonth}-${lastDay}`;

    const monthlySummary = await Expense.findAll({
      where: {
        userId: req.userId,
        date: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        [sequelize.fn("DAY", sequelize.col("date")), "day"],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              `CASE WHEN transactionType = 'credit' THEN amount ELSE 0 END`,
            ),
          ),
          "totalIncome",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              `CASE WHEN transactionType = 'debit' THEN amount ELSE 0 END`,
            ),
          ),
          "totalExpense",
        ],
      ],
      group: [sequelize.fn("DAY", sequelize.col("date"))],
      order: [[sequelize.fn("DAY", sequelize.col("date")), "ASC"]],
    });

    logger.info("Monthly expense summary fetched successfully", { userId: req.userId, daysReturned: monthlySummary.length });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("fetched all the expenses by month successfully",StatusCodes.OK, { data: monthlySummary }));
  } catch (error) {
    logger.error("Error fetching monthly expenses", { userId: req.userId, error: error.message });
    next(error);
  }
};

const getYearlyExpense = async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    logger.info("Fetching yearly expense summary", { userId: req.userId, targetYear });

    const yearlySummary = await Expense.findAll({
      where: {
        userId: req.userId,
        date: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("date")), "month"],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              `CASE WHEN transactionType = 'credit' THEN amount ELSE 0 END`,
            ),
          ),
          "totalIncome",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              `CASE WHEN transactionType = 'debit' THEN amount ELSE 0 END`,
            ),
          ),
          "totalExpense",
        ],
      ],
      group: [sequelize.fn("MONTH", sequelize.col("date"))],
      order: [[sequelize.fn("MONTH", sequelize.col("date")), "ASC"]],
    });
    
    logger.info("Yearly expense summary fetched successfully", { userId: req.userId, monthsReturned: yearlySummary.length });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("fetched all the expenses by month successfully",StatusCodes.OK, { data: yearlySummary }));
  } catch (error) {
    logger.error("Error fetching yearly expenses", { userId: req.userId, error: error.message });
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { amount, transactionType, date, description } = req.body;
    const id = parseInt(req.params.id);

    logger.info("Expense update initiated", { userId: req.userId, expenseId: id });

    let category = "other";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    try {
      const prompt = `
            You are an AI assistant for an expense tracker application. 
            Categorize the following expense based on its description and amount.
            
            Description: "${description}"
            Amount: ${amount}
            
            You MUST reply with exactly ONE word from this exact list: 
            [Food, Transport, Utilities, Entertainment, Health, Shopping, Salary, Other]
            
            Do not include punctuation, explanations, or any other words. Just the category name.
        `;

      const result = await model.generateContent(prompt);
      const categoryResponse = result.response.text().trim();

      category = categoryResponse;
    } catch (error) {
      logger.warn("Gemini AI categorization failed during update, falling back to 'other'", { 
          userId: req.userId, 
          expenseId: id,
          error: error.message 
      });
    }

    await sequelize.transaction(async (t) => {
      const expense = await Expense.findOne({
        where: { userId: req.userId, id: id },
        transaction: t,
      });

      if (!expense) {
       
        logger.warn("Expense update failed: Not found or unauthorized", { userId: req.userId, expenseId: id });
        throw new AppError(
          "Expense not found or you are not authorized to edit it.",
          "NOT_FOUNT",
          404,
        );
      }

      expense.amount = amount;
      expense.transactionType = transactionType;
      expense.date = date;
      expense.description = description;
      expense.category = category; 

      await expense.save({ transaction: t });
    });

    logger.info("Expense updated successfully", { userId: req.userId, expenseId: id });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("Expense updated successfully", StatusCodes.OK));
  } catch (error) {
    logger.error("Error updating expense", { userId: req.userId, expenseId: req.params.id, error: error.message });
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const userId = req.userId;
    
    logger.info("Expense deletion requested", { userId, expenseId });

    await sequelize.transaction(async (t) => {
      const deletedExpenseRow = await Expense.destroy({
        where: { id: expenseId, userId: userId },
        transaction: t,
      });

      if (deletedExpenseRow === 0) {
        logger.warn("Expense deletion failed: Not found or unauthorized", { userId, expenseId });
        throw new AppError(
          "Expense not found or unauthorized",
          StatusCodes.NOT_FOUND,
        );
      }
    });

    logger.info("Expense deleted successfully", { userId, expenseId });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("Expense deleted successfully.", StatusCodes.OK));
  } catch (error) {
    logger.error("Error deleting expense", { userId: req.userId, expenseId: req.params.id, error: error.message });
    next(error);
  }
};

export {
  createExpense,
  getExpenses,
  deleteExpense,
  getExpensesByDate,
  getMonthlyExpense,
  getYearlyExpense,
  updateExpense,
};