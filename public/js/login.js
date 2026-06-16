import logger from "../shared/logger.js";

const API_URL = "/api/v1/user/login";

async function submitData(e) {
  e.preventDefault();
  const errorDiv = document.getElementById("errorMessage");

  try {
    const data = {
      userEmail: e.target.userEmail.value,
      password: e.target.password.value,
    };

    logger.info("Login attempt initiated", { email: data.userEmail });

    const response = await axios.post(API_URL, data, {
      withCredentials: true,
    });

    logger.info("Login successful", { email: data.userEmail });

    localStorage.setItem("user", JSON.stringify(response.data.data.user));
    window.location.href = "daily.html";
  } catch (error) {
    if (
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      logger.warn("Login rejected by server", {
        email: e.target.userEmail.value,
        status: error.response.status,
      });
    } else {
      logger.error("Critical failure during login request", error);
    }

    if (error.response && error.response.data) {
      const data = error.response.data;

      if (data.errors && data.errors.length > 0) {
        alert(data.errors[0].msg);
      } else if (data.message) {
        alert(data.message);
      } else {
        alert("An unexpected error occurred during login.");
      }
    } else {
      alert("Cannot connect to the server right now.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get("status");

  if (status) {
    window.history.replaceState({}, document.title, window.location.pathname);

    if (status === "verified") {
      logger.info("User arrived via successful email verification link");
      alert("Email verified successfully! You can now log in to your account.");
    } else if (status === "verification_failed") {
      logger.warn("User arrived via broken or expired verification link");
      alert(
        "The verification link is invalid or has expired. Please log in and request a new link.",
      );
    }
  }
  const form = document.getElementById("login-form");

  if (form) {
    form.addEventListener("submit", submitData);
  } else {
    logger.error("Login form not found in the DOM. Check your HTML IDs.");
  }
});
