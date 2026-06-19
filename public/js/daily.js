import { handlePremiumCheckout } from "../../shared/payment.js";
import logger from '../../shared/logger.js';
const API_URL = "/api/v1/expense";

let currentDate = new Date();

let currentPage = 1;
let batch = 1;
let limit = localStorage.getItem("expensePageLimit") || 3;
let totalItems = 0;
let editExpenseId = null;
let currentExpenses = [];

const updateDateDisplayUI = () => {
  const day = currentDate.getDate();
  const month = currentDate.toLocaleString("default", { month: "short" });
  const year = currentDate.getFullYear();
  const weekday = currentDate.toLocaleString("default", { weekday: "long" });

  document.getElementById("display-day").innerText = day;
  document.getElementById("display-month-year").innerText = `${month}, ${year}`;
  document.getElementById("display-weekday").innerText = weekday;
};

document.getElementById("btn-prev-date").addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() - 1);
  updateDateDisplayUI();
  currentPage = 1;
  batch = 1;
  fetchExpensesForDate(currentDate, limit, currentPage);
});

document.getElementById("btn-next-date").addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() + 1);
  updateDateDisplayUI();
  currentPage = 1;
  batch = 1;
  fetchExpensesForDate(currentDate, limit, currentPage);
});

async function createExpense(e) {
  e.preventDefault();
  try {
    const data = {
      amount: e.target.amount.value,
      transactionType: e.target.transactionType.value,
      date: e.target.date.value,
      description: e.target.description.value,
    };

    let response;
    let successMessage = "";

    if (editExpenseId) {
      logger.info("Submitting expense update", { expenseId: editExpenseId });
      response = await axios.put(`${API_URL}/${editExpenseId}`, data, {
        withCredentials: true,
      });
      successMessage = "Expense updated successfully";
    } else {
      logger.info("Submitting new expense", { type: data.transactionType });
      response = await axios.post(API_URL, data, {
        withCredentials: true,
      });
      successMessage = "Expense created successfully";
    }

    closeModal();
    fetchExpensesForDate(currentDate, limit, currentPage);

    logger.info("Expense action successful", { message: response.data.message });
    alert(successMessage);
  } catch (error) {
    logger.error("Expense creation/update failed", error);

    if (error.response && error.response.data && error.response.data.message) {
      alert(error.response.data.message);
    } else {
      alert("Cannot process expense at this time.");
    }
  }
}

async function fetchExpensesForDate(dateObj, limit, pageNo) {
  try {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    logger.info("Fetching expenses for date", { date: formattedDate, limit, pageNo });

    const response = await axios.get(`${API_URL}/daily/${formattedDate}`, {
      params: {
        limit: limit,
        pageNo: pageNo,
      },
      withCredentials: true,
    });

    const expenses = response.data.data.expenses;
    currentExpenses = response.data.data.expenses;
    totalItems = response.data.data.count;

    logger.info("Daily expenses fetched successfully", { returnedCount: expenses.length, totalItems });

    const creditList = document.querySelector(".credit-section .transaction-list");
    const debitList = document.querySelector(".debit-section .transaction-list");
    const balanceDisplay = document.querySelector(".balance-display h3");
    const totalCreditDisplay = document.querySelector(".credit-header h4:nth-child(2)");
    const totalDebitDisplay = document.querySelector(".debit-header h4:nth-child(2)");

    creditList.innerHTML = "";
    debitList.innerHTML = "";

    let totalCredit = 0;
    let totalDebit = 0;

    expenses.forEach((item) => {
      const amountStr = parseFloat(item.amount).toFixed(2);
      const li = document.createElement("li");
      li.classList.add("transaction-item");

      if (item.transactionType === "credit") {
        totalCredit += parseFloat(item.amount);
        li.innerHTML = `
        <span class="item-note">${item.description}</span>
        <span class="item-amount credit-amount">${amountStr}</span>
        <div class="action-buttons">
            <button type="button" class="btn-edit" data-id="${item.id}">Edit</button>
            <button type="button" class="btn-delete" data-id="${item.id}">Delete</button>
        </div>
    `;
        creditList.appendChild(li);
      } else {
        totalDebit += parseFloat(item.amount);
        li.innerHTML = `
        <span class="item-note">${item.description}</span>
        <span class="item-amount debit-amount">${amountStr}</span>
        <div class="action-buttons">
            <button type="button" class="btn-edit" data-id="${item.id}">Edit</button>
            <button type="button" class="btn-delete" data-id="${item.id}">Delete</button>
        </div>
    `;
        debitList.appendChild(li);
      }
    });

    const currentBalance = totalCredit - totalDebit;

    balanceDisplay.innerText = `$${currentBalance.toFixed(2)}`;
    totalCreditDisplay.innerText = `$${totalCredit.toFixed(2)}`;
    totalDebitDisplay.innerText = `$${totalDebit.toFixed(2)}`;

    createPaginationBtns(totalItems);
  } catch (error) {
    logger.error("Failed to fetch expenses", error);
    if (error.response && error.response.status === 401) {
      window.location.href = "login.html";
    }
  }
}

