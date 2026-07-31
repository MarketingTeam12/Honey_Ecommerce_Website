const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { initializeDatabase, pool } = require("../config/database");

async function main() {
  try {
    await initializeDatabase();
    const [rows] = await pool.query("SELECT 1 AS ok");

    console.log("MySQL database setup completed successfully.");
    console.log(`Connection test: ${rows[0]?.ok === 1 ? "OK" : "FAILED"}`);
    process.exitCode = 0;
  } catch (error) {
    console.error("MySQL database setup failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
