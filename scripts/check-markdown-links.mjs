import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = ["README.md", "CONTRIBUTING.md", "CHANGELOG.md", "docs/process"];
const IGNORE_PREFIXES = ["http://", "https://", "mailto:", "#", "/"];
const MARKDOWN_LINK_REGEX = /\[[^\]]+\]\(([^)]+)\)/g;

async function collectMarkdownFiles(targetPath, acc) {
  const absPath = path.join(ROOT, targetPath);
  const stat = await fs.stat(absPath);
  if (stat.isFile()) {
    if (absPath.endsWith(".md")) acc.push(absPath);
    return;
  }
  const entries = await fs.readdir(absPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const childPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdownFiles(childPath, acc);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      acc.push(path.join(ROOT, childPath));
    }
  }
}

function shouldSkip(link) {
  return IGNORE_PREFIXES.some((prefix) => link.startsWith(prefix));
}

function normalizeLink(link) {
  return decodeURIComponent(link.split("#")[0]);
}

async function checkFileLinks(filePath) {
  const errors = [];
  const content = await fs.readFile(filePath, "utf-8");
  const dir = path.dirname(filePath);

  for (const match of content.matchAll(MARKDOWN_LINK_REGEX)) {
    const rawLink = match[1].trim();
    if (!rawLink || shouldSkip(rawLink)) continue;
    const linkPath = normalizeLink(rawLink);
    if (!linkPath) continue;
    const resolved = path.resolve(dir, linkPath);
    try {
      await fs.access(resolved);
    } catch {
      errors.push(`broken relative link '${rawLink}'`);
    }
  }

  return errors;
}

async function main() {
  const files = [];
  for (const target of TARGETS) {
    await collectMarkdownFiles(target, files);
  }

  let hasErrors = false;
  for (const file of files) {
    const errors = await checkFileLinks(file);
    if (errors.length > 0) {
      hasErrors = true;
      const rel = path.relative(ROOT, file);
      for (const err of errors) console.error(`${rel}: ${err}`);
    }
  }

  if (hasErrors) process.exit(1);
  console.log(`Markdown link checks passed: ${files.length} file(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
