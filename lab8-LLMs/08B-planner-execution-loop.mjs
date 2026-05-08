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

function extractStepResult(text) {
  const match = text.match(/^Step Result:\s*([\s\S]*)$/im);

  if (!match) {
    return null;
  }

  return match[1].trim();
}

function countActions(text) {
  const matches = text.match(/^Action:\s*.+$/gim);
  return matches ? matches.length : 0;
}

function hasBothActionAndStepResult(text) {
  const actionMatch = text.match(/^Action:\s*(.+)$/im);
  const stepResultMatch = text.match(/^Step Result:\s*[\s\S]*$/im);

  if (!actionMatch || !stepResultMatch) {
    return false;
  }

  const action = actionMatch[1].trim().toLowerCase();

  return action !== "none";
}

function safeJsonParse(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ==========================================
// 6. Prompts
// ==========================================

const PLANNER_PROMPT = `
You are a planning module inside an AI agent.

Your job is to break the user's request into a short sequence of concrete steps.

Available tools:
- calculate(expression): evaluates a mathematical expression
- get_current_time(location): returns the current local time for Rome/Roma

Rules:
- Return ONLY valid JSON.
- Do not use markdown.
- Do not explain.
- Keep the plan short: 1 to 5 steps.
- Each step must be concrete and executable.
- If the user asks for the current time in Rome/Roma, include a step that uses get_current_time.
- If the user asks for arithmetic, include a step that uses calculate.

Return exactly this JSON shape:

{
  "steps": [
    "step 1",
    "step 2"
  ]
}
`.trim();

const EXECUTOR_PROMPT = `
You are an executor module inside an AI agent.

You execute exactly ONE step at a time.

Available tools:
- calculate(expression): evaluates a mathematical expression
- get_current_time(location): returns the current local time for Rome/Roma

You receive:
- the original user request
- the full plan
- completed step results so far
- the current step to execute

STRICT OUTPUT FORMAT — choose exactly one format.

FORMAT 1 — use one tool:

Thought: <brief reasoning>
Action: <tool name>
Action Input: <tool input>

FORMAT 2 — step complete:

Thought: I completed this step.
Step Result: <result for this step>

Rules:
- Execute only the current step.
- Do not execute future steps.
- Output exactly one action at a time.
- Never output two actions in the same message.
- Never output an Action and a Step Result in the same message.
- Never write Action: None.
- Do not invent tool results.
- Do not calculate arithmetic yourself.
- Do not invent the current time.
- If the current step requires arithmetic, call calculate.
- If the current step requires the current time in Rome/Roma, call get_current_time.
- If the current step does not require a tool, do not output Action.
- If the current step can be completed using previous step results, return Step Result directly.
- After receiving an Observation, return a Step Result.
- Use only the available tools.
`.trim();

const FINAL_ANSWER_PROMPT = `
You are the final response module of an AI agent.

You receive:
- the original user request
- the plan that was executed
- the result of each step

Write a clear, concise final answer for the user.
If any step failed or could not be verified, say so explicitly.
`.trim();

// ==========================================
// 7. Conversation memory
// ==========================================

// Global memory stores only the visible conversation.
// It does not store internal actions, observations, or plans.
const messages = [
  {
    role: "system",
    content: "You are a concise assistant.",
  },
];

// ==========================================
// 8. Planner
// ==========================================

async function createPlan(userInput) {
  const plannerMessages = [
    {
      role: "system",
      content: PLANNER_PROMPT,
    },
    {
      role: "user",
      content: userInput,
    },
  ];

  const rawPlan = await callModel(plannerMessages, { temperature: 0 });

  console.log("=== PLAN RAW OUTPUT ===");
  console.log(rawPlan);
  console.log();

  const parsedPlan = safeJsonParse(rawPlan);

  if (
    !parsedPlan ||
    !Array.isArray(parsedPlan.steps) ||
    parsedPlan.steps.length === 0
  ) {
    console.log("Warning: planner returned invalid JSON. Using fallback plan.\n");

    return {
      steps: [`Answer the user's request: ${userInput}`],
    };
  }

  return parsedPlan;
}

// ==========================================
// 9. Step executor
// ==========================================

async function executeStep(step, context, maxStepIterations = 4) {
  const stepMessages = [
    {
      role: "system",
      content: EXECUTOR_PROMPT,
    },
    {
      role: "user",
      content:
        `Original user request:\n${context.userInput}\n\n` +
        `Full plan:\n${context.plan.steps
          .map((s, index) => `${index + 1}. ${s}`)
          .join("\n")}\n\n` +
        `Completed step results so far:\n${
          context.completedResults.length > 0
            ? context.completedResults
                .map((result, index) => `${index + 1}. ${result}`)
                .join("\n")
            : "None"
        }\n\n` +
        `Current step to execute:\n${step}`,
    },
  ];

  console.log("=== EXECUTING STEP ===");
  console.log(step);
  console.log();

  for (let i = 0; i < maxStepIterations; i++) {
    console.log(`--- Step iteration ${i + 1} ---`);

    const assistantMessage = await callModel(stepMessages, { temperature: 0 });

    console.log(`Assistant output:\n${assistantMessage}\n`);

    stepMessages.push({
      role: "assistant",
      content: assistantMessage,
    });

    const actionCount = countActions(assistantMessage);
    const mixedOutput = hasBothActionAndStepResult(assistantMessage);

    if (actionCount > 1) {
      console.log(
        `[Warning: model output contained ${actionCount} actions. ` +
          `The runtime will execute only the first one.]\n`
      );
    }

    if (mixedOutput) {
      console.log(
        "[Warning: model output contained both Action and Step Result. " +
          "The runtime will execute the Action and ignore the premature Step Result.]\n"
      );
    }

    // Defensive rule:
    // If an Action is present, execute it before accepting any Step Result.
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

      stepMessages.push({
        role: "user",
        content:
          `Observation: ${observation}\n\n` +
          `Now complete the current step. ` +
          `Return a Step Result. Do not execute future steps. ` +
          `Remember: output only one Action or one Step Result.`,
      });

      continue;
    }

    const stepResult = extractStepResult(assistantMessage);

    if (stepResult) {
      return {
        success: true,
        result: stepResult,
      };
    }

    const observation =
      "Error: invalid format. You must output either one Action or one Step Result.";

    console.log(`[Observation: ${observation}]\n`);

    stepMessages.push({
      role: "user",
      content: `Observation: ${observation}`,
    });
  }

  return {
    success: false,
    result: `Step could not be completed: ${step}`,
  };
}

