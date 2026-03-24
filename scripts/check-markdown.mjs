import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  "README.md",
  "CONTRIBUTING.md",
  "docs/readme.md",
  "docs/styleguide.md",
  "docs/process",
  "docs/specs/readme.md",
  "docs/artifacts/readme.md",
  "docs/architecture/readme.md",
  "docs/demo-days/readme.md",
  "docs/protocols/readme.md"
];
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".cursor", ".venv", ".venv-markitdown"]);

async function collectMarkdownFiles(targetPath, acc) {
  const absPath = path.join(ROOT, targetPath);
  const stat = await fs.stat(absPath);

  if (stat.isFile()) {
    if (absPath.endsWith(".md")) acc.push(absPath);
    return;
  }

  const entries = await fs.readdir(absPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && EXCLUDE_DIRS.has(entry.name)) continue;
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdownFiles(entryPath, acc);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      acc.push(path.join(ROOT, entryPath));
    }
  }
}

function lintContent(filePath, content) {
  const errors = [];
  const rel = path.relative(ROOT, filePath);
  if (content.trim().length === 0) {
    errors.push("file is empty");
  }
  if (!content.endsWith("\n")) {
    errors.push("file must end with newline");
  }

  const lines = content.split("\n");
  const firstNonEmpty = lines.find((line) => line.trim().length > 0) || "";
  const skipHeadingRule = rel === "docs/protocols/readme.md";
  if (!skipHeadingRule && !(firstNonEmpty.startsWith("# ") || firstNonEmpty.startsWith("## "))) {
    errors.push("first non-empty line must start with markdown heading");
  }

  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line)) {
      errors.push(`line ${index + 1}: trailing whitespace`);
    }
    if (line.length > 500) {
      errors.push(`line ${index + 1}: line too long (>500 chars)`);
    }
  });

  // Guard against accidental unresolved merge conflicts in governance docs.
  if (/^(<<<<<<<|=======|>>>>>>>)$/m.test(content)) {
    errors.push("contains merge conflict markers");
  }

  if (
    rel.startsWith("docs/process/") &&
    !rel.includes("/templates/") &&
    !rel.endsWith("traceability-matrix-log.md") &&
    !content.includes("## ")
  ) {
    errors.push("process doc must include at least one H2 section");
  }
  return errors;
}

async function main() {
  const files = [];
  for (const target of TARGETS) {
    await collectMarkdownFiles(target, files);
  }

  let hasErrors = false;
  for (const filePath of files) {
    const content = await fs.readFile(filePath, "utf-8");
    const errors = lintContent(filePath, content);
    if (errors.length > 0) {
      hasErrors = true;
      const rel = path.relative(ROOT, filePath);
      for (const error of errors) {
        console.error(`${rel}: ${error}`);
      }
    }
  }

  if (hasErrors) process.exit(1);
  console.log(`Markdown checks passed: ${files.length} file(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
