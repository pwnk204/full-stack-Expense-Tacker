import express, { urlencoded } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import { sequelize, User, Expense, Order } from "./models/index.js";
import apiRoutes from "./routes/index.js";
import {ErrorMiddleware} from './middlewares/index.js';
import { logger } from './utils/index.js';

dotenv.config();
const app = express();

const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://127.0.0.1:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

const frontendDirectory = path.join(process.cwd(), "./public");

app.use(express.static(frontendDirectory));

app.use("/api", apiRoutes);

app.use(ErrorMiddleware.errorHandler);

// console.log("Registered Models:", sequelize.models);
logger.debug("Registered Models successfully", { 
  models: Object.keys(sequelize.models) 
});

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("All models were synchronized successfully.");
    app.listen(port, (err) => {
      console.log(`Server is up and listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("Synchronisation failed: ", err);
  });
