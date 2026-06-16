import logger from '../../shared/logger.js'; 

const API_URL = "/api/v1/user";

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    const form = document.getElementById('resetPasswordForm');
    const statusMessage = document.getElementById('status-message');

    
    if (!token) {
        logger.warn("Password reset page accessed without a token");
        document.getElementById('error-actions').style.display = "block";
        form.style.display = "none";
        statusMessage.style.display = "block";
        statusMessage.style.backgroundColor = "#ffebee";
        statusMessage.style.color = "#c62828";
        statusMessage.innerText = "Invalid or missing reset token. Please request a new link.";
        return;
    }

    
    logger.info("Password reset page loaded with token");

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.getElementById('submitBtn');

        if (newPassword !== confirmPassword) {
            logger.warn("Password reset validation failed: Passwords do not match");
            statusMessage.style.display = "block";
            statusMessage.style.backgroundColor = "#ffebee";
            statusMessage.style.color = "#c62828";
            statusMessage.innerText = "Passwords do not match!";
            return;
        }

        logger.info("Submitting password reset request");
        submitBtn.innerText = "Updating...";
        submitBtn.disabled = true;

        try {
        
            const response = await axios.post(`${API_URL}/reset-password/${token}`, { newPassword });

            logger.info("Password reset successful");

            statusMessage.style.display = "block";
            statusMessage.style.backgroundColor = "#e8f5e9";
            statusMessage.style.color = "#2e7d32";
            statusMessage.innerText = response.data.message;

            form.style.display = "none";
            
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000); 

        } catch (error) {
            
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                logger.warn("Password reset rejected by server", error.response.data);
            } else {
                logger.error("Critical failure during password reset request", error);
            }

            statusMessage.style.display = "block";
            statusMessage.style.backgroundColor = "#ffebee";
            statusMessage.style.color = "#c62828";
            statusMessage.innerText = error.response?.data?.message || "Failed to reset password.";
            
            submitBtn.innerText = "Update Password";
            submitBtn.disabled = false;
        }
    });
});