import express from "express";
import { UserController } from "../../controllers/index.js";
import {
  AuthMiddleware,
  ValidatorMiddleware,
} from "../../middlewares/index.js";

const router = express.Router();

router.post(
  "/register",
  ValidatorMiddleware.signupValidator,
  ValidatorMiddleware.validateRequest,
  UserController.registerUser,
);

router.get("/verify/:token", UserController.verifyUser);

router.post(
  "/login",
  ValidatorMiddleware.loginValidator,
  ValidatorMiddleware.validateRequest,
  UserController.login,
);

router.get("/me", AuthMiddleware.isLoggedin, UserController.getMe);

router.post(
  "/resend-verification",
  AuthMiddleware.isLoggedin,
  UserController.resendVerificationEmail,
);

router.post(
  "/forgot-password",
  ValidatorMiddleware.forgotPasswordValidator,
  ValidatorMiddleware.validateRequest,
  UserController.forgotPassword,
);

router.post("/reset-password/:token", UserController.resetPassword);

router.post(
  "/change-password",
  ValidatorMiddleware.resetPasswordValidator,
  ValidatorMiddleware.validateRequest,
  AuthMiddleware.isLoggedin,
  UserController.changePassword,
);

router.get("/logout", AuthMiddleware.isLoggedin, UserController.logout);

router.delete(
  "/delete",
  AuthMiddleware.isLoggedin,
  UserController.deleteAccount,
);

export default router;
