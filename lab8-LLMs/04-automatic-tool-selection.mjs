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
// 3. First deterministic tool
// ==========================================

function calculate(expression) {
  try {
    // Demo only: eval is unsafe for production
    return String(eval(expression));
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// ==========================================
// 4. Conversation memory
// ==========================================

const messages = [
  {
    role: "system",
    content: `
You are an AI assistant.

Available tools:
- calculate(expression): evaluates a mathematical expression

If the user asks for something that requires calculation, do not compute it yourself.
Instead, respond exactly in this format:

Action: calculate
Action Input: <mathematical expression>

If no tool is needed, answer normally.
`.trim(),
  },
]; 


/*
const messages = [
  {
    role: "system",
    content: `
You can use a calculator when needed.
`.trim(),
  },
];
*/

// ==========================================
// 5. Terminal chat loop
// ==========================================

const rl = readline.createInterface({ input, output });

console.log("Mini chat with one manual tool started.");
console.log("Commands:");
console.log("- /calc <expression>   run the calculator tool");
console.log("- /memory              show conversation memory");
console.log("- /reset               clear conversation memory");
console.log("- /exit                quit");
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

  if (userInput.trim() === "") {
    continue;
  }

  if (command.startsWith("/calc ")) {
    const expression = userInput.slice("/calc ".length).trim();
    const result = calculate(expression);

    console.log(`Tool result: ${result}\n`);

    messages.push({
      role: "user",
      content: `Tool observation: calculate(${expression}) = ${result}`,
    });

    continue;
  }

  messages.push({
    role: "user",
    content: userInput,
  });

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.1,
  });

  const assistantMessage = response.choices?.[0]?.message?.content ?? "";

  console.log(`Assistant: ${assistantMessage}`);
  console.log(`Memory contains ${messages.length} messages.\n`);

  messages.push({
    role: "assistant",
    content: assistantMessage,
  });
}

rl.close();

console.log("\nChat ended.");


// Can you help me calculate the price if 3 tickets cost 17 euros each?