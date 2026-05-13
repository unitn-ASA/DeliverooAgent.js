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
// 3. Tool
// ==========================================

function calculate(expression) {
  console.log("---- CALCULATE ---")
  try {
    // Demo only: eval is unsafe for production
    return String(eval(expression));
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// ==========================================
// 4. Reusable LLM call
// ==========================================


//TODO 1: Create a reusable function called callModel(messages, options).
async function callModel(messages, { temperature = 0.1 } = {}) {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature,
  });

  return response.choices?.[0]?.message?.content ?? "";
}

// ==========================================
// 5. Parse model action
// ==========================================

// TODO 2:
// Create a function called extractAction(text).

function extractAction(text) {
  const actionMatch = text.match(/Action:\s*(.*)/);
  const actionInputMatch = text.match(/Action Input:\s*(.*)/);

  if (!actionMatch || !actionInputMatch) {
    return null;
  }

  return {
    action: actionMatch[1].trim(),
    actionInput: actionInputMatch[1].trim(),
  };
}

// ==========================================
// 6. Prompts
// ==========================================

const ACTION_PROMPT = `
You are an AI assistant.

Available tools:
- calculate(expression): evaluates a mathematical expression

If the user asks for something that requires calculation, do not compute it yourself.
Instead, respond exactly in this format:

Action: calculate
Action Input: <mathematical expression>

If no tool is needed, answer normally.
`.trim();
// TODO 3:
// Create FINAL_ANSWER_PROMPT.
const FINAL_ANSWER_PROMPT = `
You are an AI assistant.

You receive:
- the user's original request
- the action selected by the assistant, if any
- the observation returned by the tool, if any

Write a clear and concise final answer for the user.
If there was a tool error, explain it briefly.
Do not mention internal implementation details unless useful.
`.trim();

// ==========================================
// 7. Conversation memory
// ==========================================

const messages = [
  {
    role: "system",
    content: ACTION_PROMPT,
  },
];

// ==========================================
// 8. Terminal chat loop
// ==========================================

const rl = readline.createInterface({ input, output });

console.log("Mini agent with tool execution and final answer started.");
console.log("Commands:");
console.log("- /memory   show conversation memory");
console.log("- /reset    clear conversation memory");
console.log("- /exit     quit");
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

  // 1. Add the user's request to memory
  messages.push({
    role: "user",
    content: userInput,
  });

    // TODO 4:
  // 4.1: Ask the model whether it wants to answer directly or use a tool.
  const assistantDecision = await callModel(messages, { temperature: 0.1 });

  console.log(`Assistant decision:\n${assistantDecision}\n`);



  // 4.2: Store the result in a variable called assistantDecision and save it in the messages array.

  messages.push({
    role: "assistant",
    content: assistantDecision,
  });

    // TODO 6:
  // Parse the assistant decision using extractAction(...).
  const parsedAction = extractAction(assistantDecision);

  // CASE A: No tool requested. The model already answered.
  if (!parsedAction) {
    console.log(`Assistant: ${assistantDecision}\n`);
    console.log(`Memory contains ${messages.length} messages.\n`);
    continue;
  }

  // CASE B: Tool requested. Execute it.
  const { action, actionInput } = parsedAction;

  let observation;

    // TODO 7:
  // Execute the selected tool.
  if (action === "calculate") {
    console.log(`[System executing tool: ${action}("${actionInput}")]`);
    observation = calculate(actionInput);
  } else {
    observation = `Error: unknown tool '${action}'`;
  }

  console.log(`[Observation: ${observation}]\n`);

  // 4. Add the observation to memory
  messages.push({
    role: "user",
    content: `Observation: ${observation}`,
  });

  // 5. Ask the model for the final answer
  // TODO 8:
  // Ask the model for the final answer.
  const finalAnswer = await callModel(
    [
      {
        role: "system",
        content: FINAL_ANSWER_PROMPT,
      },
      {
        role: "user",
        content:
          `Original user request:\n${userInput}\n\n` +
          `Assistant decision:\n${assistantDecision}\n\n` +
          `Tool observation:\n${observation}`,
      },
    ],
    { temperature: 0.1 }
  );

  console.log(`Assistant: ${finalAnswer}\n`);

  // 6. Store final answer in the conversation memory
  messages.push({
    role: "assistant",
    content: finalAnswer,
  });

  console.log(`Memory contains ${messages.length} messages.\n`);
}

rl.close();

console.log("\nChat ended.");

// How much is hello + 3?
// What is the weather in Rome?
// Calculate 12 * 7 and then 5 + 3