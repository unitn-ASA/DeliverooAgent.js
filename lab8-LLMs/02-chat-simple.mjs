import "dotenv/config";
import OpenAI from "openai";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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
// 3. Conversation memory
// ==========================================

const messages = [
  {
    role: "system",
    content:
      "You are a concise teaching assistant. Answer clearly and briefly.",
  },
];

// ==========================================
// 4. Terminal chat loop
// ==========================================

const rl = readline.createInterface({ input, output });

console.log("Mini chat started.");
console.log("Type your message and press Enter.");
console.log("Type 'exit' to quit.\n");

while (true) {
  const userInput = await rl.question("You: ");

  if (userInput.trim().toLowerCase() === "exit") {
    break;
  }

  if (userInput.trim() === "") {
    continue;
  }

  // Add the user's message to the conversation history
  messages.push({
    role: "user",
    content: userInput,
  });

  // Send the full conversation history to the model
  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.1,
  });

  const assistantMessage =
    response.choices?.[0]?.message?.content ?? "";

  console.log(`Assistant: ${assistantMessage}\n`);

  // Add the assistant's answer to the conversation history
  messages.push({
    role: "assistant",
    content: assistantMessage,
  });
}

rl.close();

console.log("\nChat ended.");