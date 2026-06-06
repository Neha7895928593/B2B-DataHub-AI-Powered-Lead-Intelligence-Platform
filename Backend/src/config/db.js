import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT || 5432),
});

const seedAdminAccount = async (client) => {
  const adminEmail = (process.env.ADMIN_EMAIL || "change-admin-email@example.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "change-admin-password";
  const adminFullName = process.env.ADMIN_FULL_NAME || "Admin User";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await client.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET
       full_name = EXCLUDED.full_name,
       password_hash = EXCLUDED.password_hash,
       role = 'admin'`,
    [adminFullName, adminEmail, passwordHash],
  );

  return adminEmail;
};

const hasColumn = async (client, table, column) => {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2
     ) AS exists`,
    [table, column],
  );

  return result.rows[0].exists;
};

const createCoreDatasetTables = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS category (
      category_id SERIAL PRIMARY KEY,
      category_name VARCHAR(255) UNIQUE NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS country (
      country_id SERIAL PRIMARY KEY,
      country_name VARCHAR(255) UNIQUE NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS state (
      state_id SERIAL PRIMARY KEY,
      state_name VARCHAR(255) NOT NULL,
      country_id INTEGER REFERENCES country(country_id) ON DELETE CASCADE,
      UNIQUE (state_name, country_id)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS city (
      city_id SERIAL PRIMARY KEY,
      city_name VARCHAR(255) NOT NULL,
      state_id INTEGER REFERENCES state(state_id) ON DELETE CASCADE,
      UNIQUE (city_name, state_id)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS dataset_source (
      source_id SERIAL PRIMARY KEY,
      source_name VARCHAR(255),
      description TEXT,
      proof_attachment VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS dataset (
      dataset_id SERIAL PRIMARY KEY,
      source_id INTEGER REFERENCES dataset_source(source_id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES category(category_id),
      country_id INTEGER REFERENCES country(country_id),
      state_id INTEGER REFERENCES state(state_id),
      city_id INTEGER REFERENCES city(city_id),
      name VARCHAR(255),
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      price NUMERIC(10, 2),
      extra_fields JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const createOrdersTable = `
  CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES dataset(dataset_id) ON DELETE SET NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    dataset_label VARCHAR(255),
    download_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`;

const createTransactionsTable = `
  CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL DEFAULT 'sale',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NOT NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'manual',
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`;

const createCustomersTable = `
  CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`;

const resetTable = async (client, tableName, createSql, reason = "") => {
  if (reason) {
    console.warn(`${reason} Recreating "${tableName}" table.`);
  }
  await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
  await client.query(createSql);
};

const ensureOrdersTable = async (client) => {
  const hasCustomers = await hasColumn(client, "customers", "customer_id");
  if (!hasCustomers) {
    await resetTable(client, "customers", createCustomersTable, "Customers table schema is incompatible.");
  }

  const hasOrdersTable = await client.query("SELECT to_regclass('public.orders') IS NOT NULL AS exists");
  if (!hasOrdersTable.rows[0].exists) {
    await client.query(createOrdersTable);
    return;
  }

  const requiredOrderColumns = [
    "order_id",
    "dataset_id",
    "customer_id",
    "payment_method",
    "payment_status",
    "amount",
    "created_at",
  ];
  for (const column of requiredOrderColumns) {
    const hasRequiredColumn = await hasColumn(client, "orders", column);
    if (!hasRequiredColumn) {
      await resetTable(
        client,
        "orders",
        createOrdersTable,
        "Legacy orders table detected with incompatible schema.",
      );
      break;
    }
  }
};

const ensureTransactionsTable = async (client) => {
  const hasTransactions = await client.query("SELECT to_regclass('public.transactions') IS NOT NULL AS exists");
  if (!hasTransactions.rows[0].exists) {
    await client.query(createTransactionsTable);
    return;
  }

  const requiredTransactionColumns = [
    "transaction_id",
    "order_id",
    "amount",
    "net_amount",
    "created_at",
  ];
  for (const column of requiredTransactionColumns) {
    const hasRequiredColumn = await hasColumn(client, "transactions", column);
    if (!hasRequiredColumn) {
      await resetTable(
        client,
        "transactions",
        createTransactionsTable,
        "Legacy transactions table detected with incompatible schema.",
      );
      break;
    }
  }
};

export const initializeDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log(`PostgreSQL connected to "${client.database}"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await createCoreDatasetTables(client);
    await ensureOrdersTable(client);
    await client.query(`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
    `);
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL;
    `);
    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS dataset_context JSONB;
    `);
    await ensureTransactionsTable(client);
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        reset_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Business tables are ready");
    const adminEmail = await seedAdminAccount(client);
    await client.query(
      `UPDATE users
       SET role = 'user'
       WHERE email <> $1 AND role = 'admin'`,
      [adminEmail],
    );
  } finally {
    client.release();
  }
};

export default pool;
