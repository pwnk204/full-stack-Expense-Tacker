import User from "../models/user.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { MailtrapClient } from "mailtrap";

const registerUser = async (req, res) => {
  const { userName, userEmail, password, userPhone } = req.body;

  if (!userName || !userEmail || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "ALL FIELDS ARE REQUIRED",
    });
  }

  try {
    const userExist = await User.findOne({ where: { userEmail } });

    if (userExist) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "User already exist",
      });
    }

    const saltRounds = 10;

    const hash = await bcrypt.hash(password, saltRounds);;

    const token = crypto.randomBytes(32).toString("hex");
    console.log("Generated Token:", token);

    const newUser = await User.create({
      userName,
      userEmail,
      password: hash,
      userPhone,
      verificationToken: token
    });

    console.log("newuser:", newUser.toJSON());

    const client = new MailtrapClient({ token: process.env.MAILTRAP_TOKEN });

    const sender = {
      email: "hello@demomailtrap.co",
      name: "Expense Tracker App",
    };

    const recipients = [{ email: newUser.userEmail }];

    await client.send({
      from: sender,
      to: recipients,
      subject: "Verify Your Account",
      text: `Welcome ${newUser.userName}. Please verify your account using this token: ${token}`,
      category: "Email Verification",
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message:
        "Account created successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error during signup.",
    });
  }
};

export { registerUser };
