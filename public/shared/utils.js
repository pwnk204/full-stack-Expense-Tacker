export function exportToCSV(expensesArray, filename) {
  if (!expensesArray || expensesArray.length === 0) {
    alert("No data available to download for this period.");
    return;
  }

  const headers = ["Date", "Description", "Transaction Type", "Amount"];

  const rows = expensesArray.map((exp) => {
    const date = new Date(exp.date).toLocaleDateString();

    const safeDescription = `"${(exp.description || "").replace(/"/g, '""')}"`;

    const type = exp.transactionType;
    const amount = parseFloat(exp.amount).toFixed(2);

    return [date, safeDescription, type, amount].join(",");
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
