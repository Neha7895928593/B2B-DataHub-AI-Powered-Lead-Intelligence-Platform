DROP TABLE IF EXISTS transactions, orders, customers, dataset, dataset_source, city, state, country, category;

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE country (
    country_id SERIAL PRIMARY KEY,
    country_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE state (
    state_id SERIAL PRIMARY KEY,
    state_name VARCHAR(255) NOT NULL,
    country_id INTEGER REFERENCES country(country_id) ON DELETE CASCADE,
    UNIQUE (state_name, country_id)
);

CREATE TABLE city (
    city_id SERIAL PRIMARY KEY,
    city_name VARCHAR(255) NOT NULL,
    state_id INTEGER REFERENCES state(state_id) ON DELETE CASCADE,
    UNIQUE (city_name, state_id)
);

CREATE TABLE dataset_source (
    source_id SERIAL PRIMARY KEY,
    source_name VARCHAR(255),
    description TEXT,
    proof_attachment VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dataset (
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
);

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
);

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
);

CREATE INDEX idx_dataset_email ON dataset(email);
CREATE INDEX idx_dataset_phone ON dataset(phone);
CREATE INDEX idx_dataset_source ON dataset(source_id);

INSERT INTO category (category_name) VALUES ('Default Category');
INSERT INTO country (country_name) VALUES ('Default Country');
INSERT INTO state (state_name, country_id) VALUES ('Default State', 1);
INSERT INTO city (city_name, state_id) VALUES ('Default City', 1);
