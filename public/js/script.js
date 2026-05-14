const API_URL = 'http://localhost:3000/api/expenses'; 
let editingId = null;
let globalExpenses = [];


const expenseForm = document.getElementById('expense-form');
const tableBody = document.querySelector('#expenseTable tbody');
const totalDisplay = document.getElementById('totalDisplay');
const submitBtn = document.getElementById('addBtn');

const getExpenses = async () => {
    try {
        const response = await axios.get(API_URL);
        
        if (response.data.success) {
            globalExpenses = response.data.data.expenses;
            renderExpenses(globalExpenses);
        }
    } catch (error) {
        console.error("Error fetching expenses:", error.response?.data?.message || error.message);
    }
};

const renderExpenses = (expensesArray) => {

    tableBody.innerHTML = '';
    
    let runningTotal = 0;


    if (expensesArray.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No expenses recorded yet.</td></tr>`;
        totalDisplay.innerText = `$0.00`;
        return;
    }

 
    expensesArray.forEach(expense => {

        runningTotal += Number(expense.amount);


        const displayDescription = expense.description ? expense.description : '';
        
    
        const rawDate = expense.expenseDate; 
        const formattedDate = new Date(rawDate).toLocaleDateString();

        const rowHTML = `
            <tr data-id="${expense.id}">
                <td>${expense.title}</td>
                <td>${displayDescription}</td>
                <td>INR ${Number(expense.amount).toFixed(2)}</td>
                <td>${expense.category}</td>
                <td>${formattedDate}</td>
                <td class="action-btns">
                    <button class = "edit-btn id = "add-Btn">✏️</button>
                    <button class = "delete-btn" >🗑️</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowHTML);
    });

    totalDisplay.innerText = `₹ ${runningTotal.toFixed(2)}`;
};


tableBody.addEventListener('click', async (event) => {
    
   
    if (event.target.classList.contains('delete-btn')) {
        
        const row = event.target.closest('tr');
        const expenseId = row.getAttribute('data-id');
        
        
        deleteExpense(expenseId);
    }
    

    if (event.target.classList.contains('edit-btn')) {
        const row = event.target.closest('tr');
        const expenseId = Number(row.getAttribute('data-id'));
        
        prepareEdit(expenseId);
    }
});

const deleteExpense = async (id) => {
    
    const isConfirmed = confirm("Are you sure you want to delete this expense?");
    if (!isConfirmed) return;

    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        
        if (response.data.success) {

            getExpenses();
        }
    } catch (error) {
        alert("Error deleting expense: " + (error.response?.data?.message || "Server error"));
        console.error("DELETE Error:", error);
    }
};


const prepareEdit =  (id) => {

    const expense = globalExpenses.find(e => e.id === id);
    if (!expense) return;

    
    document.getElementById('title').value = expense.title;
    document.getElementById('description').value = expense.description || '';
    document.getElementById('amount').value = expense.amount;
    document.getElementById('category').value = expense.category;
    
    const rawDate = expense.expenseDate;
    document.getElementById('expenseDate').value = new Date(rawDate).toISOString().split('T')[0];

   
    editingId = id; 
    submitBtn.innerText = "Update Expense"; 
    submitBtn.style.backgroundColor = "#ff9800"; 
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


expenseForm.addEventListener('submit', async (event) => {

    event.preventDefault(); 

   
    const expenseData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value || null, 
        amount: Number(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('expenseDate').value 
    };

    try {
        if (editingId) {

            const response = await axios.patch(`${API_URL}/${editingId}`, expenseData);
            
            if (response.data.success) {

                editingId = null;
                submitBtn.innerText = "Add Expense";
                submitBtn.style.backgroundColor = "#221b5f"; 
            }
        } else {

            await axios.post(API_URL, expenseData);
        }

        expenseForm.reset();
        getExpenses();
        
    } catch (error) {
        const errorMessage = error.response?.data?.message || "Operation failed.";
        alert(`Error: ${errorMessage}`);
        console.error("Submit Error:", error);
    }
});


document.addEventListener('DOMContentLoaded', getExpenses);