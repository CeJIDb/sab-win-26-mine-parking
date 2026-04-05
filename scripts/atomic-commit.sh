#!/usr/bin/env bash
set -euo pipefail

dry_run=0
yes=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    --yes) yes=1 ;;
    *)
      echo "atomic-commit.sh: unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

if git rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; then
  echo "atomic-commit: merge in progress. Resolve or abort before running." >&2
  exit 1
fi

if git rev-parse -q --verify REBASE_HEAD >/dev/null 2>&1; then
  echo "atomic-commit: rebase in progress. Continue or abort before running." >&2
  exit 1
fi

mapfile -t tracked_files < <(git diff --name-only HEAD)
mapfile -t untracked_files < <(git ls-files --others --exclude-standard)

declare -A seen_files=()
files=()

for file in "${tracked_files[@]}" "${untracked_files[@]}"; do
  [[ -n "$file" ]] || continue
  if [[ -z "${seen_files[$file]+x}" ]]; then
    seen_files["$file"]=1
    files+=("$file")
  fi
done

if [[ ${#files[@]} -eq 0 ]]; then
  echo "atomic-commit: nothing to commit (clean working tree vs HEAD)."
  exit 0
fi

IFS=$'\n' files=($(printf "%s\n" "${files[@]}" | sort))
unset IFS

bucket_order=(
  deps
  ci
  husky
  scripts
  cursor
  specs
  architecture
  artifacts
  process
  protocols
  demo-days
  docs-root
  ui
  root-docs
  misc
)

message_for_bucket() {
  case "$1" in
    deps) echo "chore(deps): обновить метаданные пакета" ;;
    ci) echo "ci(github): обновить CI и шаблоны GitHub" ;;
    husky) echo "chore(husky): обновить git-хуки" ;;
    scripts) echo "chore(scripts): обновить скрипты репозитория" ;;
    cursor) echo "chore(cursor): обновить правила и команды Cursor" ;;
    specs) echo "docs(specs): обновить документацию требований" ;;
    architecture) echo "docs(architecture): обновить архитектурную документацию" ;;
    artifacts) echo "docs(artifacts): обновить артефакты анализа" ;;
    process) echo "docs(process): обновить процессную документацию для участников" ;;
    protocols) echo "docs(protocols): обновить протоколы встреч" ;;
    demo-days) echo "docs(demo-days): обновить материалы demo-days" ;;
    docs-root) echo "docs(docs): обновить документацию в каталоге docs" ;;
    ui) echo "chore(wireframe): обновить wireframe UI" ;;
    root-docs) echo "docs(repo): обновить README и руководства в корне" ;;
    misc) echo "chore(repo): обновить прочие файлы репозитория" ;;
  esac
}

bucket_var_name() {
  echo "${1//-/_}"
}

bucket_for_file() {
  local file="$1"
  case "$file" in
    package.json|package-lock.json|npm-shrinkwrap.json) echo "deps" ;;
    .github/*) echo "ci" ;;
    .husky/*) echo "husky" ;;
    scripts/*) echo "scripts" ;;
    .cursor/*) echo "cursor" ;;
    docs/specs/*) echo "specs" ;;
    docs/architecture/*) echo "architecture" ;;
    docs/artifacts/*) echo "artifacts" ;;
    docs/process/*) echo "process" ;;
    docs/protocols/*) echo "protocols" ;;
    docs/demo-days/*) echo "demo-days" ;;
    docs/*) echo "docs-root" ;;
    ui/*) echo "ui" ;;
    README.md|CONTRIBUTING.md|LICENSE) echo "root-docs" ;;
    *) echo "misc" ;;
  esac
}

for bucket in "${bucket_order[@]}"; do
  declare -a "bucket_$(bucket_var_name "$bucket")"
done

for file in "${files[@]}"; do
  bucket="$(bucket_for_file "$file")"
  eval "bucket_$(bucket_var_name "$bucket")+=(\"\$file\")"
done

echo "atomic-commit: planned commits (in order):"
echo

for bucket in "${bucket_order[@]}"; do
  eval "bucket_files=(\"\${bucket_$(bucket_var_name "$bucket")[@]}\")"
  [[ ${#bucket_files[@]} -gt 0 ]] || continue

  msg="$(message_for_bucket "$bucket")"
  preview=("${bucket_files[@]:0:8}")
  preview_text="$(printf "%s, " "${preview[@]}")"
  preview_text="${preview_text%, }"
  if [[ ${#bucket_files[@]} -gt 8 ]]; then
    preview_text="${preview_text}, …"
  fi

  echo "  — $msg"
  echo "    files (${#bucket_files[@]}): $preview_text"
  echo
done

if [[ $dry_run -eq 1 ]]; then
  echo "Dry run: no commits created."
  exit 0
fi

if [[ $yes -ne 1 ]]; then
  read -r -p "Create these commits? [y/N] " answer
  if [[ ! "$answer" =~ ^[Yy]([Ee][Ss])?$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

for bucket in "${bucket_order[@]}"; do
  eval "bucket_files=(\"\${bucket_$(bucket_var_name "$bucket")[@]}\")"
  [[ ${#bucket_files[@]} -gt 0 ]] || continue

  msg="$(message_for_bucket "$bucket")"
  git add -- "${bucket_files[@]}"
  git commit -m "$msg"
  echo "Created: $msg"
done

echo
echo "atomic-commit: done. Review with: git log -n 20 --oneline"
