import dotenv from 'dotenv';
dotenv.config();

// 2. AB BAAKI CHEEZEIN IMPORT KAREIN
import pkg from 'pg';
const { Pool } = pkg;

// 3. AB POOL BANAYEIN, KYUNKI process.env VARIABLES LOAD HO CHUKE HAIN
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE, // Yeh ab hamesha sahi value lega
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

pool.connect()
  .then(client => {
    // Connection safal hone par database ka naam print karein
    console.log(`✅ PostgreSQL Connected Successfully to database "${client.database}"!`);
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err);
  });

export default pool;