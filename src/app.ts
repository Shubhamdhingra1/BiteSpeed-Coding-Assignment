import express from "express";
import dotenv from "dotenv";
import identifyRouter from "./routes/identify";
import mysql from "mysql2/promise";
import { connectionString } from "./config/db";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/identify", identifyRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});export const db = mysql.createPool(connectionString);

