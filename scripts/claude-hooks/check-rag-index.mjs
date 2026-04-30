#!/usr/bin/env node
/**
 * Claude Code SessionStart hook.
 *
 * Считает, сколько .md-файлов в docs/ изменено после последней индексации
 * markdown_rag. Если набралось «много» (порог STALE_THRESHOLD) или индекс
 * не строился ни разу — инжектит контекст для агента: напомнить пользователю
 * запустить индексацию через MCP (mcp__markdown_rag__index_documents).
 *
 * Сам индекс хук НЕ обновляет — это медленная операция, требует явного
 * разрешения пользователя.
 *
 * Источник истины — `.claude/cache/markdown-rag-timestamp.json`.
 * Файл обновляет PostToolUse hook touch-rag-index-timestamp.mjs после
 * успешного вызова mcp__markdown_rag__index_documents.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const docsDir = path.join(projectDir, "docs");
const cachePath = path.join(projectDir, ".claude", "cache", "markdown-rag-timestamp.json");

// Порог «много изменений» — выше него хук просит агента напомнить про обновление.
// Можно переопределить через RAG_STALE_THRESHOLD (полезно в CI/тестах).
const STALE_THRESHOLD = Number(process.env.RAG_STALE_THRESHOLD) || 5;

if (!existsSync(docsDir)) process.exit(0);

function collectStaleFiles(dir, since, acc) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectStaleFiles(full, since, acc);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      try {
        if (statSync(full).mtimeMs > since) acc.push(full);
      } catch {
        // skip unreadable
      }
    }
  }
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

const neverIndexed = lastIndexedAt === 0;
const staleFiles = [];
collectStaleFiles(docsDir, lastIndexedAt, staleFiles);
const staleCount = staleFiles.length;

// Молчим, если индекс свежий ИЛИ изменений мало (не «много»).
if (!neverIndexed && staleCount < STALE_THRESHOLD) process.exit(0);

const reason = neverIndexed
  ? "Индекс markdown_rag для docs/ ни разу не строился в этом репозитории."
  : `В docs/ ${staleCount} .md-файлов изменены после последней индексации (last: ${new Date(
      lastIndexedAt,
    ).toISOString()}).`;

const message = [
  "[markdown_rag] Индекс docs/ устарел.",
  reason,
  "Если в текущей сессии планируется mcp__markdown_rag__search или пользователь",
  "правит документацию — предложи запустить индексацию через MCP:",
  "  mcp__markdown_rag__index_documents   # инкрементально (по умолчанию)",
  "Запускай только с явного разрешения пользователя — это медленная операция.",
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