const createPaginationBtns = (totalItems) => {
  logger.info("Rebuilding pagination", { totalItems, batch });
  const container = document.getElementById("pagination-container");
  const btnContainer = document.getElementById("btn-container");
  const prevBtn = document.getElementById("btn-prev-batch");
  const nextBtn = document.getElementById("btn-next-batch");

  const actualTotalPages = Math.ceil(totalItems / limit);

  if (actualTotalPages === 0) {
    container.style.display = "none";
    return;
  } else {
    container.style.display = "flex";
  }

  btnContainer.innerHTML = " ";
  const endPage = batch * 3;
  const startPage = endPage - 2;

  logger.info("Pagination state", { startPage, endPage, batch, currentPage });

  for (let i = startPage; i <= Math.min(endPage, actualTotalPages); i++) {
    const numBtn = document.createElement("button");
    numBtn.classList.add("page-btn");
    numBtn.innerText = i;
    numBtn.dataset.pageNo = i;

    if (i === currentPage) {
      numBtn.classList.add("active");
    }

    numBtn.addEventListener("click", (e) => {
      currentPage = parseInt(e.target.dataset.pageNo);
      fetchExpensesForDate(currentDate, limit, currentPage);
    });

    btnContainer.appendChild(numBtn);
  }

  prevBtn.disabled = batch === 1;
  nextBtn.disabled = endPage >= actualTotalPages;
};

const prevBtn = document.getElementById("btn-prev-batch");
const nextBtn = document.getElementById("btn-next-batch");

document.getElementById("btn-prev-batch").addEventListener("click", () => {
  if (batch > 1) {
    batch--;
    currentPage = batch * 3 - 2;
    fetchExpensesForDate(currentDate, limit, currentPage);
  }
});

document.getElementById("btn-next-batch").addEventListener("click", () => {
  if (batch * 3 < Math.ceil(totalItems / limit)) {
    batch++;
    currentPage = batch * 3 - 2;
    fetchExpensesForDate(currentDate, limit, currentPage);
  }
});

async function fetchUserProfile() {
  try {
    const response = await axios.get("/api/v1/user/me", {
      withCredentials: true,
    });

    const user = response.data.data.user;
    const premiumBtn = document.getElementById("btn-premium");
    const leaderboardBtn = document.getElementById("btn-leaderboard");

    if (user.isPremium) {
      if (premiumBtn) {
        premiumBtn.innerHTML = "Premium Member";
        premiumBtn.disabled = true;
        premiumBtn.classList.add("is-premium-badge");
      }

      if (leaderboardBtn) {
        leaderboardBtn.classList.remove("hidden");
      }
    }
  } catch (error) {
    logger.error("Failed to fetch user profile", error);
  }
}

async function fetchLeaderboard() {
  const leaderboardModal = document.getElementById("leaderboardModal");
  const leaderboardList = document.getElementById("leaderboard-list");

  leaderboardModal.style.display = "flex";
  leaderboardList.innerHTML = "<li>Loading ranks</li>";

  try {
    logger.info("Requesting leaderboard data");
    const response = await axios.get(
      "/api/v1/premium/leaderboard",
      {
        withCredentials: true,
      },
    );

    const leaderboardData = response.data.data.leaderboard;
    logger.info("Leaderboard data loaded successfully", { totalUsers: leaderboardData.length });

    leaderboardList.innerHTML = "";

    leaderboardData.forEach((user, index) => {
      const total = user.totalExpense
        ? parseFloat(user.totalExpense).toFixed(2)
        : "0.00";

      const li = document.createElement("li");
      li.classList.add("transaction-item");
      li.innerHTML = `
                <span class="item-note"><strong>#${index + 1}</strong> ${user.userName}</span>
                <span class="item-amount debit-amount">$${total}</span>
            `;
      leaderboardList.appendChild(li);
    });
  } catch (error) {
    logger.error("Leaderboard fetch error", error);
    leaderboardList.innerHTML = "<li>Could not load leaderboard.</li>";
  }
}

