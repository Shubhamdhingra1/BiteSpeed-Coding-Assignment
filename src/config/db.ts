import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
export const connectionString = process.env.DATABASE_URL;
export const db = mysql.createPool(connectionString);
