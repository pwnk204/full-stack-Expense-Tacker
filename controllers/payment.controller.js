import { AppError, ApiResponse, logger } from "../utils/index.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import { User, Order, sequelize } from "../models/index.js";
import { CashFreeService, BrevoEmailService } from "../services/index.js";
import dotenv from "dotenv"



const createOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    

    logger.info("Order creation initiated", { userId });

    const user = await User.findByPk(userId);
    if (!user) {
     
      logger.warn("Order creation failed: User not found", { userId });
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(new ApiResponse("User not found", StatusCodes.NOT_FOUND));
    }

    const order_id = `order_${crypto.randomUUID()}`;

    await Order.create({
      orderId: order_id,
      userId: userId,
    });

    const request = {
      order_amount: 1.0,
      order_currency: "INR",
      order_id: order_id,
      customer_details: {
        customer_id: `user_${user.id}`,
        customer_name: user.userName,
        customer_email: user.userEmail,
        customer_phone: user.userPhone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.BASE_URL}/api/v1/payment/payment-status/${order_id}`,
        payment_methods: "cc,dc,upi",
      },
      order_note: "Premium Membership Upgrade",
    };

    const cashfreeOrder = await CashFreeService.cashfree.PGCreateOrder(request);


    logger.info("Cashfree order created successfully", { 
        userId: user.id, 
        internalOrderId: order_id,
        cashfreeSessionId: cashfreeOrder.data.payment_session_id 
    });

    res.status(StatusCodes.CREATED).json(
      new ApiResponse("order created successfully", StatusCodes.CREATED, {
        order: cashfreeOrder.data,
      }),
    );
  } catch (error) {
   
    logger.error("Error creating Cashfree order", { 
        userId: req.userId, 
        error: error.message 
    });
    next(error);
  }
};

const paymentVerify = async (req, res, next) => {
  const { orderId } = req.params;

  try {
    
    logger.info("Payment verification initiated", { orderId });

    const order = await Order.findOne({
      where: { orderId: orderId },
      include: [{ model: User, as: "user" }],
    });

    if (!order) {
      
      logger.error("Payment verification failed: Order not found in database", { orderId });
      throw new AppError("Order not found", "NOT_FOUND", StatusCodes.NOT_FOUND);
    }

    const response = await CashFreeService.cashfree.PGOrderFetchPayments(orderId);
    const paymentInfo = response.data[0];

    let redirectUrl = `${process.env.BASE_URL}/daily.html?payment=error&${orderId}`;
    let isPaymentSuccessful = false;

    await sequelize.transaction(async (t) => {

      if (paymentInfo && paymentInfo.payment_status === "SUCCESS") {
        order.status = "SUCCESS";
        order.paymentId = paymentInfo.cf_payment_id;
        await order.save({ transaction: t });

        await User.update(
          { isPremium: true },
          { where: { id: order.userId }, transaction: t },
        );

        redirectUrl = `${process.env.BASE_URL}/daily.html?payment=success`;
        isPaymentSuccessful = true; 
        
        
        logger.info("Payment verified successfully: User upgraded to Premium", { 
            orderId, 
            userId: order.userId, 
            cashfreePaymentId: paymentInfo.cf_payment_id 
        });

      } else if (paymentInfo && paymentInfo.payment_status === "PENDING") {
        order.status = "PENDING";
        await order.save({ transaction: t });
        redirectUrl = `${process.env.BASE_URL}/daily.html?payment=pending&order_id=${orderId}`;
        
        
        logger.warn("Payment verification pending at bank level", { orderId, userId: order.userId });

      } else {
        order.status = "FAILED";
        await order.save({ transaction: t });
        redirectUrl = `${process.env.BASE_URL}/daily.html?payment=failed&order_id=${orderId}`;
        
        
        logger.warn("Payment verification failed at gateway", { orderId, userId: order.userId });
      }
    });

    if (isPaymentSuccessful) {
      try {
        const htmlContent = `<h2>Welcome to Premium, ${order.user.userName}!</h2>`;

        await BrevoEmailService.sendEmail(
          htmlContent,
          "Premium Upgrade Successful!",
          [{ email: order.user.userEmail, name: order.user.userName }],
        );
        
        logger.info("Premium welcome email sent", { userId: order.userId });

      } catch (emailError) {
       
        logger.error("Payment succeeded, but failed to send welcome email", { 
            userId: order.userId, 
            error: emailError.message 
        });
      }
    }

    return res.redirect(redirectUrl);
  } catch (error) {
    
    logger.error("Critical error during payment verification", { 
        orderId, 
        error: error.message,
        stack: error.stack 
    });
    
    return res.redirect(
      `${process.env.BASE_URL}/daily.html?payment=error&order_Id=${orderId}`,
    );
  }
};

export { createOrder, paymentVerify };