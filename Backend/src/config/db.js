import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

pool.connect()
  .then(client => {
    console.log("✅ PostgreSQL Connected Successfully!");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
  });

export default pool;
