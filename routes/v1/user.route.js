import express from "express";
import {
  registerUser,
  verifyUser,
  login,
  getMe,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
} from "../../controllers/user.controller.js";
import isLoggedin from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/register", registerUser);

router.get("/verify/:token", verifyUser);

router.post("/login", login);

router.get("/me", isLoggedin, getMe)

router.post('/resend-verification', isLoggedin, resendVerificationEmail);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password/:token', resetPassword);

export default router;
