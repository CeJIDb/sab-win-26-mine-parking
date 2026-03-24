import { execSync } from "node:child_process";

const EXCLUDED_PREFIXES = [".github/", ".husky/"];
const RELEVANT_PREFIXES = [
  "docs/specs/",
  "docs/protocols/",
  "docs/architecture/",
  "docs/artifacts/",
];
const TRACEABILITY_LOG_PATH = "docs/process/traceability-matrix-log.md";

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

function main() {
  const files = getChangedFiles();
  if (files.length === 0) {
    console.log("No changed files found for traceability check.");
    return;
  }

  const relevantFiles = files.filter((file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)));
  const isTraceabilityRequired = relevantFiles.some((file) => RELEVANT_PREFIXES.some((prefix) => file.startsWith(prefix)));

  if (isTraceabilityRequired && !files.includes(TRACEABILITY_LOG_PATH)) {
    console.error("Traceability matrix update is required.");
    console.error(`Changed requirements/docs detected, but '${TRACEABILITY_LOG_PATH}' was not updated.`);
    process.exit(1);
  }

  console.log("Traceability matrix guard passed.");
}

main();