const handleTransactionAction = async (e) => {
  const deleteBtn = e.target.closest(".btn-delete");

  if (deleteBtn) {
    const expenseId = deleteBtn.dataset.id;
    logger.info("Delete button clicked", { expenseId });

    if (confirm("Are you sure you want to delete this record?")) {
      try {
        const creditList = document.querySelector(".credit-section .transaction-list");
        const debitList = document.querySelector(".debit-section .transaction-list");

        if (creditList.children.length + debitList.children.length === 1) {
          const currentBatchFirstPage = batch * 3 - 2;
          if (currentPage === currentBatchFirstPage) batch = 1;
          currentPage = 1;
        }

        const response = await axios.delete(`${API_URL}/${expenseId}`, {
          withCredentials: true,
        });

        const result = response.data;
        logger.info("Delete response received", { success: result.success, limit, currentPage });
        
        if (result.success) {
          await fetchExpensesForDate(currentDate, limit, currentPage);
        } else {
          alert("Failed to delete expense");
        }
      } catch (error) {
        logger.error("Delete request failed", error);
        alert("Could not delete the expense.");
      }
    }
    return;
  }

  const editBtn = e.target.closest(".btn-edit");
  if (editBtn) {
    const expenseId = parseInt(editBtn.dataset.id);
    logger.info("Edit button clicked", { expenseId });

    editExpenseId = editBtn.dataset.id;

    const expenseToEdit = currentExpenses.find((exp) => exp.id === expenseId);

    const form = document.getElementById("createExpenseForm");
    form.amount.value = expenseToEdit.amount;
    form.transactionType.value = expenseToEdit.transactionType;
    form.description.value = expenseToEdit.description;
    form.date.value = new Date(expenseToEdit.date).toISOString().split("T")[0];

    form.querySelector('button[type="submit"]').innerText = "Update Expense";

    document.getElementById("expenseModal").style.display = "flex";
    document.getElementById("expenseModal").querySelector("h2").innerText = "Update the Expense";
  }
};

const CheckPaymentStatus = (orderId) => {
  let attempts = 0;
  const maxAttempts = 10; 

  const intervalId = setInterval(async () => {
    attempts++;

    try {
      logger.info("Polling for pending payment status", { attempt: attempts, orderId });
      const response = await axios.get(`/api/v1/payments/verify/${orderId}`);

      if (response.data.success && response.data.message.includes("verified")) {
        clearInterval(intervalId);
        logger.info("Pending payment cleared successfully");
        alert("Awesome! Your payment has been confirmed. Welcome to Premium!");
        fetchUserProfile(); 
      }
    } catch (error) {
      logger.error("Error checking pending payment status", error);
    }

    if (attempts >= maxAttempts) {
      clearInterval(intervalId);
      logger.warn("Stopped polling for payment status (max attempts reached)");
      alert("Payment is still taking a moment to clear. If your money was deducted, your premium status will update automatically in a few minutes.");
    }
  }, 3000); 
};

const closeModal = () => {
  expenseModal.style.display = "none";
  createExpenseForm.reset();
  editExpenseId = null;
  createExpenseForm.querySelector('button[type="submit"]').innerText = "Add Expense";
};

document.addEventListener("DOMContentLoaded", () => {
  updateDateDisplayUI();

  const limitSelect = document.getElementById("rows-per-page");

  if (limitSelect) {
    limitSelect.value = limit;
    limitSelect.addEventListener("change", (e) => {
      limit = e.target.value;
      localStorage.setItem("expensePageLimit", limit);
      logger.info("User changed items per page limit", { newLimit: limit });
      
      if (totalItems > 0) {
        currentPage = 1;
        fetchExpensesForDate(currentDate, limit, currentPage);
      }
    });
  }

  fetchExpensesForDate(currentDate, limit, currentPage);

  const addEntryBtn = document.getElementById("add-entry-btn");
  const expenseModal = document.getElementById("expenseModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const createExpenseForm = document.getElementById("createExpenseForm");

  const openModal = () => {
    expenseModal.querySelector("h2").innerText = "Add New Record";
    expenseModal.style.display = "flex";
  };

  const premiumBtn = document.getElementById("btn-premium");

  if (premiumBtn) {
    premiumBtn.addEventListener("click", () => {
      logger.info("Premium checkout button clicked");
      handlePremiumCheckout(premiumBtn);
    });
  }

  if (addEntryBtn) addEntryBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === expenseModal) {
      closeModal();
    }
  });

  createExpenseForm.addEventListener("submit", createExpense);
  fetchUserProfile();

  const creditList = document.querySelector(".credit-section .transaction-list");
  const debitList = document.querySelector(".debit-section .transaction-list");
  
  if (creditList) creditList.addEventListener("click", handleTransactionAction);
  if (debitList) debitList.addEventListener("click", handleTransactionAction);

  const leaderboardBtn = document.getElementById("btn-leaderboard");
  const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");
  const leaderboardModal = document.getElementById("leaderboardModal");

  if (leaderboardBtn) leaderboardBtn.addEventListener("click", fetchLeaderboard);

  if (closeLeaderboardBtn) {
    closeLeaderboardBtn.addEventListener("click", () => {
      leaderboardModal.style.display = "none";
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get("payment");
  const orderId = urlParams.get("order_id");

  if (paymentStatus) {
    window.history.replaceState({}, document.title, window.location.pathname);
    logger.info("Handling payment redirect status", { status: paymentStatus, orderId });

    if (paymentStatus === "success") {
      alert("Payment Successful! Welcome to Premium!");
    } else if (paymentStatus === "failed") {
      alert("Payment failed or was cancelled. Please try again.");
    } else if (paymentStatus === "pending") {
      alert("Your payment is pending confirmation from your bank. We are checking the status...");
      if (orderId) {
        CheckPaymentStatus(orderId);
      }
    } else if (paymentStatus === "error") {
      alert("An error occurred while verifying your payment.");
    }

    fetchUserProfile();
  }
});