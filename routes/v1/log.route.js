import { Router } from "express";
import { FrontendLogs } from "../../controllers/index.js";

const router = Router();

router.post("/", FrontendLogs.receiveFrontendLogs);

export default router;