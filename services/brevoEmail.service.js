import { BrevoClient } from "@getbrevo/brevo";
import { AppError, logger } from '../utils/index.js'; 
import { StatusCodes } from "http-status-codes";

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

export const sendEmail = async (htmlContent, subject, to) => {
  try {
    const message = {
      htmlContent: htmlContent,
      sender: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME
      }, 
      subject: subject,
      to: to
    };

    const response = await brevo.transactionalEmails.sendTransacEmail(message);

    // LOG (INFO): Track successful API communication with Brevo.
    // We map over the 'to' array to log just the email addresses, 
    // keeping the log clean and omitting the heavy htmlContent.
    logger.info("Email successfully dispatched via Brevo", { 
        subject: subject, 
        recipients: to.map(recipient => recipient.email) 
    });

    return true;
    
  } catch (error) {
    // LOG (ERROR): Capture the exact error Brevo throws.
    // If Brevo blocks an IP or rejects a sender address, the raw text will tell you why.
    logger.error("Brevo API failure: Email could not be sent", {
        subject: subject,
        recipients: to.map(recipient => recipient.email),
        rawError: error.response ? error.response.text : error.message
    });

    throw new AppError("Email could not be sent", StatusCodes.INTERNAL_SERVER_ERROR);
  }
};