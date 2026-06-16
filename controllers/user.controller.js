import User from "../models/user.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { MailtrapClient } from "mailtrap";
import { AppError, ApiResponse, logger } from "../utils/index.js";
import dotenv from "dotenv";
import {
  CashFreeService,
  BrevoEmailService,
} from "../services/index.js";
import { STATUS_CODES } from "http";
import sequelize from "../config/db.js";

const registerUser = async (req, res, next) => {
  const { userName, userEmail, password, userPhone } = req.body;

 
  logger.info("User registration initiated", { email: userEmail });

  if (!userName || !userEmail || !password) {
    return next(
      new AppError(
        "Please provide all required fields.",
        StatusCodes.BAD_REQUEST,
      ),
    );
  }

  try {
    const userExist = await User.findOne({ where: { userEmail } });

    if (userExist) {

      logger.warn("Registration blocked: Email already exists", { email: userEmail });
      return next(new AppError("User already exist.", StatusCodes.BAD_REQUEST));
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 1 * 60 * 1000);

    const newUser = await sequelize.transaction(async (t) => {
      const user = await User.create(
        {
          userName,
          userEmail,
          password: hash,
          userPhone,
          verificationToken: token,
          verificationTokenExpires: tokenExpiry,
          verificationTokenCreatedAt: new Date(),
        },
        { transaction: t },
      );
      return user;
    });

    
    logger.info("User inserted into database successfully", { userId: newUser.id, email: newUser.userEmail });

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <h2>Welcome, ${userName}!</h2>
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
      `;
  
      await BrevoEmailService.sendEmail(htmlContent, "Verify Your Account", [
        { email: newUser.userEmail, name: newUser.userName },
      ]);
      
     
      logger.info("Verification email sent via Brevo", { email: newUser.userEmail });
      
    } catch (emailError) {
      
      logger.error("Failed to send verification email", { 
        email: newUser.userEmail, 
        error: emailError.message 
      });
    }

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          "Account created successfully. Please check your email to verify your account.",
          StatusCodes.CREATED,
        ),
      );
  } catch (error) {
   
    logger.error("Error during user registration", { 
        error: error.message, 
        stack: error.stack 
    });
    next(error);
  }
};

const verifyUser = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) {
      
      logger.warn("Verification failed: Token not found in database");
      return next(
        new AppError(
          "Invalid or expired verification token.",
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    const timeElapsed =
      Date.now() - new Date(user.verificationTokenExpiry).getTime();

    if (timeElapsed >= 0) {
      logger.warn("Verification failed: Token expired", { userId: user.id });
      return next(
        new AppError(
          "Invalid or expired verification token.",
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenCreatedAt = null;
    await user.save();

    
    logger.info("User account successfully verified", { userId: user.id, userEmail: user.userEmail });

    return res.redirect('/login.html?status=verified');

  } catch (error) {
    logger.error("Email verification failed", { error: error.message });
    return res.redirect('/login.html?status=verification_failed');
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    
    logger.info("Resend verification email requested", { userId: req.userId });

    const user = await User.findByPk(req.userId);

    if (!user) {
      return next(new AppError("User not found", StatusCodes.NOT_FOUND));
    }

    if (user.isVerified) {
      logger.warn("Resend email blocked: User already verified", { userId: user.id });
      return next(
        new AppError("Email is already verified", StatusCodes.BAD_REQUEST),
      );
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.update({
      verificationToken: newToken,
      verificationTokenExpiry: tokenExpiry,
      verificationTokenCreatedAt: new Date(),
    });

    const verificationLink = `${process.env.BASE_URL}/api/v1/user/verify/${newToken}`;

    const htmlContent = `
    <h2>Welcome to ExpenseTracker!</h2>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verificationLink}">Verify Account</a>
`;

    await BrevoEmailService.sendEmail(htmlContent, "Verify Your Account", [
      { email: user.userEmail, name: user.userName },
    ]);

    logger.info("New verification email sent successfully", { userId: user.id });

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          "A new verification link has been sent to your email",
          StatusCodes.OK,
        ),
      );
  } catch (error) {
    logger.error("Error resending verification email", { error: error.message });
    next(error);
  }
};

const login = async (req, res, next) => {
  const { userEmail, password } = req.body;

  
  logger.info("Login attempt", { email: userEmail });

  if (!password || !userEmail) {
    return next(
      new AppError(
        "Please provide all required fields.",
        StatusCodes.BAD_REQUEST,
      ),
    );
  }

  try {
    const userExist = await User.findOne({ where: { userEmail: userEmail } });

    if (!userExist) {
      
      logger.warn("Login failed: Email not found", { email: userEmail });
      return next(
        new AppError("Invalid email or password.", StatusCodes.UNAUTHORIZED),
      );
    }

    const passwordIsMatch = await bcrypt.compare(password, userExist.password);

    if (!passwordIsMatch) {
      
      logger.warn("Login failed: Incorrect password", { email: userEmail });
      return next(
        new AppError("Invalid email or password.", StatusCodes.UNAUTHORIZED),
      );
    }

    const token = jwt.sign({ userId: userExist.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const oneDay = 24 * 60 * 60 * 1000;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: oneDay,
    };

    res.cookie("token", token, cookieOptions);

    
    logger.info("User logged in successfully", { userId: userExist.id });

    res.status(StatusCodes.OK).json(
      new ApiResponse("Login successful.", 200, {
        token,
        user: {
          id: userExist.id,
          name: userExist.userName,
        },
      }),
    );
  } catch (error) {
    logger.error("Critical error during login process", { error: error.message, stack: error.stack });
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse("User fetched successfully", StatusCodes.OK, { user }),
      );
  } catch (error) {
    logger.error("Error fetching user profile", { userId: req.userId, error: error.message });
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { userEmail } = req.body;

    logger.info("Password reset requested", { userEmail });

    if (!userEmail) {
      return next(
        new AppError(
          "Please provide an email address.",
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    const user = await User.findOne({ where: { userEmail: userEmail } });

    if (!user) {
      
      logger.info("Password reset requested for non-existent email", { email });
      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(
            "If an account with that email exists, a password reset link has been sent.",
            200,
          ),
        );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = tokenExpiry;
    await user.save();

    const resetURL = `${process.env.BASE_URL}/reset-password.html?token=${resetToken}`;

    const htmlContent = `
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the link below to set a new one:</p>
            <a href="${resetURL}" style="display:inline-block; padding:10px 20px; background:#4db6ac; color:white; text-decoration:none;">Reset Password</a>
            <p>If you did not request this, please ignore this email. This link will expire in 15 minutes.</p>
        `;

    await BrevoEmailService.sendEmail(htmlContent, "Password reset Request", [
      { email: user.userEmail, name: user.userName },
    ]);

    logger.info("Password reset email sent successfully", { userId: user.id });

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          "If an account with that email exists, a password reset link has been sent.",
          200,
        ),
      );
  } catch (error) {
    logger.error("Error processing forgot password request", { error: error.message });
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return next(
        new AppError("Password must be at least 6 characters long.", 400),
      );
    }

    const user = await User.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      logger.warn("Password reset failed: Invalid or missing token");
      return next(
        new AppError(
          "Invalid or expired reset token.",
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    const timeRemaining =
      new Date(user.resetPasswordExpiry).getTime() - Date.now();
      
    if (timeRemaining < 0) {
      user.resetPasswordToken = null;
      user.resetPasswordExpiry = null;
      await user.save();
      logger.warn("Password reset failed: Token expired", { userId: user.id });
      return next(
        new AppError(
          "Reset token has expired. Please request a new one.",
          StatusCodes.BAD_REQUEST,
        ),
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    await user.save();

    logger.info("Password successfully reset using token", { userId: user.id });

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          "Password has been successfully reset. You can now log in.",
          200,
        ),
      );
  } catch (error) {
    logger.error("Error during password reset", { error: error.message });
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User.findByPk(userId);
    if (!user)
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      logger.warn("Change password failed: Incorrect old password", { userId });
      return next(
        new AppError("Incorrect current password.", StatusCodes.UNAUTHORIZED),
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    logger.info("User changed their password successfully", { userId });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("Password updated successfully.", StatusCodes.OK));
  } catch (error) {
    logger.error("Error changing password", { userId: req.userId, error: error.message });
    next(error);
  }
};

const logout = (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    logger.info("User logged out", { userId: req.userId });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("Logged out successfully.", 200));
  } catch (error) {
    logger.error("Error during user logout", { error: error.message });
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    logger.info("Account deletion requested", { userId });

    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError("User not found.", StatusCodes.NOT_FOUND));
    }

    await user.destroy();

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    logger.info("User account permanently deleted", { userId });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("Account successfully deleted.", StatusCodes.OK));
  } catch (error) {
    logger.error("Error deleting user account", { userId: req.userId, error: error.message });
    next(error);
  }
};

export {
  registerUser,
  verifyUser,
  login,
  getMe,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  deleteAccount,
};