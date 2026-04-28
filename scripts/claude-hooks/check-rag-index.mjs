#!/usr/bin/env node
/**
 * Claude Code SessionStart hook.
 *
 * Проверяет актуальность индекса MCP markdown_rag по docs/.
 * Если индекс отсутствует или в docs/ есть файлы новее последней индексации —
 * инжектит в системный контекст агента инструкцию запустить
 * mcp__markdown_rag__index_documents до первого поиска.
 *
 * Источник истины — `.claude/cache/markdown-rag-timestamp.json`.
 * Файл обновляет PostToolUse hook touch-rag-index-timestamp.mjs.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const docsDir = path.join(projectDir, "docs");
const cachePath = path.join(projectDir, ".claude", "cache", "markdown-rag-timestamp.json");

// Если docs/ нет — молчим. Хук опциональный.
if (!existsSync(docsDir)) process.exit(0);

function maxMtime(dir) {
  let max = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      max = Math.max(max, maxMtime(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      try {
        const m = statSync(full).mtimeMs;
        if (m > max) max = m;
      } catch {
        // skip
      }
    }
  }
  return max;
}

let lastIndexedAt = 0;
if (existsSync(cachePath)) {
  try {
    const raw = JSON.parse(readFileSync(cachePath, "utf-8"));
    lastIndexedAt = Number(raw.indexedAt) || 0;
  } catch {
    lastIndexedAt = 0;
  }
}

const docsMaxMtime = maxMtime(docsDir);
const stale = lastIndexedAt === 0 || docsMaxMtime > lastIndexedAt;

if (!stale) process.exit(0);

const reason =
  lastIndexedAt === 0
    ? "Индекс markdown_rag для docs/ ни разу не строился в этом репозитории."
    : `В docs/ есть файлы, измененные после последней индексации (last: ${new Date(
        lastIndexedAt,
      ).toISOString()}, latest doc: ${new Date(docsMaxMtime).toISOString()}).`;

const message = [
  "[markdown_rag] Индекс docs/ устарел или отсутствует.",
  reason,
  "До первого вызова mcp__markdown_rag__search запусти:",
  '  mcp__markdown_rag__index_documents с параметрами {"directory": "docs", "recursive": true}',
  "После успешной индексации хук touch-rag-index-timestamp обновит таймстемп автоматически.",
].join("\n");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: message,
    },
  }),
);
process.exit(0);
