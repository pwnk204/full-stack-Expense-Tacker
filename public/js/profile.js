import { handlePremiumCheckout } from "../../shared/payment.js";
import logger from '../../shared/logger.js';

const API_URL = "/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
  const user = await fetchAndRenderProfile();

  const resendVerifyBtn = document.getElementById("resendVerifyBtn");

  if (resendVerifyBtn) {
    if (user.isVerified) {
      resendVerifyBtn.classList.add("hidden");
    } else {
      resendVerifyBtn.addEventListener("click", async () => {
        try {
          logger.info("Resend verification email clicked");
          resendVerifyBtn.textContent = "Sending...";
          resendVerifyBtn.disabled = true;

          const response = await axios.post(
            `${API_URL}/user/resend-verification`,
            {},
            {
              withCredentials: true,
            },
          );

          const result = response.data;

          if (result.success) {
            logger.info("Verification email resent successfully");
            resendVerifyBtn.textContent = "Email Sent!";
            resendVerifyBtn.style.color = "green";
            resendVerifyBtn.style.borderColor = "green";
            alert("Verification email sent. Please check your inbox");
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          logger.error("Failed to resend verification email", error);
          resendVerifyBtn.textContent = "Try Again";
          resendVerifyBtn.disabled = false;
          alert("Could not send verification email. Please try again later.");
        }
      });
    }
  }

  const premiumBtn = document.getElementById("btn-upgrade-profile");
  if (premiumBtn) {
    premiumBtn.addEventListener("click", () => {
      logger.info("Premium upgrade initiated from profile");
      handlePremiumCheckout(premiumBtn);
    });
  }

  const toggleBtn = document.getElementById("btn-reset-password");
  const passwordForm = document.getElementById("change-password-form");
  const submitPasswordBtn = document.getElementById("btn-submit-password");

  toggleBtn.addEventListener("click", () => {
    passwordForm.classList.toggle("hidden");
  });

  submitPasswordBtn.addEventListener("click", async () => {
    const oldPassword = document.getElementById("input-old-password").value;
    const newPassword = document.getElementById("input-new-password").value;

    if (!oldPassword || !newPassword) {
      return alert("Please fill in both password fields.");
    }

    try {
      logger.info("Change password requested");
      submitPasswordBtn.innerHTML = "Updating...";
      submitPasswordBtn.disabled = true;

      const response = await axios.post(
        `${API_URL}/user/change-password`,
        {
          oldPassword,
          newPassword,
        },
        {
          withCredentials: true,
        },
      );

      logger.info("Password updated successfully");
      alert("Password updated successfully!");

      document.getElementById("input-old-password").value = "";
      document.getElementById("input-new-password").value = "";
      passwordForm.classList.add("hidden");
    } catch (error) {
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        logger.warn("Change password request rejected by server", error.response.data);
      } else {
        logger.error("Critical failure during change password request", error);
      }

      if (error.response && error.response.data) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          
          alert(error.response.data.errors[0].msg);
        } else {
          const errorMsg = error.response.data?.message || "Failed to update password.";
          alert(errorMsg);
        }
      }
    } finally {
      submitPasswordBtn.innerHTML = "Update Password";
      submitPasswordBtn.disabled = false;
    }
  });

  const logoutBtn = document.getElementById("btn-logout");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const confirmLogout = confirm("Are you sure you want to log out?");
      if (!confirmLogout) return;

      try {
        logger.info("User initiated logout");
        logoutBtn.innerHTML = "Logging out...";
        logoutBtn.disabled = true;

        await axios.get(`${API_URL}/user/logout`, {
          withCredentials: true,
        });

        logger.info("Logout successful");
        window.location.href = "login.html";
      } catch (error) {
        logger.error("Logout failed", error);
        alert("An error occurred while logging out. Please try again.");
        logoutBtn.innerHTML = "Log Out";
        logoutBtn.disabled = false;
      }
    });
  }

  const deleteBtn = document.getElementById("btn-delete-account");

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const isConfirmed = confirm(
        "Are you absolutely sure you want to delete your account? This will remove your access to all expenses and premium features.",
      );

      if (!isConfirmed) return;

      try {
        logger.warn("Account deletion initiated");
        deleteBtn.innerHTML = "Deleting...";
        deleteBtn.disabled = true;

        await axios.delete(`${API_URL}/user/delete`, {
          withCredentials: true,
        });

        logger.info("Account deleted successfully");
        alert("Your account has been securely deleted. We are sorry to see you go!");
        window.location.href = "signup.html";
      } catch (error) {
        logger.error("Account deletion failed", error);
        alert(
          error.response?.data?.message ||
            "An error occurred while deleting your account.",
        );
        deleteBtn.innerHTML = "Delete Account";
        deleteBtn.disabled = false;
      }
    });
  }
});

async function fetchAndRenderProfile() {
  try {
    logger.info("Fetching user profile");
    const response = await axios.get(`${API_URL}/user/me`, {
      withCredentials: true,
    });

    const user = response.data.data.user;

    logger.info("User profile loaded", { isPremium: user.isPremium, isVerified: user.isVerified });

    document.getElementById("profile-name").innerText = user.userName;
    document.getElementById("profile-email").innerText = user.userEmail;
    document.getElementById("profile-initial").innerText = user.userName
      .charAt(0)
      .toUpperCase();

    const joinDate = new Date(user.createdAt);
    document.getElementById("stat-joined-date").innerText =
      joinDate.toLocaleString("default", { month: "short", year: "numeric" });

    document.getElementById("stat-total-expense").innerText =
      `$${parseFloat(user.totalExpense).toFixed(2)}`;

    const premiumBadge = document.getElementById("premium-badge");
    const upgradeBtn = document.getElementById("btn-upgrade-profile");

    if (user.isPremium) {
      premiumBadge.classList.remove("hidden");
      upgradeBtn.classList.add("hidden");
    } else {
      premiumBadge.classList.add("hidden");
      upgradeBtn.classList.remove("hidden");
    }
    return user;
  } catch (error) {
    logger.error("Failed to load profile", error);
    if (error.response && error.response.status === 401) {
      window.location.href = "login.html";
    }
  }
}