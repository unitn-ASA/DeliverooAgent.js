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
  console.log("---- CALCULATE ----");

  try {
    // Demo only: eval is unsafe for production
    return String(eval(expression));
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

function getCurrentTime(location) {
  console.log("---- GET CURRENT TIME ----");

  try {
    const normalized = location.trim().toLowerCase();

    const supportedLocations = {
      rome: { city: "Rome", timeZone: "Europe/Rome" },
      roma: { city: "Rome", timeZone: "Europe/Rome" },
    };

    const config = supportedLocations[normalized];

    if (!config) {
      return "Error: Current time is only supported for Rome/Roma in this demo.";
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

const TOOLS = {
  calculate,
  get_current_time: getCurrentTime,
};

// ==========================================
// 4. Reusable LLM call
// ==========================================

async function callModel(messages, { temperature = 0 } = {}) {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature,
  });

  return response.choices?.[0]?.message?.content ?? "";
}

// ==========================================
// 5. Output parsing
// ==========================================

function extractAction(text) {
  const actionMatch = text.match(/^Action:\s*(.+)$/im);
  const actionInputMatch = text.match(/^Action Input:\s*(.+)$/im);

  if (!actionMatch || !actionInputMatch) {
    return null;
  }

  return {
    action: actionMatch[1].trim(),
    actionInput: actionInputMatch[1].trim(),
  };
}

function extractFinalAnswer(text) {
  const match = text.match(/^Final Answer:\s*([\s\S]*)$/im);

  if (!match) {
    return null;
  }

  return match[1].trim();
}

// ==========================================
// 6. Prompt
// ==========================================

const AGENT_PROMPT = `
You are an AI agent.

Available tools:
- calculate(expression): evaluates a mathematical expression
- get_current_time(location): returns the current local time for Rome/Roma

You solve the user's request step by step.

STRICT OUTPUT FORMAT — choose exactly one:

If you need to use a tool, output ONLY:

Thought: <brief reasoning>
Action: <tool name>
Action Input: <tool input>

If you have enough information to answer the user, output ONLY:

Thought: I have enough information to answer.
Final Answer: <clear final answer for the user>

Rules:
- Use only the available tools.
- Output one action at a time.
- Never write Action: None.
- Do not invent tool results.
- Do not calculate arithmetic yourself.
- Do not invent the current time.
- If the user asks for arithmetic, use calculate before answering.
- If the user asks for the current time in Rome/Roma, use get_current_time before answering.
- If part of the user request can be answered directly, keep that information in mind.
- Use tools only for parts of the request that require an available tool.
- If no tool is needed at all, use Final Answer.
- If some information is known and some information requires a tool, call the needed tool first, then include both parts in the Final Answer.
- If the user asks for multiple things, solve one thing at a time.
- After each Observation, decide whether another tool is needed or whether you can answer.
`.trim();

// ==========================================
// 7. Conversation memory
// ==========================================

const messages = [
  {
    role: "system",
    content: AGENT_PROMPT,
  },
];

// ==========================================
// 8. Agent loop for one user request
// ==========================================

async function runAgentTurn(userInput, maxIterations = 6) {
  messages.push({
    role: "user",
    content: userInput,
  });

  for (let i = 0; i < maxIterations; i++) {
    console.log(`--- Agent iteration ${i + 1} ---`);

    const assistantMessage = await callModel(messages, { temperature: 0 });

    console.log(`Assistant output:\n${assistantMessage}\n`);

    messages.push({
      role: "assistant",
      content: assistantMessage,
    });

    const parsedAction = extractAction(assistantMessage);

    if (parsedAction) {
      const { action, actionInput } = parsedAction;

      let observation;

      if (TOOLS[action]) {
        console.log(`[System executing tool: ${action}("${actionInput}")]`);
        observation = await TOOLS[action](actionInput);
      } else {
        observation =
          `Error: unknown tool '${action}'. ` +
          `Available tools: ${Object.keys(TOOLS).join(", ")}`;
      }

      console.log(`[Observation: ${observation}]\n`);

      messages.push({
        role: "user",
        content: `Observation: ${observation}`,
      });

      continue;
    }

    const finalAnswer = extractFinalAnswer(assistantMessage);

    if (finalAnswer) {
      console.log(`Assistant: ${finalAnswer}\n`);
      return;
    }

    const observation =
      "Error: invalid format. You must output either one Action or one Final Answer.";

    console.log(`[Observation: ${observation}]\n`);

    messages.push({
      role: "user",
      content: `Observation: ${observation}`,
    });
  }

  console.log(
    "Assistant: I could not complete the request within the maximum number of iterations.\n"
  );
}

// ==========================================
// 9. Terminal chat loop
// ==========================================

const rl = readline.createInterface({ input, output });

console.log("Mini agent 07A: basic execution loop started.");
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

  await runAgentTurn(userInput);

  console.log(`Memory contains ${messages.length} messages.\n`);
}

rl.close();

console.log("\nChat ended.");


// Test examples:
// What time is it in Rome?
// How much is 12 * 7?
// 