import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpenses,
} from "../../controllers/expense.controller.js";
import isLoggedin from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/", isLoggedin, createExpense);
router.get("/all", isLoggedin, getExpenses);
router.delete("/:id", isLoggedin, deleteExpense);


export default router;
