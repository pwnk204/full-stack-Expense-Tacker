import { Expense, sequelize } from "../models/index.js";

import { Op, Sequelize } from "sequelize";
import AppError from "../utils/errors/app.error.js";
import { INTERNAL_SERVER_ERROR, StatusCodes } from "http-status-codes";
import { GoogleGenerativeAI } from "@google/generative-ai";

const createExpense = async (req, res, next) => {
  try {
    console.log("inside createExpense: ", req.userId);
    const { amount, date, description, transactionType } = req.body;

    console.log("req.body: ", req.body);

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
      console.error("Gemini AI categorization failed:", error);
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

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "expense created successfully",
      data: { expense: newExpense },
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
    const expenses = await Expense.findAll({ where: { userId: req.userId } });

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

const getExpensesByDate = async (req, res, next) => { 
  try {
    const {date} = req.params;

    const limit = parseInt(req.query.limit)|| 5;

    const pageNo = parseInt(req.query.pageNo) || 1;

    const offset = (pageNo-1)*limit;

    const {count, rows} = await Expense.findAndCountAll({ where: { date: date, userId: req.userId }, offset: offset, limit: limit });

    console.log("getExpenseByDate Count: ", count);
    console.log("getExpenseDate: ", rows);

    res.status(StatusCodes.OK).json({
      success: "true",
      message: "fetched all the expenses successfully",
      expenses: rows,
      count: count
    });

  } catch (error) {

    return next(
      new AppError(
        "Error fetching expenses",
        String(StatusCodes.INTERNAL_SERVER_ERROR),
        500,
        { cause: error },
      ),
    );
    
  }
 }

const getMonthlyExpense = async (req, res, next) => {
  try {
    console.log("monthly data");
    const { year } = req.query;
    const month = parseInt(req.query.month);
    console.log("month: ", month, " ", typeof month);
    const formattedMonth = (month+1).toString().padStart(2, "0");
    const lastDay = new Date(year, (month+1), 0).getDate();

    const startDate = `${year}-${formattedMonth}-01`;
    const endDate = `${year}-${formattedMonth}-${lastDay}`;

    console.log("startDate: ", startDate);
    console.log("endDate: ", endDate);

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

    console.log("monthly data: ", monthlySummary);

    res.status(200).json({ success: true, data: monthlySummary });
  } catch (error) {
    return next(
      new AppError(
        "INERNAL SERVER ERROR monthly",
        INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      ),
    );
  }
};


const getYearlyExpense = async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

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

    res.status(200).json({ success: true, data: yearlySummary });
  } catch (error) {
    return next(
      new AppError(
        "INERNAL SERVER ERROR yearly",
        INTERNAL_SERVER_ERROR,
        StatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      ),
    );
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const userId = req.userId;

    await sequelize.transaction(async (t) => {
      const deletedExpenseRow = await Expense.destroy({
        where: { id: expenseId, userId: userId },
        transaction: t,
      });

      if (deletedExpenseRow === 0) {
        throw new AppError(
          "Expense not found or unauthorized",
          "NOT_FOUND",
          StatusCodes.NOT_FOUND,
        );
      }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Expense deleted successfully!",
    });
  } catch (error) {
    console.log("delete Expense error: ", error);

    if (error instanceof AppError) {
      return next(error);
    }

    return next(
      new AppError(
        "Internal server error during deleting expense.",
        "INTERNAL_SERVER_ERROR",
        StatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      ),
    );
  }
};

export {
  createExpense,
  getExpenses,
  deleteExpense,
  getExpensesByDate,
  getMonthlyExpense,
  getYearlyExpense,
};
