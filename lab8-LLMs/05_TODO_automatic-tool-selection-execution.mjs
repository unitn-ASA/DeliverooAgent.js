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
  console.log("---- CALCULATE ---");

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

// TODO 1:
// Create a reusable function called callModel(messages, options).
//
// Why?
// In the previous scripts, we called the model directly inside the chat loop.
// From now on, an agent may call the model multiple times for the same user request:
// - once to decide whether a tool is needed;
// - once again to produce the final answer after the tool result.
//
// The function should:
// - receive a messages array;
// - optionally receive a temperature value;
// - call client.chat.completions.create(...);
// - return only the generated text.
//
// Suggested signature:
//
// async function callModel(messages, { temperature = 0.1 } = {}) {
//   ...
// }

// ==========================================
// 5. Parse model action
// ==========================================

// TODO 2:
// Create a function called extractAction(text).
//
// Why?
// The model will not call JavaScript functions directly.
// It will output text such as:
//
// Action: calculate
// Action Input: 3 * 17
//
// The program must parse this text and convert it into a JavaScript object:
//
// {
//   action: "calculate",
//   actionInput: "3 * 17"
// }
//
// If the text does not contain an action, return null.
//
// Suggested signature:
//
// function extractAction(text) {
//   ...
// }

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
//
// Why?
// After the tool has been executed, the result is only an observation.
// We call the model again to transform that observation into a clear answer
// for the user.
//
// This prompt should tell the model that it receives:
// - the original user request;
// - the selected action;
// - the tool observation;
//
// and that it must write a clear final answer.

const FINAL_ANSWER_PROMPT = `
TODO: write the final-answer prompt here
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
  //
  // Why?
  // This is the first LLM call in the agentic loop.
  // The model should either:
  // - answer normally, if no tool is needed;
  // - output an Action and Action Input, if calculation is needed.
  //
  // 4.2: Store the result in a variable called assistantDecision and save it in the messages array.
  //
  // Hint:
  // const assistantDecision = "TODO"
  //   messages.push({
  //  TODO
  //});

  console.log(`Assistant decision:\n${assistantDecision}\n`);



  // TODO 6:
  // Parse the assistant decision using extractAction(...).
  //
  // Why?
  // If the model returned:
  //
  // Action: calculate
  // Action Input: 3 * 17
  //
  // the program must extract the tool name and input before it can execute anything.

  const parsedAction = null;

  // CASE A:
  // If no action was found, the model already answered directly.
  // In that case, print the assistantDecision and continue the chat loop.

  if (!parsedAction) {
    console.log(`Assistant: ${assistantDecision}\n`);
    console.log(`Memory contains ${messages.length} messages.\n`);
    continue;
  }

  // CASE B:
  // A tool was requested.
  // Extract action and actionInput from parsedAction.

  const { action, actionInput } = parsedAction;

  let observation;

  // TODO 7:
  // Execute the selected tool.
  //
  // Why?
  // The LLM only selected an action.
  // The JavaScript runtime is responsible for checking the action and calling
  // the correct function.
  //
  // If action === "calculate", call calculate(actionInput).
  // Otherwise, return an error such as:
  // Error: unknown tool '<tool name>'

  observation = "TODO";

  console.log(`[Observation: ${observation}]\n`);

  // 4. Add the observation to memory
  messages.push({
    role: "user",
    content: `Observation: ${observation}`,
  });

  // TODO 8:
  // Ask the model for the final answer.
  //
  // Why?
  // The raw tool observation is not necessarily a user-friendly answer.
  // We call the model again to produce a final response based on:
  // - the original user request;
  // - the model's action decision;
  // - the tool observation.
  //
  // Store the result in a variable called finalAnswer.
  //
  // Hint:
  // const finalAnswer = await callModel(
  //   [
  //     {
  //       role: "system",
  //       content: FINAL_ANSWER_PROMPT,
  //     },
  //     {
  //       role: "user",
  //       content:
  //         `Original user request:\n${userInput}\n\n` +
  //         `Assistant decision:\n${assistantDecision}\n\n` +
  //         `Tool observation:\n${observation}`,
  //     },
  //   ],
  //   { temperature: 0.1 }
  // );

  const finalAnswer = "TODO";

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
// Can you help me calculate the price if 3 tickets cost 17 euros each?
// What is an AI agent?
// How much is hello + 3?
// What is the weather in Rome?