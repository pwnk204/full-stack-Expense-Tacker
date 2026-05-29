import express from "express";
import {createOrder, paymentVerify} from '../../controllers/payment.controller.js';

import isLoggedin from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/", createOrder);
router.get("/payment-status/:orderId", paymentVerify)

export default router;
