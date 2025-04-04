require("dotenv").config();
const mysql = require("mysql2/promise");

// Create a connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_CONTAINER || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.MYSQL_ROOT_USER || "root",
  password: process.env.MYSQL_ROOT_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "your_db_name",
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
});

// Utility function to query the database
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  query,
};
