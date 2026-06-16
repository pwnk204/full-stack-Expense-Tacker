import express from "express";
import { ExpenseController } from "../../controllers/index.js";
import { AuthMiddleware, PremiumMiddleware, VerificationMiddleware } from "../../middlewares/index.js";

 const router = express.Router();

router.post("/", AuthMiddleware.isLoggedin, VerificationMiddleware.requireVerification,ExpenseController.createExpense);
router.get("/all", AuthMiddleware.isLoggedin, ExpenseController.getExpenses);
router.get(
  "/yearly",
  AuthMiddleware.isLoggedin,
  PremiumMiddleware.requirePremium,
  ExpenseController.getYearlyExpense,
);
router.get(
  "/monthly",
  AuthMiddleware.isLoggedin,
  PremiumMiddleware.requirePremium,
  ExpenseController.getMonthlyExpense,
);
router.get(
  "/daily/:date",
  AuthMiddleware.isLoggedin,
  ExpenseController.getExpensesByDate,
);
router.delete(
  "/:id",
  AuthMiddleware.isLoggedin,
  ExpenseController.deleteExpense,
);
router.put("/:id", AuthMiddleware.isLoggedin, ExpenseController.updateExpense);

export default router;
