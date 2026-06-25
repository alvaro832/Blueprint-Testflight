/**
 * Pre-send wrapper for the OpenAI SDK: optimizes the last user message BEFORE it's sent,
 * so you pay for fewer input tokens automatically. Drop this in and call optimizedChat().
 *
 *   npm i openai
 *   node examples/openai-wrapper.mjs
 */
import OpenAI from "openai";
import { optimize } from "../blueprint.mjs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function optimizedChat(messages, { model = "gpt-4o", level = "balanced" } = {}) {
  // optimize only the final user turn; leave system/assistant context intact
  const out = messages.map((m, i) => {
    if (m.role === "user" && i === messages.length - 1) {
      const r = optimize(m.content, { modelId: model, level });
      console.error(`[blueprint] -${r.compressionPct}% tokens on last user message`);
      return { ...m, content: r.optimized };
    }
    return m;
  });
  return client.chat.completions.create({ model, messages: out });
}

// demo
if (import.meta.url === `file://${process.argv[1]}`) {
  const res = await optimizedChat(
    [{ role: "user", content: "I would like you to please very carefully explain what an API is. Thank you!" }],
    { model: "gpt-4o-mini" }
  );
  console.log(res.choices[0].message.content);
}
