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

function hasBothActionAndFinalAnswer(text) {
  return /^Action:\s*.+$/im.test(text) && /^Final Answer:\s*[\s\S]*$/im.test(text);
}

function countActions(text) {
  const matches = text.match(/^Action:\s*.+$/gim);
  return matches ? matches.length : 0;
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

STRICT OUTPUT FORMAT — choose exactly one format.

FORMAT 1 — use one tool:

Thought: <brief reasoning>
Action: <tool name>
Action Input: <tool input>

FORMAT 2 — final answer:

Thought: I have enough information to answer.
Final Answer: <clear final answer for the user>

Rules:
- Output exactly one action at a time.
- Never output two actions in the same message.
- Never output an Action and a Final Answer in the same message.
- Do not invent tool results.
- Do not calculate arithmetic yourself.
- Do not invent the current time.
- If the user asks for arithmetic, call calculate before answering.
- If the user asks for the current time in Rome/Roma, call get_current_time before answering.
- If the user asks for multiple things, solve one thing at a time.
- After receiving an Observation, check whether the original user request still has unresolved parts.
- Only give Final Answer when all required tool results have been observed.
- Use only the available tools.
`.trim();

// ==========================================
// 7. Conversation memory
// ==========================================

// Global memory stores only the visible conversation.
// It does not store internal actions and observations.
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
  const turnMessages = [
    {
      role: "system",
      content: AGENT_PROMPT,
    },
    ...messages.slice(1),
    {
      role: "user",
      content: userInput,
    },
  ];

  for (let i = 0; i < maxIterations; i++) {
    console.log(`--- Agent iteration ${i + 1} ---`);

    const assistantMessage = await callModel(turnMessages, { temperature: 0 });

    console.log(`Assistant output:\n${assistantMessage}\n`);

    turnMessages.push({
      role: "assistant",
      content: assistantMessage,
    });

    const actionCount = countActions(assistantMessage);
    const mixedOutput = hasBothActionAndFinalAnswer(assistantMessage);

    if (actionCount > 1) {
      console.log(
        `[Warning: model output contained ${actionCount} actions. ` +
          `The runtime will execute only the first one.]\n`
      );
    }

    if (mixedOutput) {
      console.log(
        "[Warning: model output contained both Action and Final Answer. " +
          "The runtime will execute the Action and ignore the premature Final Answer.]\n"
      );
    }

    // Defensive rule:
    // If an Action is present, execute it before accepting any Final Answer.
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

      turnMessages.push({
        role: "user",
        content:
          `Observation: ${observation}\n\n` +
          `Continue solving the original user request. ` +
          `If some requested information is still missing, choose the next Action. ` +
          `If all requested information has been observed, give the Final Answer. ` +
          `Remember: output only one Action or one Final Answer.`,
      });

      continue;
    }

    const finalAnswer = extractFinalAnswer(assistantMessage);

    if (finalAnswer) {
      console.log(`Assistant: ${finalAnswer}\n`);

      messages.push({
        role: "user",
        content: userInput,
      });

      messages.push({
        role: "assistant",
        content: finalAnswer,
      });

      return;
    }

    const observation =
      "Error: invalid format. You must output either one Action or one Final Answer.";

    console.log(`[Observation: ${observation}]\n`);

    turnMessages.push({
      role: "user",
      content: `Observation: ${observation}`,
    });
  }

  const fallbackAnswer =
    "I could not complete the request within the maximum number of iterations.";

  console.log(`Assistant: ${fallbackAnswer}\n`);

  messages.push({
    role: "user",
    content: userInput,
  });

  messages.push({
    role: "assistant",
    content: fallbackAnswer,
  });
}

// ==========================================
// 9. Terminal chat loop
// ==========================================

const rl = readline.createInterface({ input, output });

console.log("Mini agent 07C: defensive execution loop started.");
console.log("Commands:");
console.log("- /memory   show visible conversation memory");
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

  console.log(`Visible memory contains ${messages.length} messages.\n`);
}

rl.close();

console.log("\nChat ended.");


// Test examples:
// What time is it in Rome?
// What time is it in Paris?
// How much is 12 * 7?
// What time is it in Rome, and how much is 12 * 7?
// Explain what an AI agent is in one sentence.