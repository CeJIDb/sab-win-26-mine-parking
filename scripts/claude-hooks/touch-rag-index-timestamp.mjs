#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook.
 *
 * Срабатывает после успешного вызова mcp__markdown_rag__index_documents
 * и записывает текущий timestamp в .claude/cache/markdown-rag-timestamp.json.
 *
 * Парный к check-rag-index.mjs (SessionStart hook).
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf-8") || "{}");
} catch {
  process.exit(0);
}

const toolName = payload.tool_name || "";
if (toolName !== "mcp__markdown_rag__index_documents") process.exit(0);

// Не обновляем timestamp, если tool вернул ошибку.
const response = payload.tool_response || {};
if (response.is_error === true) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const cacheDir = path.join(projectDir, ".claude", "cache");
const cachePath = path.join(cacheDir, "markdown-rag-timestamp.json");

try {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(
    cachePath,
    JSON.stringify({ indexedAt: Date.now(), indexedAtIso: new Date().toISOString() }, null, 2) +
      "\n",
    "utf-8",
  );
} catch (error) {
  console.error(`touch-rag-index-timestamp: не удалось записать ${cachePath}: ${error.message}`);
  process.exit(0);
}

process.exit(0);
