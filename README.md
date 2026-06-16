# Full-Stack Expense Tracker

A full stack application built to track daily finances and manage expenses.

---

## Features

- **User Auth & Security:** Secure JWT authentication via HTTP-only cookies, password hashing, and input validation using `express-validator`.
- **Expense Management:** Full CRUD operations with background aggregate syncing.
- **Premium Tier Features:** Integrated Cashfree Payment Gateway, real time leaderboard analytics, interactive monthly,yearly financial statements, and CSV data export functionality.

---

## Tech Stack

- **Frontend:** JavaScript, Axios, HTML, CSS
- **Backend:** Node.js, Express.js
- **Database & ORM:** Relational Database MySQL, Sequelize ORM
- **Payment Gateway:** Cashfree-pg SDK

---

## Local Setup & Installation

Follow these steps to run the project locally on your machine.

**1. Clone & Install Dependencies**
```
git clone https://github.com/pwnk204/expense-tracker.git
cd Expense-Tracker
npm install
```

**2. Database Configuration**

Create a .env file in the root of your backend directory and add your MySQL database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
PORT=3000
```

**4. Start the Server**

Start the backend using Node native watch mode (requires Node v18.11+):
```
node --watch index.js
```
Author: Pawan