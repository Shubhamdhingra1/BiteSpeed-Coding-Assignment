import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
export const getConnectionString = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  return process.env.DATABASE_URL;
};

export const db = mysql.createPool(getConnectionString());
