import { YearlyCSV } from "../../shared/csv.utils.js";
import logger from "../../shared/logger.js";

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

let currentDate = new Date();

let currentYearlyExpenses = [];

let isPremium = 0;

document.getElementById("btn-prev-date").addEventListener("click", () => {
  currentDate.setFullYear(currentDate.getFullYear() - 1);

  updateYearDisplayUI();
  const year = currentDate.getFullYear();

  logger.info("Navigated to previous year", { year });
  fetchYearlyData(year);
});

document.getElementById("btn-next-date").addEventListener("click", () => {
  currentDate.setFullYear(currentDate.getFullYear() + 1);

  updateYearDisplayUI();
  const year = currentDate.getFullYear();

  logger.info("Navigated to next year", { year });
  fetchYearlyData(year);
});

const updateYearDisplayUI = () => {
  const year = currentDate.getFullYear();
  document.getElementById("display-year").innerText = `${year}`;
};

async function fetchYearlyData(year) {
  try {
    logger.info("Fetching yearly data", { year });

    const response = await axios.get(`/api/v1/expense/yearly?year=${year}`, {
      withCredentials: true,
    });

    const transactions = response.data.data.data;

    currentYearlyExpenses = response.data.data.data;

    const tableBody = document.getElementById("yearly-table-body");

    logger.info("Yearly data loaded successfully", {
      recordCount: transactions.length,
    });

    tableBody.innerHTML = "";
    let runningBalance = 0;

    transactions.forEach((transaction) => {
      const monthName = monthNames[transaction.month - 1];

      const income = parseFloat(transaction.totalIncome || 0);
      const expense = parseFloat(transaction.totalExpense || 0);

      const netBalance = income - expense;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${monthName}</td>
        <td>${income > 0 ? "$" + income.toFixed(2) : "-"}</td>
        <td>${expense > 0 ? "$" + expense.toFixed(2) : "-"}</td>
        <td style="font-weight: bold; color: ${netBalance >= 0 ? "#4db6ac" : "#e53935"}">
            $${netBalance.toFixed(2)}
        </td>
    `;

      tableBody.appendChild(row);
    });
    isPremium = 1;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      logger.warn("Yearly view access denied: Premium paywall triggered");

      document.querySelector(".table-container").innerHTML = `
                <div class="locked-state">
                    <h2>⭐ Premium Feature</h2>
                    <p>Unlock monthly and yearly reports by upgrading your account.</p>
                    <button onclick="window.location.href='profile.html'" class="btn-primary">
                        Upgrade Now
                    </button>
                </div>
            `;
    } else {
      logger.error("Failed to fetch yearly data", error);
      alert("Something went wrong loading your expenses.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateYearDisplayUI();
  const year = currentDate.getFullYear();
  fetchYearlyData(year);
  const downloadBtn = document.getElementById("btn-download-csv");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (!isPremium) {
        logger.warn(
          "CSV download blocked: User has not unlocked premium features",
        );
        return;
      }

      const dateString = new Date().toISOString().split("T")[0];
      const filename = `Expenses_Report_${dateString}.csv`;

      logger.info("CSV download initiated", {
        filename,
        recordsExported: currentYearlyExpenses.length,
      });

      YearlyCSV(currentYearlyExpenses, filename);
    });
  }
});
