/**
 * Optional live-API layer. The optimizer works fully offline; this is only used when the
 * user has connected a provider and wants real model-powered rewrites or exact token counts.
 *
 * Robustness: every request has a timeout, one retry on transient failure, and typed errors.
 * Keys are read on demand from secure storage and never logged.
 */

import { readApiKey } from "./bridge";

export interface ProviderDef {
  id: string;
  label: string;
  /** label only — actual endpoints are called from the native side in production */
  docsHint: string;
  keyPlaceholder: string;
}

export const PROVIDERS: ProviderDef[] = [
  { id: "openai", label: "OpenAI", docsHint: "platform.openai.com", keyPlaceholder: "sk-..." },
  { id: "anthropic", label: "Anthropic (Claude)", docsHint: "console.anthropic.com", keyPlaceholder: "sk-ant-..." },
  { id: "google", label: "Google (Gemini)", docsHint: "aistudio.google.com", keyPlaceholder: "AIza..." },
  { id: "xai", label: "xAI (Grok)", docsHint: "x.ai", keyPlaceholder: "xai-..." },
  { id: "deepseek", label: "DeepSeek", docsHint: "platform.deepseek.com", keyPlaceholder: "sk-..." },
  { id: "mistral", label: "Mistral", docsHint: "console.mistral.ai", keyPlaceholder: "..." },
  { id: "meta", label: "Llama (host)", docsHint: "any OpenAI-compatible host", keyPlaceholder: "..." },
  { id: "local", label: "Local model", docsHint: "http://localhost:11434", keyPlaceholder: "(no key needed)" },
  { id: "custom", label: "Custom endpoint", docsHint: "your OpenAI-compatible URL", keyPlaceholder: "base url + key" },
];

export class ApiError extends Error {
  constructor(message: string, readonly kind: "timeout" | "auth" | "network" | "server" | "offline") {
    super(message);
  }
}

const TIMEOUT_MS = 20000;

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await p(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

/**
 * Send a chat completion for an OpenAI-compatible endpoint. Used for the optional
 * "model-powered rewrite". Returns the assistant text. Anthropic/Gemini have their own
 * shapes; in the packaged app these route through the Rust side. This browser-side path
 * supports OpenAI-compatible providers (OpenAI, DeepSeek, Mistral, local, custom).
 */
export async function chatComplete(provider: string, baseUrl: string, model: string, prompt: string): Promise<string> {
  if (!navigator.onLine) throw new ApiError("You are offline.", "offline");
  const key = await readApiKey(provider);
  if (!key && provider !== "local") throw new ApiError("No API key connected for " + provider, "auth");

  const url = baseUrl.replace(/\/$/, "") + "/v1/chat/completions";
  const body = JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2 });

  const attempt = (signal: AbortSignal) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key ? { Authorization: "Bearer " + key } : {}) },
      body,
      signal,
    });

  let res: Response;
  try {
    res = await withTimeout(attempt);
  } catch {
    // one retry on transient network/timeout failure
    try {
      res = await withTimeout(attempt);
    } catch (e) {
      throw new ApiError("Request failed or timed out.", "timeout");
    }
  }
  if (res.status === 401 || res.status === 403) throw new ApiError("Invalid or expired API key.", "auth");
  if (res.status >= 500) throw new ApiError("Provider server error (" + res.status + ").", "server");
  if (!res.ok) throw new ApiError("Request failed (" + res.status + ").", "network");

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
