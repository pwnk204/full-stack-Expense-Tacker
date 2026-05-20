import User from "../models/user.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { MailtrapClient } from "mailtrap";
import AppError from "../utils/errors/app.error.js";
import dotenv from "dotenv";

// dotenv.config();

const registerUser = async (req, res, next) => {
  const { userName, userEmail, password, userPhone } = req.body;

  if (!userName || !userEmail || !password) {
    return next(
      new AppError(
        "User already exist",
        "BAD_REQUEST",
        StatusCodes.BAD_REQUEST,
      ),
    );
  }

  try {
    const userExist = await User.findOne({ where: { userEmail } });

    if (userExist) {
      return next(
        new AppError(
          "User already exist",
          "BAD_REQUEST",
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    const saltRounds = 10;

    const hash = await bcrypt.hash(password, saltRounds);

    const token = crypto.randomBytes(32).toString("hex");
    console.log("Generated Token:", token);

    const newUser = await User.create({
      userName,
      userEmail,
      password: hash,
      userPhone,
      verificationToken: token,
    });

    console.log("newuser:", newUser.toJSON());

    //   const client = new MailtrapClient({ token: process.env.MAILTRAP_TOKEN });

    // const sender = {
    //   email: "hello@demomailtrap.co",
    //   name: "Expense Tracker App",
    // };

    //   await client.send({
    //     from: sender,
    //     to: recipients,
    //     subject: "Verify Your Account",
    //     text: `Welcome ${newUser.userName}! Please verify your account by clicking this link: ${process.env.BASE_URL}/api/v1/user/verify/${token}`,

    //     html: `
    //   <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
    //       <h2>Welcome, ${newUser.userName}!</h2>
    //       <p>You're almost ready to start tracking your expenses.</p>
    //       <a href="${process.env.BASE_URL}/api/v1/user/verify/${token}"
    //          style="background-color: #4db6ac; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; font-weight: bold;">
    //          Verify My Account
    //       </a>
    //       <p style="margin-top: 20px; font-size: 12px; color: #777;">
    //          If the button doesn't work, copy and paste this link into your browser:<br>
    //          ${process.env.BASE_URL}/api/v1/user/verify/${token}
    //       </p>
    //   </div>
    // `,
    //     category: "Email Verification",
    //   });

    const recipients = newUser.userEmail;

    // const sender = {
    //   email: "test@example.com",
    //   name: "Mailtrap Test",
    // };

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_TRAP_HOST,
      port: process.env.MAIL_TRAP_PORT,
      secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
      auth: {
        user: process.env.MAIL_TRAP_USERNAME,
        pass: process.env.MAIL_TRAP_PASSWORD,
      },
    });

    const message = {
      from: '"Expense Tracker App" <hello@demomailtrap.co>',
      to: recipients,
      subject: "Verify Your Account",
      text: `Welcome ${newUser.userName}! Please verify your account by clicking this link: ${process.env.BASE_URL}/api/v1/user/verify/${token}`,

      html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Welcome, ${newUser.userName}!</h2>
          <p>You're almost ready to start tracking your expenses.</p>
          <a href="${process.env.BASE_URL}/api/v1/user/verify/${token}"
             style="background-color: #4db6ac; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; font-weight: bold;">
             Verify My Account
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">
             If the button doesn't work, copy and paste this link into your browser:<br>
             ${process.env.BASE_URL}/api/v1/user/verify/${token}
          </p>
      </div>
    `,
    };

    const sendMail = await transporter.sendMail(message);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message:
        "Account created successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    const message = "Internal server error during signup.";
    next(
      new AppError(
        message,
        "INTERNAL_SERVER_ERROR",
        StatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      ),
    );
  }
};

const verifyUser = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) {
      return next(new AppError("Invalid or expired verification token.", "BAD_REQUEST", StatusCodes.BAD_REQUEST));
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    // Redirect them to your frontend HTML page
    // return res.redirect("http://localhost:5500/login.html");
    res.status(StatusCodes.OK).json({
      message: "user verified successfully",
      success: true,
    });
  } catch (error) {
    console.log("verifyUser: ", error);

    const message = "Internal server error during verifying user.";
    next(
      new AppError(
        message,
        "INTERNAL_SERVER_ERROR",
        StatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      ),
    );
  }
};

const login = async (req, res, next) => {
  const { userEmail, password } = req.body;

  console.log("req.body: ", req.body);

  if (!password || !userEmail) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  try {
    const userExist = await User.findOne({ where : {userEmail: userEmail }});

    console.log("userexist:", userExist);
    console.log("userexistemail: ", userExist.userEmail);

    if (!userExist) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid email or password.",
      });
    }

    if (!userExist.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const passwordIsMatch = await bcrypt.compare(password, userExist.password);

    console.log("password match:", passwordIsMatch);

    if (!passwordIsMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ userId: userExist.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log("token: ", token);

    const oneDay = 24 * 60 * 60 * 1000;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: oneDay,
    };

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      message: "login successfull",
      success: true,
      token,
      user: {
        id: userExist.id,
        name: userExist.userName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "user not login",
      error,
      success: false,
    });
  }
};

export { registerUser, verifyUser, login };
