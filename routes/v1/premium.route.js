import express from "express";
import {getLeaderboard} from '../../controllers/premium.controller.js';

import isLoggedin from '../../middlewares/auth.middleware.js';

const router = express.Router();


router.get("/leaderboard", isLoggedin, getLeaderboard)

export default router;
