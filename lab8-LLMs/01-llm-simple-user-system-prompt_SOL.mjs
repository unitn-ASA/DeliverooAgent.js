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
      role: "system",
      content: "You are a useful teaching assistant. Answer the users questions with at most 20 words.",
      // content: "reply 'cat' regardless of the user's question",
      // content: "If the user asks you something unrelated to the topic of agentic, reply 'I can not answer'",
      // content: "Return only valid CSV. No markdown, no explanation.",
    },
    {
      role: "user",
      // content: "Explain the defference between an LLM and an LLM-based agentic AI system.",
      // content: "How is the weather in Trento today?",
      // content: "Give me 5 creative names for a robot that delivers parcels."
      // content: "Describe an AI agent with fields: name, goal, tools.",
      content: "What is 377834873478 * 974829994?" //368324767445549500000
    },
  ],
  temperature: 0.1, //Temperature measures the "LLM creativity". Set to zero if you want determinism, a higher number otherwise.
});

console.log(response.choices[0].message.content);