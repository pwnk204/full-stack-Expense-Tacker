import { exportToCSV } from "../../shared/utils.js";
import logger from '../../shared/logger.js';

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

let currentMonthlyExpenses = [];

let currentDate = new Date();

let isPremium = 0;

document.getElementById("btn-prev-date").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);

  updateMonthDisplayUI();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  logger.info("Navigated to previous month", { year, month });
  fetchMonthlyData(year, month);
});

document.getElementById("btn-next-date").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateMonthDisplayUI();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  logger.info("Navigated to next month", { year, month });
  fetchMonthlyData(year, month);
});

const updateMonthDisplayUI = () => {
  const month = currentDate.toLocaleString("default", { month: "short" });
  const year = currentDate.getFullYear();

  document.getElementById("display-month-year").innerText = `${month}, ${year}`;
};

async function fetchMonthlyData(year, month) {
  try {
    logger.info("Fetching monthly data", { year, month });

    const response = await axios.get(
      `/api/v1/expense/monthly?year=${year}&month=${month}`,
      {
        withCredentials: true,
      },
    );

    const transactions = response.data.data.data;
    currentMonthlyExpenses = response.data.data.data;
    const tableBody = document.getElementById("monthly-table-body");

    tableBody.innerHTML = ""; // Clear existing rows

    let monthTotalIncome = 0;
    let monthTotalExpense = 0;
    const monthName = monthNames[month];

   
    logger.info("Monthly data loaded successfully", { recordCount: transactions.length });

    transactions.forEach((dayData) => {
      const income = parseFloat(dayData.totalIncome || 0);
      const expense = parseFloat(dayData.totalExpense || 0);

      
      monthTotalIncome += income;
      monthTotalExpense += expense;

      
      const dateString = `${dayData.day} ${monthName} ${year}`;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${dateString}</td>
                <td class="text-right ${income > 0 ? "text-success" : ""}">${income > 0 ? "$" + income.toFixed(2) : "-"}</td>
                <td class="text-right ${expense > 0 ? "text-danger" : ""}">${expense > 0 ? "$" + expense.toFixed(2) : "-"}</td>
            `;

      tableBody.appendChild(row);
    });

    isPremium = 1;

    updateSummaryCards(monthTotalIncome, monthTotalExpense);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      
      logger.warn("Monthly view access denied: Premium paywall triggered");

      document.querySelector(".table-container").innerHTML = `
                <div class="locked-state">
                    <h2>Premium Feature</h2>
                    <p>Unlock monthly and yearly reports by upgrading your account.</p>
                    <button onclick="window.location.href='profile.html'" class="btn-primary">
                        Upgrade Now
                    </button>
                </div>
            `;
    } else {
      logger.error("Failed to fetch monthly data", error);
      alert("Something went wrong loading your expenses.");
    }
  }
}

function updateSummaryCards(income, expense) {
  const balance = income - expense;

  const incomeDisplay = document.querySelector(
    ".credit-summary h4:nth-child(2)",
  );
  const expenseDisplay = document.querySelector(
    ".debit-summary h4:nth-child(2)",
  );
  const balanceDisplay = document.querySelector(".balance-display h3");

  if (incomeDisplay) incomeDisplay.innerText = `$${income.toFixed(2)}`;
  if (expenseDisplay) expenseDisplay.innerText = `$${expense.toFixed(2)}`;

  if (balanceDisplay) {
    balanceDisplay.innerText = `$${balance.toFixed(2)}`;
   
    balanceDisplay.style.color = balance >= 0 ? "#4db6ac" : "#e53935";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  updateMonthDisplayUI();
  fetchMonthlyData(year, month);

  const downloadBtn = document.getElementById("btn-download-csv");
  
 
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (!isPremium) {
        logger.warn("CSV download blocked: User has not unlocked premium features");
        return;
      }

      const dateString = new Date().toISOString().split("T")[0];
      const filename = `Expenses_Report_${dateString}.csv`;

      logger.info("CSV download initiated", { filename, recordsExported: currentMonthlyExpenses.length });
      
      exportToCSV(currentMonthlyExpenses, filename);
    });
  }
});