// ==========================================
// 10. Final answer builder
// ==========================================

async function buildFinalAnswer(userInput, plan, completedResults) {
  const finalMessages = [
    {
      role: "system",
      content: FINAL_ANSWER_PROMPT,
    },
    {
      role: "user",
      content:
        `Original user request:\n${userInput}\n\n` +
        `Executed plan:\n${plan.steps
          .map((step, index) => `${index + 1}. ${step}`)
          .join("\n")}\n\n` +
        `Step results:\n${completedResults
          .map((result, index) => `${index + 1}. ${result}`)
          .join("\n")}`,
    },
  ];

  return await callModel(finalMessages, { temperature: 0.1 });
}

// ==========================================
// 11. Agent turn
// ==========================================

async function runAgentTurn(userInput) {
  // 1. Create a plan
  const plan = await createPlan(userInput);

  console.log("=== PLAN ===");
  plan.steps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
  console.log();

  // 2. Execute each planned step explicitly
  const completedResults = [];

  for (const step of plan.steps) {
    const execution = await executeStep(step, {
      userInput,
      plan,
      completedResults,
    });

    completedResults.push(execution.result);
  }

  console.log("=== STEP RESULTS ===");
  completedResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result}`);
  });
  console.log();

  // 3. Build final answer from all step results
  const finalAnswer = await buildFinalAnswer(userInput, plan, completedResults);

  console.log(`Assistant: ${finalAnswer}\n`);

  // 4. Store only visible conversation
  messages.push({
    role: "user",
    content: userInput,
  });

  messages.push({
    role: "assistant",
    content: finalAnswer,
  });
}

// ==========================================
// 12. Terminal chat loop
// ==========================================

const rl = readline.createInterface({ input, output });

console.log("Mini agent 09: planner + step executor started.");
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
// How much is 12 * 7?
// What time is it in Rome, and how much is 12 * 7?
// First tell me the current time in Rome, then calculate 12 * 7, then summarize what you did.