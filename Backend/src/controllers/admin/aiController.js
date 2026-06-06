
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();

if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY missing. AI analysis endpoint will reject requests until configured.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const DEFAULT_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
const configuredModels = process.env.GEMINI_MODELS
    ? process.env.GEMINI_MODELS.split(",").map((model) => model.trim()).filter(Boolean)
    : [];
const MODEL_OPTIONS = configuredModels.length ? configuredModels : DEFAULT_MODELS;

const parseAiError = (error) => {
    const rawMessage = error?.message || "AI provider returned an unknown error.";

    if (error?.errorDetails?.length) {
        const invalidKey = error.errorDetails.find((detail) =>
            detail?.reason === "API_KEY_INVALID" || detail?.message === "API key not valid. Please pass a valid API key."
        );
        if (invalidKey) {
            return "Google Gemini API key is invalid. Please update GEMINI_API_KEY.";
        }
    }

    if (rawMessage.includes("API_KEY_INVALID") || rawMessage.includes("Please pass a valid API key")) {
        return "Google Gemini API key is invalid or expired. Please update GEMINI_API_KEY.";
    }

    return rawMessage;
};

const runWithFallbackModels = async (executor) => {
    let lastError = null;

    for (const modelName of MODEL_OPTIONS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await executor(model);
            return { modelUsed: modelName, result };
        } catch (modelError) {
            lastError = modelError;
            const message = modelError?.message || "";
            const isModelUnavailable = message.includes("is not found") || message.includes("is not supported");
            if (!isModelUnavailable) {
                throw modelError;
            }
        }
    }

    throw lastError;
};

export const analyzeDataset = async (req, res) => {
    try {
        const { sampleData, headers, categoryName } = req.body;

        if (!sampleData || !headers) {
            return res.status(400).json({ success: false, message: "Sample data and headers are required for analysis." });
        }

        if (!GEMINI_API_KEY || !genAI) {
            return res.status(503).json({
                success: false,
                message: "AI service is not configured.",
                error: "Set GEMINI_API_KEY in the backend environment and restart the server.",
            });
        }

        const prompt = `
      You are a B2B Data Expert. Analyze the following dataset sample and category:
      Category: ${categoryName || 'General Leads'}
      Headers: ${headers.join(", ")}
      Sample Data (First 5 rows): ${JSON.stringify(sampleData)}

      Provide a high-level strategic analysis in JSON format with the following keys:
      1. "summary": A 1-sentence summary of what this dataset contains.
      2. "topSegments": An array of 3 strategic market segments identified in this data.
      3. "outreachTip": A specific tip on how a sales person should approach these leads.
      4. "trustScore": A number from 1 to 100 representing data quality based on structure and field presence.
      5. "potentialValue": A short phrase describing the commercial value (e.g., "High-Value Enterprise Targets").

      Response MUST be only the JSON object.
    `;

        const { modelUsed, result } = await runWithFallbackModels((model) => model.generateContent(prompt));
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonString);

        res.json({
            success: true,
            analysis,
            modelUsed,
        });
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return res.status(502).json({
            success: false,
            message: "AI Analysis failed.",
            error: parseAiError(error),
        });
    }
};

export const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required." });
        }

        if (!GEMINI_API_KEY || !genAI) {
            return res.status(503).json({ success: false, message: "AI service not configured." });
        }

        const { modelUsed, result } = await runWithFallbackModels((model) => {
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: "You are a B2B Data Hub Assistant. You help users find lead datasets, explain market segments, and provide sales advice. Keep responses short and professional." }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood. I am ready to help users with their B2B data needs." }],
                    },
                ],
            });

            return chat.sendMessage(message);
        });

        const response = await result.response;
        const text = response.text();

        res.json({
            success: true,
            reply: text,
            modelUsed,
        });
    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(502).json({ success: false, message: "Chat failed.", error: parseAiError(error) });
    }
};

export const generateOutreachHooks = async (req, res) => {
    try {
        const { leads } = req.body;

        if (!leads || !Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ success: false, message: "A non-empty array of leads is required." });
        }

        if (!GEMINI_API_KEY || !genAI) {
            return res.status(503).json({ success: false, message: "AI service is not configured." });
        }

        const prompt = `
      You are a Sales Personalization Expert. For the following list of B2B leads, generate a unique, highly personalized "Cold Outreach Hook" (max 2 sentences) for each lead. 
      The hook should mention something specific from their data (city, company name, or category) to make it feel human.

      Leads:
      ${JSON.stringify(leads.slice(0, 10))}

      Response MUST be a JSON array of objects, where each object has:
      - "leadId": (the index or ID of the lead)
      - "hook": "The personalized message"

      Only return the JSON.
    `;

        const { modelUsed, result } = await runWithFallbackModels((model) => model.generateContent(prompt));
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const hooks = JSON.parse(jsonString);

        res.json({
            success: true,
            hooks,
            modelUsed,
        });
    } catch (error) {
        console.error("AI Hooks Error:", error);
        res.status(502).json({ success: false, message: "Failed to generate hooks.", error: parseAiError(error) });
    }
};
