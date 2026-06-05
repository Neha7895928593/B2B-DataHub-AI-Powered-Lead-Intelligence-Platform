
import express from "express";
import { analyzeDataset, chatWithAI } from "../../controllers/admin/aiController.js";

const router = express.Router();

// AI Analysis route
router.post("/analyze-dataset", analyzeDataset);
router.post("/chat-with-ai", chatWithAI);

export default router;
