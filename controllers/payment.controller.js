import { cashfree } from "../services/cashfree.service.js";
import AppError from "../utils/errors/app.error.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import User from "../models/user.model.js";

const createOrder = async (req, res, next) => {
  try {
    const uniqueOrderId = `order_${crypto.randomUUID()}`;

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
        return_url: `http://127.0.0.1:3000/api/v1/payment/payment-status/${uniqueOrderId}`,
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

const paymentVerify = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const response = await cashfree.PGOrderFetchPayments(orderId);

    const paymentInfo = response.data[0];

    if (paymentInfo && paymentInfo.payment_status === "SUCCESS") {
      console.log("Payment Verified, Upgrading user payment status in db");

      const user = await User.update({ isPremium: true }, { where: { id: 1 } });

      // 4. Redirect the user's browser back to the daily dashboard
      // You can add a query parameter to show a success message on the frontend
      return res.redirect(
        "http://127.0.0.1:5500/public/daily.html?payment=success",
      );
    } else {
      console.log("Payment failed or cancelled.");
      return res.redirect(
        "http://127.0.0.1:5500/public/daily.html?payment=failed",
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    // If something crashes, send them back to the dashboard with an error
    return res.redirect(
      "http://127.0.0.1:5500/public/daily.html?payment=error",
    );
  }
};

export { createOrder, paymentVerify };
