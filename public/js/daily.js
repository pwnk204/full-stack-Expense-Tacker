
const API_URL = "http://127.0.0.1:3000/api/v1/expense";


async function createExpense(e) {
  e.preventDefault();
  try {
    const data = {
      amount: e.target.amount.value,
      transactionType: e.target.transactionType.value,
      date: e.target.date.value,
      description: e.target.description.value,
      category: e.target.category.value,
    };

    const response = await axios.post(API_URL, data, {
      withCredentials: true,
    });

    console.log("Success:", response.data.message);

    alert("Expense created successfully");
  } catch (error) {
    console.error("Expense creation failed:", error);

    if (error.response && error.response.data && error.response.data.message) {
      
      alert(error.response.data.message);
    } else {
      alert("Cannot create expense.");
    }
  }
}

async function fetchExpenses() {
  try {
   
    const response = await axios.get(`${API_URL}/all`, {
      withCredentials: true,
    });

    const expenses = response.data.expenses;

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
        `;
        creditList.appendChild(li);
      } else {
        totalDebit += parseFloat(item.amount);
        li.innerHTML = `
          <span class="item-note">${item.description}</span>
          <span class="item-amount debit-amount">${amountStr}</span>
        `;
        debitList.appendChild(li);
      }
    });

    const currentBalance = totalCredit - totalDebit;

    balanceDisplay.innerText = `$${currentBalance.toFixed(2)}`;
    totalCreditDisplay.innerText = `$${totalCredit.toFixed(2)}`;
    totalDebitDisplay.innerText = `$${totalDebit.toFixed(2)}`;
    
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    if (error.response && error.response.status === 401) {
      window.location.href = "login.html";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const addEntryBtn = document.getElementById("add-entry-btn");
  const expenseModal = document.getElementById("expenseModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const createExpenseForm = document.getElementById("createExpenseForm");

  const openModal = () => {
    expenseModal.style.display = "flex";
  };

  const closeModal = () => {
    expenseModal.style.display = "none";
    createExpenseForm.reset();
  };

  
  if (addEntryBtn) addEntryBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === expenseModal) {
      closeModal();
    }
  });


  createExpenseForm.addEventListener("submit", createExpense);

  fetchExpenses();
});
