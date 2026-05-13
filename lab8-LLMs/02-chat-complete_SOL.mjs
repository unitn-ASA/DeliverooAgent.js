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
// 3. Settings
// ==========================================

const USE_MEMORY = true;

// ==========================================
// 4. Conversation memory
// ==========================================

const messages = [
  {
    role: "system",
    content:
      "You are a concise teaching assistant. Answer clearly and briefly.",
  },
];

// ==========================================
// 5. Terminal chat loop
// ==========================================

const rl = readline.createInterface({ input, output });

console.log("Mini chat started.");
console.log("Commands:");
console.log("- /memory  show conversation memory");
console.log("- /reset   clear conversation memory");
console.log("- /exit    quit");
console.log();

while (true) {
  const userInput = await rl.question("You: ");
  const command = userInput.trim().toLowerCase();

  if (command === "/exit" || command === "exit") {
    break;
  }

  if (command === "/memory") {
    console.dir(messages, { depth: null });
    console.log();
    continue;
  }

  if (command === "/reset") {
    messages.splice(1);
    console.log("Conversation memory reset.\n");
    continue;
  }

  messages.push({
    role: "user",
    content: userInput,
  });

  const messagesForModel = USE_MEMORY
    ? messages
    : [
        messages[0],
        {
          role: "user",
          content: userInput,
        },
      ];

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: messagesForModel,
    temperature: 0.1,
  });

  const assistantMessage =
    response.choices?.[0]?.message?.content ?? "";

  console.log(`Assistant: ${assistantMessage}`);

  messages.push({
    role: "assistant",
    content: assistantMessage,
  });

  console.log(`Memory contains ${messages.length} messages.\n`);
}

rl.close();

console.log("\nChat ended.");