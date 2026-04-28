#!/usr/bin/env node
/**
 * Проверяет синтаксис Mermaid-блоков во всех .md файлах docs/.
 *
 * Алгоритм:
 *   1. Рекурсивно найти все .md файлы в docs/.
 *   2. Извлечь блоки ```mermaid ... ``` регулярным выражением.
 *   3. Каждый блок записать во временный .mmd файл в /tmp.
 *   4. Прогнать через `mmdc -i <tmp.mmd> -o <tmp.svg> --quiet`.
 *   5. При ненулевом exit code — упасть с путем к .md, номером блока, текстом ошибки.
 *   6. В конце удалить все временные файлы.
 *
 * Использование: node scripts/lint-mermaid.mjs
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const MMDC_BIN = path.join(ROOT, "node_modules", ".bin", "mmdc");

const EXCLUDE_DIRS = new Set([".git", "node_modules", ".venv", "__pycache__", ".cache"]);

// Регулярное выражение для извлечения блоков ```mermaid ... ```
// Флаг `g` + `s` (dotAll) для многострочных блоков.
const MERMAID_BLOCK_RE = /^```mermaid\r?\n([\s\S]*?)^```\s*$/gm;

/**
 * Рекурсивно собирает все .md файлы из директории.
 * @param {string} dir — абсолютный путь к директории
 * @param {string[]} acc — аккумулятор
 */
async function walkMd(dir, acc) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMd(full, acc);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      acc.push(full);
    }
  }
}

/**
 * Извлекает тела mermaid-блоков из текста файла.
 * @param {string} text — содержимое .md файла
 * @returns {{ body: string; blockIndex: number }[]}
 */
function extractMermaidBlocks(text) {
  const blocks = [];
  let match;
  let index = 0;
  const re = new RegExp(MERMAID_BLOCK_RE.source, "gm");
  while ((match = re.exec(text)) !== null) {
    blocks.push({ body: match[1], blockIndex: index });
    index++;
  }
  return blocks;
}

/**
 * Проверяет один mermaid-блок через mmdc.
 * @param {string} body — тело блока (без обрамляющих ```)
 * @param {string} tmpBase — путь без расширения для tmp-файлов
 * @returns {{ ok: boolean; stderr: string }}
 */
async function checkBlock(body, tmpBase) {
  const inputFile = `${tmpBase}.mmd`;
  const outputFile = `${tmpBase}.svg`;
  await fs.writeFile(inputFile, body, "utf8");

  try {
    await execFileAsync(MMDC_BIN, [
      "-i", inputFile,
      "-o", outputFile,
      "--quiet",
    ]);
    return { ok: true, stderr: "" };
  } catch (err) {
    const stderr = (err.stderr || err.message || "").trim();
    return { ok: false, stderr };
  } finally {
    // Удаляем временные файлы независимо от результата
    await fs.unlink(inputFile).catch(() => {});
    await fs.unlink(outputFile).catch(() => {});
  }
}

async function main() {
  // 1. Найти все .md файлы в docs/
  const mdFiles = [];
  await walkMd(DOCS_DIR, mdFiles);
  mdFiles.sort();

  const errors = [];
  let totalBlocks = 0;
  let filesWithBlocks = 0;
  const tmpDir = tmpdir();

  // 2. Проверить каждый файл
  for (const filePath of mdFiles) {
    let text;
    try {
      text = await fs.readFile(filePath, "utf8");
    } catch (err) {
      errors.push(`${filePath}: не удалось прочитать файл: ${err.message}`);
      continue;
    }

    const blocks = extractMermaidBlocks(text);
    if (blocks.length === 0) continue;

    filesWithBlocks++;
    totalBlocks += blocks.length;

    const relPath = path.relative(ROOT, filePath);

    for (const { body, blockIndex } of blocks) {
      const tmpBase = path.join(tmpDir, `lint-mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const result = await checkBlock(body, tmpBase);

      if (!result.ok) {
        errors.push(
          `Ошибка синтаксиса Mermaid:\n` +
          `  Файл:  ${relPath}\n` +
          `  Блок:  #${blockIndex + 1}\n` +
          `  Вывод: ${result.stderr || "(нет вывода)"}`
        );
      }
    }
  }

  // 3. Итоговый отчет
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
      console.error("");
    }
    console.error(
      `Проверка Mermaid завершилась с ошибками: ${errors.length} блок(ов) не прошли проверку.`
    );
    process.exit(1);
  }

  if (totalBlocks === 0) {
    console.log("Mermaid-блоки в docs/ не найдены — проверять нечего.");
  } else {
    console.log(
      `Проверено ${totalBlocks} блок(ов) в ${filesWithBlocks} файл(ах), все ОК.`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
