import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";


const Expense = sequelize.define("Expense", {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  transactionType: {
    type: DataTypes.ENUM("credit", "debit"),
    allowNull: false,
  },

  date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  category: {
    type: DataTypes.ENUM(
      "Food",
      "Housing",
      "Transportation",
      "Utilities",
      "Entertainment",
      "Health",
      "Personal",
      "Education",
      "Debt",
      "Salary",
      "Other",
    ),
    allowNull: false,
    defaultValue: "other",
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },
});

//hooks to make sure i don't forget update the totalExpense and it should be in sync.

Expense.addHook("afterCreate", async (expense, options) => {
  // transaction passed down from the main controller to hooks in sequelize
  const t = options.transaction;

  await User.increment("totalExpense", {
    by: parseFloat(expense.amount),
    where: { id: expense.userId },
    transaction: t,
  });
});

Expense.addHook("afterDestroy", async (expense, options) => {
  try {
    const user = await User.findByPk(expense.userId);
    if (user) {
      const currentTotal = parseFloat(user.totalExpense);
      const removedAmount = parseFloat(expense.amount);

      user.totalExpense = currentTotal - removedAmount;
      await user.save();
    }
  } catch (error) {
    console.error(
      "Hook Error: Failed to update totalExpense on destroy",
      error,
    );
  }
});

Expense.addHook("afterUpdate", async (expense, options) => {
  try {
    if (expense.changed("amount")) {
      const user = await User.findByPk(expense.userId);
      if (user) {
        const oldAmount = parseFloat(expense.previous("amount"));
        const newAmount = parseFloat(expense.amount);

        // If I change a $10 expense to $15, the difference is +$5
        const difference = newAmount - oldAmount;

        user.totalExpense = parseFloat(user.totalExpense) + difference;
        await user.save();
      }
    }
  } catch (error) {
    console.error("Hook Error: Failed to update totalExpense on update", error);
  }
});

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

// Expense.addHook("beforeCreate", async (expense, options) => {
//   try {
//     const prompt = `
//             You are an AI assistant for an expense tracker application. 
//             Categorize the following expense based on its description and amount.
            
//             Description: "${expense.description}"
//             Amount: ${expense.amount}
            
//             You MUST reply with exactly ONE word from this exact list: 
//             [Food, Transport, Utilities, Entertainment, Health, Shopping, Salary, Other]
            
//             Do not include punctuation, explanations, or any other words. Just the category name.
//         `;

//     const result = await model.generateContent(prompt);
//     const categoryResponse = result.response.text().trim();

//     expense.category = categoryResponse;
//   } catch (error) {
//     console.error("Gemini AI categorization failed:", error);
//     expense.category = "Other";
//   }
// });

export default Expense;
