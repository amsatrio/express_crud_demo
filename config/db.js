import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const hospitalPool = createPool({
  host: process.env.DB_HOSPITAL_HOST,
  user: process.env.DB_HOSPITAL_USER,
  password: process.env.DB_HOSPITAL_PASSWORD,
  database: process.env.DB_HOSPITAL_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const germanPool = createPool({
  host: process.env.DB_GERMAN_HOST,
  user: process.env.DB_GERMAN_USER,
  password: process.env.DB_GERMAN_PASSWORD,
  database: process.env.DB_GERMAN_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export { hospitalPool, germanPool };