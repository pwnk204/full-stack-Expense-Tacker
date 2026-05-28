import { cashfree } from "../services/cashfree.service.js";
import AppError from "../utils/errors/app.error.js";
import { StatusCodes } from "http-status-codes";
import crypto from 'crypto';

const createOrder = async (req, res, next) => {
  try {
    const uniqueOrderId = `order_${crypto.randomUUID()}`;

    // 2. Build the request payload dynamically
    const request = {
      order_amount: 1.0,
      order_currency: "INR",
      order_id: uniqueOrderId,
      customer_details: {
        customer_id: "node_sdk_test",
        customer_name: "john",
        customer_email: "example@gmail.com",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: `http://127.0.0.1:3000/payment-status/${uniqueOrderId}`,
        payment_methods: "cc,dc,upi",
      },
      // order_expiry_time: "2026-05-29T06:48:17.828Z",
      order_note: "Premium Membership Upgrade",
    };
    const order = await cashfree.PGCreateOrder(request);

    console.log("Order created successfully:", order.data);

    res.status(StatusCodes.CREATED).json({
      message: "order created successfully",
      order: order.data,
    });
  } catch (error) {
    console.log("Error during creating order: ", error);

    return next(
      new AppError(
        "Internal sever error during creating order",
        "INTERNAL_SERVER_ERROR",
        StatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      ),
    );
  }
};

export { createOrder };
