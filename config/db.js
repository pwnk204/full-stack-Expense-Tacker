import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  'expense_tracker',
  'root',
  process.env.DB_PASSWORD,
  {
    host: 'localhost',
    dialect: 'mysql',
  },
);

const connection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

connection();

export default sequelize
