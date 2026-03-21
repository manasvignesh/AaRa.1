import OpenAI from "openai";

const llmClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DEFAULT_MODEL = process.env.AI_INTEGRATIONS_OPENAI_MODEL || "qwen/qwen3.5-122b-a10b";

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (typeof part === "string") return part;
        if (part?.type === "text" && typeof part.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

export function isLlmConfigured() {
  return Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL);
}

export async function generateLlmText({
  system,
  prompt,
  temperature = 0.6,
  maxTokens = 4096,
}: {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const response = await llmClient.chat.completions.create({
    model: DEFAULT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  });

  const text = extractTextContent(response.choices[0]?.message?.content);
  if (!text) {
    throw new Error("LLM returned an empty response");
  }
  return text;
}

export async function generateLlmChat({
  system,
  conversationHistory,
  message,
  temperature = 0.6,
  maxTokens = 2048,
}: {
  system?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  message: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (system) messages.push({ role: "system", content: system });
  for (const item of conversationHistory || []) {
    if (item.role === "assistant") {
      messages.push({ role: "assistant", content: item.content });
    } else {
      messages.push({ role: "user", content: item.content });
    }
  }
  messages.push({ role: "user", content: message });

  const response = await llmClient.chat.completions.create({
    model: DEFAULT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  });

  const text = extractTextContent(response.choices[0]?.message?.content);
  if (!text) {
    throw new Error("LLM returned an empty chat response");
  }
  return text;
}
