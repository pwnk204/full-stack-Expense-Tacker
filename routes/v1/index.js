import express from 'express';
import ExpenseRouter from './expense.route.js';
import PaymentRouter  from "./payment.route.js";
import UserRouter from './user.route.js';
import PremiumRouter from './premium.route.js';
import LogRouter from './log.route.js'

const router = express.Router();

router.use('/expense', ExpenseRouter);
router.use('/user', UserRouter);
router.use('/premium', PremiumRouter);
router.use('/payment', PaymentRouter);
router.use('/frontend-logs', LogRouter);

export default router;