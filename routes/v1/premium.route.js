import express from "express";
import { PremiumController } from "../../controllers/index.js";

import { AuthMiddleware } from "../../middlewares/index.js";

const router = express.Router();

router.get(
  "/leaderboard",
  AuthMiddleware.isLoggedin,
  PremiumController.getLeaderboard,
);

export default router;
