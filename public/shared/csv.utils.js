export function MonthlyCSV(expensesArray, filename) {
  if (!expensesArray || expensesArray.length === 0) {
    alert("No data available to download for this month.");
    return;
  }
  
  const headers = ["Date", "Description", "Category", "Amount", "TransactionType"];

  const rows = expensesArray.map((exp) => {
    
    const date = exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : "Unknown Date";

   
    const safeDescription = `"${(exp.description || "").replace(/"/g, '""')}"`;

   
    const category = exp.category || "Uncategorized";
    
    const amount = exp.amount ? parseFloat(exp.amount).toFixed(2) : "0.00";

    const transactionType = exp.transactionType;

    return [date, safeDescription, category, amount, transactionType].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function YearlyCSV(expensesArray, filename) {
  if (!expensesArray || expensesArray.length === 0) {
    alert("No data available to download for this year.");
    return;
  }

  
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const headers = ["Month", "Total Income", "Total Expense"];

  const rows = expensesArray.map((exp) => {
    
    const monthName = monthNames[exp.month - 1] || "Unknown Month";

    
    
    const totalExpense = exp.totalExpense ? parseFloat(exp.totalExpense).toFixed(2) : "0.00";

     const totalIncome = exp.totalIncome ? parseFloat(exp.totalIncome).toFixed(2) : "0.00";

    return [monthName, totalExpense, totalIncome].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}