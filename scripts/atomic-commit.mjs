#!/usr/bin/env node
/**
 * Группирует текущие изменения (относительно HEAD) в несколько атомарных коммитов.
 * Заголовки: Conventional Commits + commitlint; тип и scope — латиницей, описание после «:» — на русском
 * (как в `.cursor/agents/git-workflow-master.md`). Скрипт не вызывает агента — шаблоны зашиты здесь.
 *
 * Использование:
 *   node scripts/atomic-commit.mjs           # план + подтверждение (y/N)
 *   node scripts/atomic-commit.mjs --yes     # без запроса
 *   node scripts/atomic-commit.mjs --dry-run # только план
 *
 * Не выполняет push. Требует чистого рабочего дерева от незавершённых merge/rebase.
 */

import { execFileSync, execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function gitStdout(args) {
  try {
    return execFileSync("git", args, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function gitRun(args, inherit = false) {
  execFileSync("git", args, inherit ? { stdio: "inherit" } : { encoding: "utf-8" });
}

function getChangedFiles() {
  const tracked = gitStdout(["diff", "--name-only", "HEAD"]);
  const untracked = gitStdout(["ls-files", "--others", "--exclude-standard"]);
  const set = new Set();
  for (const line of tracked.split("\n")) {
    if (line) set.add(line);
  }
  for (const line of untracked.split("\n")) {
    if (line) set.add(line);
  }
  return [...set].sort();
}

const BUCKET_DEFS = [
  {
    id: "deps",
    test: (f) =>
      f === "package.json" ||
      f === "package-lock.json" ||
      f === "npm-shrinkwrap.json",
    message: "chore(deps): обновить метаданные пакета",
  },
  {
    id: "ci",
    test: (f) => f.startsWith(".github/"),
    message: "ci(github): обновить CI и шаблоны GitHub",
  },
  {
    id: "husky",
    test: (f) => f.startsWith(".husky/"),
    message: "chore(husky): обновить git-хуки",
  },
  {
    id: "scripts",
    test: (f) => f.startsWith("scripts/"),
    message: "chore(scripts): обновить скрипты репозитория",
  },
  {
    id: "cursor",
    test: (f) => f.startsWith(".cursor/"),
    message: "chore(cursor): обновить правила и команды Cursor",
  },
  {
    id: "specs",
    test: (f) => f.startsWith("docs/specs/"),
    message: "docs(specs): обновить документацию требований",
  },
  {
    id: "architecture",
    test: (f) => f.startsWith("docs/architecture/"),
    message: "docs(architecture): обновить архитектурную документацию",
  },
  {
    id: "artifacts",
    test: (f) => f.startsWith("docs/artifacts/"),
    message: "docs(artifacts): обновить артефакты анализа",
  },
  {
    id: "process",
    test: (f) => f.startsWith("docs/process/"),
    message: "docs(process): обновить процессную документацию для участников",
  },
  {
    id: "protocols",
    test: (f) => f.startsWith("docs/protocols/"),
    message: "docs(protocols): обновить протоколы встреч",
  },
  {
    id: "demo-days",
    test: (f) => f.startsWith("docs/demo-days/"),
    message: "docs(demo-days): обновить материалы demo-days",
  },
  {
    id: "docs-root",
    test: (f) => f.startsWith("docs/"),
    message: "docs(docs): обновить документацию в каталоге docs",
  },
  {
    id: "ui",
    test: (f) => f.startsWith("ui/"),
    message: "chore(wireframe): обновить wireframe UI",
  },
  {
    id: "root-docs",
    test: (f) => f === "README.md" || f === "CONTRIBUTING.md" || f === "LICENSE",
    message: "docs(repo): обновить README и руководства в корне",
  },
];

const MISC = {
  id: "misc",
  message: "chore(repo): обновить прочие файлы репозитория",
};

const BUCKET_ORDER = [
  "deps",
  "ci",
  "husky",
  "scripts",
  "cursor",
  "specs",
  "architecture",
  "artifacts",
  "process",
  "protocols",
  "demo-days",
  "docs-root",
  "ui",
  "root-docs",
  "misc",
];

function classifyFile(path) {
  for (const def of BUCKET_DEFS) {
    if (def.test(path)) return def;
  }
  return MISC;
}

function groupFiles(files) {
  /** @type {Map<string, { def: object, files: string[] }>} */
  const map = new Map();
  for (const f of files) {
    const def = classifyFile(f);
    const key = def.id;
    if (!map.has(key)) {
      map.set(key, { def, files: [] });
    }
    map.get(key).files.push(f);
  }
  return map;
}

function sortBuckets(map) {
  const entries = [...map.entries()].filter(([, v]) => v.files.length > 0);
  entries.sort((a, b) => BUCKET_ORDER.indexOf(a[0]) - BUCKET_ORDER.indexOf(b[0]));
  return entries;
}

function assertCleanGitState() {
  try {
    execSync("git rev-parse -q --verify MERGE_HEAD", { stdio: "ignore" });
    console.error("atomic-commit: merge in progress. Resolve or abort before running.");
    process.exit(1);
  } catch {
    /* no merge */
  }
  try {
    execSync("git rev-parse -q --verify REBASE_HEAD", { stdio: "ignore" });
    console.error("atomic-commit: rebase in progress. Continue or abort before running.");
    process.exit(1);
  } catch {
    /* no rebase */
  }
}

async function confirm(message) {
  const rl = createInterface({ input, output });
  const answer = await rl.question(message);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const yes = process.argv.includes("--yes");

  assertCleanGitState();

  const files = getChangedFiles();
  if (files.length === 0) {
    console.log("atomic-commit: nothing to commit (clean working tree vs HEAD).");
    process.exit(0);
  }

  const map = groupFiles(files);
  const buckets = sortBuckets(map);

  console.log("atomic-commit: planned commits (in order):\n");
  for (const [, { def, files: fs }] of buckets) {
    const msg = def.message || MISC.message;
    console.log(`  — ${msg}`);
    console.log(`    files (${fs.length}): ${fs.slice(0, 8).join(", ")}${fs.length > 8 ? ", …" : ""}\n`);
  }

  if (dryRun) {
    console.log("Dry run: no commits created.");
    process.exit(0);
  }

  if (!yes) {
    const ok = await confirm("Create these commits? [y/N] ");
    if (!ok) {
      console.log("Aborted.");
      process.exit(1);
    }
  }

  for (const [, { def, files: fs }] of buckets) {
    if (fs.length === 0) continue;
    const msg = def.message || MISC.message;
    gitRun(["add", "--", ...fs], true);
    gitRun(["commit", "-m", msg], true);
    console.log(`Created: ${msg}`);
  }

  console.log("\natomic-commit: done. Review with: git log -n 20 --oneline");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
