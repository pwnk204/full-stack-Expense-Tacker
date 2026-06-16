import { body, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import {logger} from "../utils/index.js"

const emailRule = body("userEmail")
  .trim()
  .notEmpty()
  .withMessage("Email is required.")
  .isEmail()
  .withMessage("Please provide a valid email address.")
  .normalizeEmail();

const PasswordRule = body("password")
  .notEmpty()
  .withMessage("Password is required.")
  .isStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  .withMessage(
    "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
  );

const signupValidator = [emailRule, PasswordRule];
const loginValidator = [emailRule];
const forgotPasswordValidator = [emailRule];
const resetPasswordValidator = [PasswordRule];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
     
      const failedFields = errors.array().map((err) => err.path);

      logger.warn("Request failed validation", {
        path: req.originalUrl,
        userId: req.userId || "unauthenticated",
        failedFields: failedFields,
        ip: req.ip,
      });
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        errors: errors.array(),
      });
    }
  }

  next();
};

export {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  validateRequest,
};
