import express from "express";
import {
  registerUser,
  verifyUser,
  login,
  getMe,
} from "../../controllers/user.controller.js";
import isLoggedin from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/register", registerUser);

router.get("/verify/:token", verifyUser);

router.post("/login", login);

router.get("/me", isLoggedin, getMe)

export default router;
