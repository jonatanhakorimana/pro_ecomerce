import "dotenv/config";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sql = await fs.readFile(new URL("../schema.sql", import.meta.url), "utf8");
const database = process.env.DB_NAME || "shopeazy_db";
if (!/^[A-Za-z0-9_$-]+$/.test(database)) {
  throw new Error("DB_NAME may contain only letters, numbers, underscores, dollar signs, and hyphens.");
}
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || ""
});

try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${database}\``);
  const [existingIds] = await connection.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_TYPE AS columnType
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'id'`
  );
  const idTypes = new Map(existingIds.map(({ tableName, columnType }) => [tableName, columnType.toUpperCase()]));
  const statements = sql.split(/;\s*(?:\r?\n|$)/).map((part) => part.trim()).filter(Boolean);

  for (let statement of statements) {
    const foreignKeys = [...statement.matchAll(/FOREIGN KEY\s*\(\s*(\w+)\s*\)\s*REFERENCES\s+(\w+)\s*\(\s*id\s*\)/gi)];
    for (const [, columnName, referencedTable] of foreignKeys) {
      const referencedIdType = idTypes.get(referencedTable) || "BIGINT UNSIGNED";
      statement = statement.replace(
        new RegExp(`(\\b${columnName}\\s+)BIGINT UNSIGNED\\b`, "i"),
        `$1${referencedIdType}`
      );
    }
    await connection.query(statement);

    const createdTable = statement.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
    if (createdTable) {
      const [idColumn] = await connection.query(
        `SELECT COLUMN_TYPE AS columnType FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'id'`,
        [createdTable[1]]
      );
      if (idColumn[0]) idTypes.set(createdTable[1], idColumn[0].columnType.toUpperCase());
    }
  }

  const [legacyRoleColumn] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`
  );
  if (legacyRoleColumn.length) {
    await connection.query(
      `INSERT IGNORE INTO admins (id, name, email, password_hash, phone, address, city, zip_code, country)
       SELECT id, name, email, password_hash, phone, address, city, zip_code, country
       FROM users WHERE role = 'admin'`
    );
    const [adminSlotIndex] = await connection.query(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
         AND INDEX_NAME = 'uq_users_single_admin'`
    );
    const [adminSlotColumn] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'admin_slot'`
    );
    if (adminSlotIndex.length) await connection.query("ALTER TABLE users DROP INDEX uq_users_single_admin");
    if (adminSlotColumn.length) await connection.query("ALTER TABLE users DROP COLUMN admin_slot");
    await connection.query("ALTER TABLE users DROP COLUMN role");
    console.log("[Shop Eazy] Migrated administrator accounts into the admins table.");
  }

  await connection.query(
    `INSERT INTO order_status_history (order_id, shipping_status, tracking_number, location, note, created_at)
     SELECT o.id, o.shipping_status, o.tracking_number, 'Shop Eazy fulfillment center', 'Initial status', o.created_at
     FROM orders o
     WHERE NOT EXISTS (
       SELECT 1 FROM order_status_history h WHERE h.order_id = o.id
     )`
  );

  console.log(`[Shop Eazy] Database schema initialized: ${database}`);
} finally {
  await connection.end();
}
