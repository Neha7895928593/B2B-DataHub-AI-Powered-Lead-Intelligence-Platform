import express from 'express';
import cors from 'cors';
import pool from './src/config/db.js';
import datasetRoutes from './src/routes/admin/manageDataRoutes.js';

const app = express();

// Enable CORS before defining routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Routes
app.use("/api", datasetRoutes);


// Start server
const PORT = 5001||process.env.PORT;
app.listen(PORT,"0.0.0.0", () => console.log(`Server running on port ${PORT}`));
