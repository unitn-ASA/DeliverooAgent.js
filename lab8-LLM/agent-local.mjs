import "dotenv/config";
import OpenAI from "openai";
import { search } from "duck-duck-scrape";
import { DjsConnect } from "@unitn-asa/deliveroo-js-sdk/client";

// ==========================================
// 0. Deliveroojs
// ==========================================

const socket = DjsConnect(process.env.DELIVEROOJS_URL, process.env.DELIVEROOJS_TOKEN);
const me = {x: 0, y: 0, score: 0};
await socket.onYou( you => {
  me.x = you.x;
  me.y = you.y;
  me.score = you.score;
} );

// ==========================================
// 1. LiteLLM Configuration (UniTN proxy)
// ==========================================

const baseURL = process.env.LITELLM_BASE_URL || "https://llm.bears.disi.unitn.it/v1";
const apiKey = process.env.LITELLM_API_KEY;
const MODEL = process.env.LOCAL_MODEL || "llama-3.3-70b-lmstudio";

if (!apiKey) {
  console.error("Error: missing LITELLM_API_KEY in .env file");
  process.exit(1);
}

// ==========================================
// 2. Tools
// ==========================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {'up'||'down'||'right'||'left'} direction 
 * @returns {Promise<string>} String with new coordinates or error message
 */
async function getMyPosition() {
  return JSON.stringify( {x: me.x, y: me.y} );
}

/**
 * @param {'up'||'down'||'right'||'left'} direction 
 * @returns {Promise<string>} String with new coordinates or error message
 */
async function move(direction) {
  try {
    let result = await socket.emitMove( direction );
    if ( result ) {
      return `Successfully moved to ${JSON.stringify(result)}.`;
    } else {
      return `Error moving ${direction}: Failed to move.`;
    }
  } catch (error) {
    return `Error moving ${direction}: ${error.message}`;
  }
}

async function webSearch(query) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await search(query, { safeSearch: 0 });
      const results = response?.results?.slice(0, 3) || [];

      if (results.length === 0) {
        return "Error: No results found.";
      }

      const formattedResults = results.map((res, index) => {
        const title = res.title || "No Title";
        const snippet = res.description || "No snippet available.";
        return `Result ${index + 1} [${title}]: ${snippet}`;
      });

      return formattedResults.join("\n");
    } catch (error) {
      if (attempt < 2) {
        await sleep(1500);
        continue;
      }
      return `Error during web search: ${error.message}`;
    }
  }
}

function calculate(expression) {
  try {
    // Demo only: eval is unsafe for production
    return String(eval(expression));
  } catch (error) {
    return `Error computing ${expression}: ${error.message}`;
  }
}

