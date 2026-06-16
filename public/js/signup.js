import logger from '../../shared/logger.js'; 

const API_URL = "/api/v1/user/register";

async function handleSignup(e) {
  e.preventDefault();

  
  const userName = document.getElementById("userName").value;
  const userEmail = document.getElementById("userEmail").value;
  const userPhone = document.getElementById("userPhone").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  
  logger.info("Signup attempt initiated", { email: userEmail });


  if (password !== confirmPassword) {
    logger.warn("Signup validation failed: Passwords do not match", { email: userEmail });
    alert("Passwords do not match! Please try again.");
    return;
  }

  try {
   
    const data = {
      userName: userName,
      userEmail: userEmail,
      userPhone: userPhone,
      password: password,
    };

  
    const response = await axios.post(API_URL, data);

   
    logger.info("Signup successful", { email: userEmail });

    alert("Account created! Please check your email to verify your account.");

   
    window.location.href = "login.html";
  } catch (error) {
 
    
  
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      logger.warn("Signup rejected by server", { 
          email: userEmail, 
          status: error.response.status 
      });
    } else {
      logger.error("Critical failure during signup request", error);
    }

    if (error.response && error.response.data) {
      const data = error.response.data;

      
      if (data.errors && data.errors.length > 0) {
   
        alert(data.errors[0].msg);
      }
    
      else if (data.message) {
        alert(data.message);
      }
     
      else {
        alert("An unexpected error occurred during signup.");
      }
    } else {
    
      alert("Cannot connect to the server right now.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");

  if (form) {
    form.addEventListener("submit", handleSignup);
  } else {
    logger.error("Signup form not found in the DOM. Check your HTML IDs.");
  }
});