

import { logger, ApiResponse } from "../utils/index.js";
import { StatusCodes } from "http-status-codes";

const receiveFrontendLogs = (req, res, next) => {
  try {
  
    const { message, error, stack, url, userAgent } = req.body;

  
    logger.error(`[FRONTEND] ${message}`, {
      frontendError: error,
      frontendStack: stack,
      url: url,
      userAgent: userAgent,
      ip: req.ip
    });

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse("Frontend log received securely", StatusCodes.OK));
      
  } catch (backendError) {
    
    console.error("Critical failure in frontend logging route:", backendError);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
  }
};

export { receiveFrontendLogs };