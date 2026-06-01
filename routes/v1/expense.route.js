import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  getMonthlyExpense,
  getYearlyExpense,
} from "../../controllers/expense.controller.js";
import isLoggedin from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/", isLoggedin, createExpense);
router.get("/all", isLoggedin, getExpenses);
router.get("/yearly", isLoggedin, getYearlyExpense);
router.get("/monthly", isLoggedin, getMonthlyExpense)
router.delete("/:id", isLoggedin, deleteExpense);


export default router;
