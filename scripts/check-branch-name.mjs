import { execSync } from "node:child_process";

const BRANCH_REGEX = /^(feature|docs|chore|hotfix)\/[a-z0-9._-]+$/;

function getBranchName() {
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
}

function isProtectedBranch(branchName) {
  return branchName === "main" || branchName === "master";
}

function main() {
  const branchName = getBranchName();

  if (isProtectedBranch(branchName)) {
    console.log(`Branch '${branchName}' is allowed as protected branch.`);
    return;
  }

  if (!BRANCH_REGEX.test(branchName)) {
    console.error(
      `Invalid branch name '${branchName}'. Use: feature/*, docs/*, chore/*, hotfix/* with lowercase latin symbols.`
    );
    process.exit(1);
  }

  console.log(`Branch name '${branchName}' matches policy.`);
}

main();
