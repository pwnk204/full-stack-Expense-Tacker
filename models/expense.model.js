import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.model.js";
import { logger } from "../utils/index.js";

const Expense = sequelize.define("Expense", {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },

  transactionType: {
    type: DataTypes.ENUM("credit", "debit"),
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
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

Expense.addHook("afterCreate", async (expense, options) => {
  try {
    const t = options.transaction;

    await User.increment("totalExpense", {
      by: parseFloat(expense.amount),
      where: { id: expense.userId },
      transaction: t,
    });

    logger.info("Hook afterCreate: User totalExpense incremented", {
      userId: expense.userId,
      expenseId: expense.id,
      amountAdded: expense.amount,
    });
  } catch (error) {
    logger.error("Hook Error: Failed to update totalExpense on create", {
      userId: expense.userId,
      expenseId: expense.id,
      error: error.message,
    });
  }
});

Expense.addHook("afterDestroy", async (expense, options) => {
  try {
    const user = await User.findByPk(expense.userId);
    if (user) {
      const currentTotal = parseFloat(user.totalExpense);
      const removedAmount = parseFloat(expense.amount);

      user.totalExpense = currentTotal - removedAmount;
      await user.save();

      logger.info("Hook afterDestroy: User totalExpense decremented", {
        userId: expense.userId,
        expenseId: expense.id,
        amountRemoved: expense.amount,
      });
    } else {
      logger.warn(
        "Hook afterDestroy: Expense deleted but User not found to update total",
        {
          userId: expense.userId,
          expenseId: expense.id,
        },
      );
    }
  } catch (error) {
    logger.error("Hook Error: Failed to update totalExpense on destroy", {
      userId: expense.userId,
      expenseId: expense.id,
      error: error.message,
    });
  }
});

Expense.addHook("afterUpdate", async (expense, options) => {
  try {
    if (expense.changed("amount")) {
      const user = await User.findByPk(expense.userId);
      const t = options.transaction;

      if (user) {
        const oldAmount = parseFloat(expense.previous("amount"));
        const newAmount = parseFloat(expense.amount);

        const difference = newAmount - oldAmount;

        user.totalExpense = parseFloat(user.totalExpense) + difference;
        await user.save({ transaction: t });

        logger.info("Hook afterUpdate: User totalExpense adjusted", {
          userId: expense.userId,
          expenseId: expense.id,
          differenceApplied: difference,
        });
      } else {
        logger.warn(
          "Hook afterUpdate: Expense updated but User not found to update total",
          {
            userId: expense.userId,
            expenseId: expense.id,
          },
        );
      }
    }
  } catch (error) {
    logger.error("Hook Error: Failed to update totalExpense on update", {
      userId: expense.userId,
      expenseId: expense.id,
      error: error.message,
    });
  }
});

export default Expense;
