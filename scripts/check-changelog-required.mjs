import { execSync } from "node:child_process";

const EXCLUDED_PREFIXES = [".github/", ".husky/", "docs/process/"];
const SIGNIFICANT_PREFIXES = ["docs/", "ui/", "scripts/", "README.md", "CONTRIBUTING.md", "package.json"];

function getChangedFiles() {
  const range = process.env.CI_MERGE_RANGE;
  if (range) {
    const output = execSync(`git diff --name-only ${range}`, { encoding: "utf-8" }).trim();
    if (!output) return [];
    return output.split("\n").filter(Boolean);
  }
  const output = execSync("git diff --name-only --cached", { encoding: "utf-8" }).trim();
  if (!output) return [];
  return output.split("\n").filter(Boolean);
}

function requiresChangelog(files) {
  const relevant = files.filter((file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)));
  return relevant.some((file) => SIGNIFICANT_PREFIXES.some((prefix) => file.startsWith(prefix)));
}

function main() {
  const files = getChangedFiles();
  if (files.length === 0) {
    console.log("No changed files found for changelog check.");
    return;
  }

  const changelogChanged = files.includes("CHANGELOG.md");
  if (requiresChangelog(files) && !changelogChanged) {
    console.error("CHANGELOG.md must be updated for significant changes.");
    process.exit(1);
  }

  console.log("Changelog guard passed.");
}

main();