async function getWeather(location) {
  try {
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&format=json`;

    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      return `Error: Could not find coordinates for '${location}'.`;
    }

    const lat = geoData.results[0].latitude;
    const lon = geoData.results[0].longitude;
    const name = geoData.results[0].name;

    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (!weatherData.current_weather) {
      return `Error: Could not retrieve weather data for ${name}.`;
    }

    const temp = weatherData.current_weather.temperature;
    return `The current temperature in ${name} is ${temp}°C.`;
  } catch (error) {
    return `Error fetching weather: ${error.message}`;
  }
}

function getCurrentTime(location) {
  try {
    const normalized = location.trim().toLowerCase();

    const supportedLocations = {
      "rome": { city: "Rome", timeZone: "Europe/Rome" },
      "roma": { city: "Rome", timeZone: "Europe/Rome" },
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
    return `Error getting current time: ${error.message}`;
  }
}

const TOOLS = {
  calculate,
  get_weather: getWeather,
  web_search: webSearch,
  get_current_time: getCurrentTime,
  move: move,
  get_my_position: getMyPosition
};

// ==========================================
// 3. Prompts
// ==========================================
const PLANNER_PROMPT = `
You are a planning module inside an AI agent.

Your job is to break the user's request into a short sequence of concrete steps.

Available tools:
- calculate(expression)
- get_weather(location)
- web_search(query)
- get_current_time(location)
- move(direction)
- get_my_position()

Rules:
- Return ONLY valid JSON — no markdown, no explanation, nothing else
- Keep the plan short: 2 to 5 steps
- Each step must be clear and executable
- If the task needs current local time in Rome, include a step that calls get_current_time

Return exactly this JSON shape:
{
  "steps": [
    "step 1",
    "step 2"
  ]
}
`.trim();

const EXECUTOR_PROMPT = `
You are an executor module inside an AI agent. You execute ONE step at a time.

Available tools:
- calculate(expression): evaluates a math expression
- get_weather(location): returns current temperature
- web_search(query): searches the internet
- get_current_time(location): returns current local time for Rome/Roma only
- move(direction): moves the agent in the specified direction (up/down/left/right, where up increases y by 1, down decreases y by 1, left decreases x by 1, right increases x by 1). One direction at a time!
- get_my_position(): returns the current coordinates of the agent

STRICT OUTPUT FORMAT — choose exactly one:

If you need to call a tool, output ONLY these three lines:
Thought: <brief reasoning>
Action: <tool name>
Action Input: <tool input>

If the step is complete (tool result obtained or no tool needed), output ONLY these two lines:
Thought: I completed this step.
Step Result: <result for this step>

Do NOT mix formats. Do NOT add extra text.
`.trim();

const FINAL_ANSWER_PROMPT = `
You are the final response module of an AI agent.

You receive:
- The original user request
- The plan that was executed
- The result of each step

Write a clear, concise final answer for the user.
If any fact could not be verified, say so explicitly.
`.trim();

// ==========================================
// 4. Helper functions
// ==========================================
function extractAction(text) {
  const actionMatch = text.match(/Action:\s*(.*)/);
  const actionInputMatch = text.match(/Action Input:\s*(.*)/);

  if (!actionMatch || !actionInputMatch) return null;

  return {
    action: actionMatch[1].trim(),
    actionInput: actionInputMatch[1].trim(),
  };
}

function extractStepResult(text) {
  const match = text.match(/Step Result:\s*([\s\S]*)/);
  return match ? match[1].trim() : null;
}

function isErrorObservation(observation) {
  if (!observation) return true;
  return observation.startsWith("Error:");
}

function safeJsonParse(text) {
  // Strip markdown fences that some models add even when told not to
  const cleaned = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ==========================================
// 5. Planned Agent
// ==========================================
class PlannedAgent {
  constructor({ baseURL, apiKey, model }) {
    this.model = model;

    this.client = new OpenAI({
      baseURL,
      apiKey,
    });
  }

  async callModel(messages, { temperature = 0.1 } = {}) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature,
    });

    return response.choices?.[0]?.message?.content ?? "";
  }

  async createPlan(userQuery) {
    const messages = [
      { role: "system", content: PLANNER_PROMPT },
      { role: "user", content: userQuery },
    ];

    const rawPlan = await this.callModel(messages, { temperature: 0 });

    console.log("=== PLAN RAW OUTPUT ===");
    console.log(rawPlan);
    console.log();

    const parsed = safeJsonParse(rawPlan);

    if (!parsed || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      console.warn("Warning: planner returned invalid JSON, using fallback plan.");
      return { steps: [`Answer the user's request directly: ${userQuery}`] };
    }

    return parsed;
  }

  async executeStep(step, context, maxStepIterations = 4) {
    const memory = [
      { role: "system", content: EXECUTOR_PROMPT },
      {
        role: "user",
        content:
          `Original user request: ${context.userQuery}\n\n` +
          `Full plan:\n${context.plan.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
          `Completed step results so far:\n${
            context.completedResults.length > 0
              ? context.completedResults.map((r, i) => `${i + 1}. ${r}`).join("\n")
              : "None"
          }\n\n` +
          `Current step to execute:\n${step}`,
      },
    ];

    console.log("=== EXECUTING STEP ===");
    console.log(step);
    console.log();

    for (let i = 0; i < maxStepIterations; i++) {
      const aiMessage = await this.callModel(memory, { temperature: 0.1 });

      console.log(`--- Step iteration ${i + 1} ---`);
      console.log(aiMessage);
      console.log();

      memory.push({ role: "assistant", content: aiMessage });

      const stepResult = extractStepResult(aiMessage);
      if (stepResult) {
        return { success: true, result: stepResult };
      }

      const parsedAction = extractAction(aiMessage);

      if (!parsedAction) {
        memory.push({
          role: "user",
          content:
            "Error: invalid format. You must use EXACTLY the format:\n" +
            "Thought: ...\nAction: ...\nAction Input: ...\n\n" +
            "OR:\n\nThought: I completed this step.\nStep Result: ...",
        });
        continue;
      }

      const { action, actionInput } = parsedAction;

      let observation;
      if (TOOLS[action]) {
        console.log(`[System executing tool: ${action}("${actionInput}")]`);
        observation = await TOOLS[action](actionInput);
      } else {
        observation = `Error: Tool '${action}' not found. Valid tools: ${Object.keys(TOOLS).join(", ")}`;
      }

      console.log(`[Observation: ${observation}]`);
      console.log();

      if (isErrorObservation(observation)) {
        memory.push({
          role: "user",
          content:
            `Observation: ${observation}\n` +
            `The tool failed. Do not invent facts. ` +
            `Retry with a better input if appropriate, otherwise write:\n` +
            `Thought: I completed this step.\nStep Result: Could not verify — <reason>`,
        });
      } else {
        memory.push({ role: "user", content: `Observation: ${observation}` });
      }
    }

    return {
      success: false,
      result: `Step could not be completed: ${step}`,
    };
  }

  async buildFinalAnswer(userQuery, plan, completedResults) {
    const messages = [
      { role: "system", content: FINAL_ANSWER_PROMPT },
      {
        role: "user",
        content:
          `Original user request:\n${userQuery}\n\n` +
          `Plan:\n${plan.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
          `Step results:\n${completedResults.map((r, i) => `${i + 1}. ${r}`).join("\n")}`,
      },
    ];

    return await this.callModel(messages, { temperature: 0.3 });
  }

  async run(userQuery) {
    console.log(`User: ${userQuery}\n`);

    const plan = await this.createPlan(userQuery);

    console.log("=== PLAN ===");
    plan.steps.forEach((step, index) => console.log(`${index + 1}. ${step}`));
    console.log();

    const completedResults = [];

    for (const step of plan.steps) {
      const execution = await this.executeStep(step, {
        userQuery,
        plan,
        completedResults,
      });
      completedResults.push(execution.result);
    }

    console.log("=== STEP RESULTS ===");
    completedResults.forEach((result, index) => console.log(`${index + 1}. ${result}`));
    console.log();

    const finalAnswer = await this.buildFinalAnswer(userQuery, plan, completedResults);

    console.log("=== FINAL ANSWER ===");
    console.log(finalAnswer);
    console.log();
  }
}

// ==========================================
// 6. Execution
// ==========================================
const agent = new PlannedAgent({ baseURL, apiKey, model: MODEL });

await agent.run(
  // "Subtract 1000 from the current time in Rome, and add today's temperature in Verona."
  // "Move the agent up and then right."
  "Where are you? From here, move the agent to x+2 and y+1, then tell me your new coordinates."
);
