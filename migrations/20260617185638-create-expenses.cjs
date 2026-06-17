"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Expenses", {
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      transactionType: {
        type: Sequelize.ENUM("credit", "debit"),
        allowNull: false,
      },

      date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      category: {
        type: Sequelize.ENUM(
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
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Expenses");
  },
};
