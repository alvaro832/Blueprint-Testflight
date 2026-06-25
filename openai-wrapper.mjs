{
  "name": "blueprint-engine",
  "version": "1.0.0",
  "description": "Zero-dependency AI prompt optimizer — reduce, compress, clarify prompts and estimate token cost before sending to any model.",
  "type": "module",
  "main": "./blueprint.cjs",
  "module": "./blueprint.mjs",
  "exports": {
    ".": { "import": "./blueprint.mjs", "require": "./blueprint.cjs" }
  },
  "bin": { "blueprint": "./cli.mjs" },
  "files": ["blueprint.mjs", "blueprint.cjs", "blueprint.global.js", "cli.mjs"],
  "scripts": { "demo": "node examples/basic.mjs", "optimize": "node cli.mjs" },
  "keywords": ["ai", "tokens", "prompt", "optimizer", "cost", "llm", "openai", "anthropic"],
  "license": "MIT"
}
