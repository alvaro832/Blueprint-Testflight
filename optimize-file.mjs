/**
 * Pre-send wrapper for the Anthropic SDK: optimizes the last user message before sending.
 *   npm i @anthropic-ai/sdk
 */
import Anthropic from "@anthropic-ai/sdk";
import { optimize } from "../blueprint.mjs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function optimizedMessage(messages, { model = "claude-sonnet", level = "balanced", max_tokens = 1024 } = {}) {
  const out = messages.map((m, i) => {
    if (m.role === "user" && i === messages.length - 1 && typeof m.content === "string") {
      const r = optimize(m.content, { modelId: model, level });
      console.error(`[blueprint] -${r.compressionPct}% tokens on last user message`);
      return { ...m, content: r.optimized };
    }
    return m;
  });
  // map our internal id to a real Anthropic model name as needed
  const apiModel = model.startsWith("claude") ? "claude-3-5-sonnet-latest" : model;
  return client.messages.create({ model: apiModel, max_tokens, messages: out });
}
