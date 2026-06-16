import express from "express";
import { PaymentController } from "../../controllers/index.js";

import { AuthMiddleware } from "../../middlewares/index.js";

const router = express.Router();

router.post("/", AuthMiddleware.isLoggedin, PaymentController.createOrder);
router.get(
  "/payment-status/:orderId",
  AuthMiddleware.isLoggedin,
  PaymentController.paymentVerify,
);

export default router;
