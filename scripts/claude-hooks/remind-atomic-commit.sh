#!/usr/bin/env bash
# Claude Code Stop hook.
# Тонкий wrapper над scripts/git-workflow-agent-reminder.mjs.
# На Stop проверяем worktree — если накопился крупный дифф, напоминаем
# про атомарные коммиты. Скрипт сам решает, показывать ли сообщение,
# и всегда возвращает 0 (хук не блокирует).

set -u
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${REPO_ROOT}" ]]; then
  exit 0
fi

node "${REPO_ROOT}/scripts/git-workflow-agent-reminder.mjs" --worktree || true
exit 0
