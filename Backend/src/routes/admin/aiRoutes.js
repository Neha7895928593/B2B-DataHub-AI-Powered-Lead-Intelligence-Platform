import express from "express";
import { analyzeDataset, chatWithAI, generateOutreachHooks } from "../../controllers/admin/aiController.js";

const router = express.Router();

// AI Analysis route
router.post("/analyze-dataset", analyzeDataset);
router.post("/chat-with-ai", chatWithAI);
router.post("/generate-hooks", generateOutreachHooks);

export default router;
