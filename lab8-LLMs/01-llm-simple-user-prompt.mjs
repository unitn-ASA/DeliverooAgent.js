import "dotenv/config";
import OpenAI from "openai";

// ==========================================
// 1. LiteLLM Configuration
// ==========================================

const baseURL = process.env.LITELLM_BASE_URL || "https://llm.bears.disi.unitn.it/v1";
const apiKey = process.env.LITELLM_API_KEY;
const MODEL = process.env.LOCAL_MODEL || "llama-3.3-70b-lmstudio";

if (!apiKey) {
  console.error("Error: missing LITELLM_API_KEY in .env file");
  process.exit(1);
}

// ==========================================
// 2. OpenAI-compatible client
// ==========================================

const client = new OpenAI({
  baseURL,
  apiKey,
});

// ==========================================
// 3. First LLM call
// ==========================================

const response = await client.chat.completions.create({
  model: MODEL,
  messages: [
    {
      role: "user",
      content: "Explain the defference between an LLM and an LLM-based agentic AI system in one sentence.",
    },
  ],
  temperature: 0.1,
});

console.log(response.choices[0].message.content);