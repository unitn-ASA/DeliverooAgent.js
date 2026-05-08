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
// 3. Tools
// ==========================================

function calculate(expression) {
  try {
    // Demo only: eval is unsafe for production
    return String(eval(expression));
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// New tool already provided.
function getCurrentTime(location) {
  try {
    const normalized = location.trim().toLowerCase();

    const supportedLocations = {
      rome: { city: "Rome", timeZone: "Europe/Rome" },
      roma: { city: "Rome", timeZone: "Europe/Rome" },
    };

    const config = supportedLocations[normalized];

    if (!config) {
      return `Error: Current time is only supported for Rome/Roma in this demo.`;
    }

    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: config.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

    const formattedDate = `${map.year}-${map.month}-${map.day}`;
    const formattedTime = `${map.hour}:${map.minute}:${map.second}`;

    return `The current local time in ${config.city} is ${formattedDate} ${formattedTime} (${config.timeZone}).`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// TODO 1:
// Create a tool registry.
//
// Why?
// Until now, the program had hardcoded logic such as:
//
// if (action === "calculate") {
//   observation = calculate(actionInput);
// }
//
// This works with one tool, but it does not scale.
// A tool registry maps the tool name produced by the model
// to the JavaScript function that should be executed.
//
// The registry should contain:
// - calculate
// - get_current_time, mapped to getCurrentTime
//
// Expected structure:
//
// const TOOLS = {
//   calculate,
//   get_current_time: getCurrentTime,
// };

const TOOLS = {
  // TODO: add tools here
};

// ==========================================
// 4. Reusable LLM call
// ==========================================

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

// TODO 2:
// Update the prompt so that the model knows about BOTH available tools.
//
// Why?
// Registering a tool in JavaScript is not enough.
// The model does not inspect the TOOLS object.
// It only knows the tools that we describe in the prompt.


const ACTION_PROMPT = `
YOUR PROMPT
`.trim();

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

console.log("Mini agent with tool registry started.");
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

  // 2. Ask the model whether it wants to answer or use a tool
  const assistantDecision = await callModel(messages, { temperature: 0.1 });

  console.log(`Assistant decision:\n${assistantDecision}\n`);

  messages.push({
    role: "assistant",
    content: assistantDecision,
  });

  // 3. Try to parse an action from the model output
  const parsedAction = extractAction(assistantDecision);

  // CASE A: No tool requested. The model already answered.
  if (!parsedAction) {
    console.log(`Assistant: ${assistantDecision}\n`);
    console.log(`Memory contains ${messages.length} messages.\n`);
    continue;
  }

  // CASE B: Tool requested.
  const { action, actionInput } = parsedAction;

  let observation;

  // TODO 3:
  // Execute the selected tool through the tool registry.
  //
  // Why?
  // The model outputs a tool name as text:
  //
  // Action: get_current_time
  // Action Input: Rome
  //
  // The program must check whether that tool exists in TOOLS.
  // If it exists, call it with the action input.
  // If it does not exist, return an error message.
  //
  // Expected behavior:
  //
  // if (TOOLS[action]) {
  //   console.log(`[System executing tool: ${action}("${actionInput}")]`);
  //   observation = await TOOLS[action](actionInput);
  // } else {
  //   observation = `Error: unknown tool '${action}'. Available tools: ${Object.keys(TOOLS).join(", ")}`;
  // }

  observation = "TODO: execute the selected tool through TOOLS";

  console.log(`[Observation: ${observation}]\n`);

  // 4. Add the observation to memory
  messages.push({
    role: "user",
    content: `Observation: ${observation}`,
  });

  // 5. Ask the model for the final answer
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


// Test examples:
// How much is 12 * 7?
// What time is it in Rome?
// What time is it in Roma?
// What time is it in Paris?
// What is an AI agent?