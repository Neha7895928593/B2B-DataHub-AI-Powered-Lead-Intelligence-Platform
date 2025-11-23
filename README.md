B2B Lead Generation & Management Platform
This is a comprehensive full-stack platform designed for B2B professionals to import, segment, and manage lead data. It streamlines the process of handling large prospect lists from CSV or Excel files, preparing them for sales and marketing campaigns.
The application features a powerful Node.js/Express backend with a PostgreSQL database and a responsive React frontend built with Vite.
Key Features
Bulk Lead Import: Easily upload lead lists in .csv or .xlsx format.
Dynamic Data Mapping: Map columns from your file to standard database fields like name, email, and phone.
Data Segmentation: Filter and organize leads by category, country, state, and city.
Centralized Database: Store all your B2B lead data in a structured and scalable PostgreSQL database.
RESTful API: A clean and efficient API for all data operations.
Prerequisites
Before you begin, ensure you have the following installed on your system:
Node.js (v16.x or higher)
npm (included with Node.js)
PostgreSQL
Local Setup Instructions
Follow these steps to get the project running on your local machine.
1. Backend Setup
a. Navigate to the backend directory and install dependencies:
code
Bash
cd backend
npm install
b. Create the PostgreSQL Database:
Create a dedicated database for the application. You can use psql or a GUI tool like pgAdmin.
code
Bash
# Log in to PostgreSQL
psql -U postgres

# Create the leads database
CREATE DATABASE b2b_database;

#create tables 
-- old table delete
DROP TABLE IF EXISTS dataset, dataset_source, city, state, country, category;

-- Category Table
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL
);

-- Country Table
CREATE TABLE country (
    country_id SERIAL PRIMARY KEY,
    country_name VARCHAR(255) UNIQUE NOT NULL
);

-- State Table
CREATE TABLE state (
    state_id SERIAL PRIMARY KEY,
    state_name VARCHAR(255) NOT NULL,
    country_id INTEGER REFERENCES country(country_id) ON DELETE CASCADE,
    UNIQUE (state_name, country_id)
);

-- City Table
CREATE TABLE city (
    city_id SERIAL PRIMARY KEY,
    city_name VARCHAR(255) NOT NULL,
    state_id INTEGER REFERENCES state(state_id) ON DELETE CASCADE,
    UNIQUE (city_name, state_id)
);

-- Dataset Source Table 
CREATE TABLE dataset_source (
    source_id SERIAL PRIMARY KEY,
    source_name VARCHAR(255),
    description TEXT,
    proof_attachment VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main Dataset Table ()
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
    extra_fields JSONB, -- JSONB extra data store karne ke liye behtar hai
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster searching
CREATE INDEX idx_dataset_email ON dataset(email);
CREATE INDEX idx_dataset_phone ON dataset(phone);
CREATE INDEX idx_dataset_source ON dataset(source_id);

default category//////////////

INSERT INTO category (category_name) VALUES ('Default Category');
INSERT INTO country (country_name) VALUES ('Default Country');
INSERT INTO state (state_name, country_id) VALUES ('Default State', 1);
INSERT INTO city (city_name, state_id) VALUES ('Default City', 1);



# Exit psql
\q
c. Configure Environment Variables:
In the /backend directory, create a .env file by copying the example file.
code
Bash
cp .env.example .env
Open the new .env file and update it with your local database credentials:
code
Env
# /backend/.env

PGUSER=postgres
PGHOST=localhost
PGDATABASE=b2b_database
PGPASSWORD=your_local_postgres_password
PGPORT=5432
d. Initialize the Database Schema:
The schema.sql file contains the required table structures. Run this script on your database to create the tables.
code
Bash
psql -U postgres -d b2b_leads_db -f path/to/your/schema.sql```
This will create the `dataset`, `category`, `country`, and other necessary tables for storing lead data.

**e. Start the Backend Server:**
```bash
# Run in development mode with auto-reload
npm run dev```
The backend API will now be running on `http://localhost:5000`.

---

### 2. Frontend Setup

**a. Navigate to the frontend directory and install dependencies:**
```bash
# From the project's root directory
cd frontend
npm install
b. Configure Environment Variables:
In the /frontend directory, create a .env file and add the URL for the backend API.
code
Env
# /frontend/.env

VITE_API_BASE_URL=http://localhost:5000/api
c. Start the Frontend Application:
code
Bash
npm run dev
The React application will now be running on http://localhost:3000.
The React application will now be running on http://localhost:3000/admin. for admin-access

