import mysql from "mysql2/promise";

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || "shopeazy_db",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      decimalNumbers: true,
      dateStrings: true
    });
  }
  return pool;
}

export async function query(sql, values = []) {
  const [rows] = await getPool().execute(sql, values);
  return rows;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}