
import logger from '../../shared/logger.js'; 

const API_URL = "/api/v1/user";

document
  .getElementById("forgotPasswordForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const userEmail = document.getElementById("email").value;
    const submitBtn = document.getElementById("submitBtn");
    const statusMessage = document.getElementById("status-message");

  
    logger.info("Forgot password request initiated", { email });

    submitBtn.innerText = "Sending...";
    submitBtn.disabled = true;

    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        userEmail,
      });

     
      logger.info("Forgot password request successful");

      statusMessage.style.display = "block";
      statusMessage.style.backgroundColor = "#e8f5e9";
      statusMessage.style.color = "#2e7d32";
      statusMessage.innerText = response.data.message;

      document.getElementById("email").value = "";
    } catch (error) {
      
     
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        logger.warn("Forgot password request rejected by server", error.response.data);
      } else {
        logger.error("Critical failure during forgot password request", error);
      }

      statusMessage.style.display = "block";
      statusMessage.style.backgroundColor = "#ffebee";
      statusMessage.style.color = "#c62828";
      
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.errors && data.errors.length > 0) {
          statusMessage.innerText = data.errors[0].msg;
        } else {
          statusMessage.innerText =
            data?.message || "An error occurred. Please try again.";
        }
      } else {
         
         statusMessage.innerText = "A network error occurred. Please try again.";
      }
    } finally {
      submitBtn.innerText = "Send Reset Link";
      submitBtn.disabled = false;
    }
  });