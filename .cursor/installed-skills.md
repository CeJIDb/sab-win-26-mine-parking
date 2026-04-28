# Установленные skills

## Установленные skills

| Skill                                   | Source                               |
| --------------------------------------- | ------------------------------------ |
| `ai-prompt-engineering-safety-review`   | `/home/cejidb/.agents/skills`        |
| `architecture`                          | `/home/cejidb/.agents/skills`        |
| `data-scientist`                        | `/home/cejidb/.agents/skills`        |
| `docs-audit`                            | `/home/cejidb/.agents/skills`        |
| `docs-write`                            | `/home/cejidb/.agents/skills`        |
| `docs-writer`                           | `/home/cejidb/.agents/skills`        |
| `emergency-rescue`                      | `/home/cejidb/.agents/skills`        |
| `engineering`                           | `/home/cejidb/.agents/skills`        |
| `generating-glossaries-and-definitions` | `/home/cejidb/.agents/skills`        |
| `git-pushing`                           | `/home/cejidb/.agents/skills`        |
| `git-workflow`                          | `/home/cejidb/.agents/skills`        |
| `glossary-page-generator`               | `/home/cejidb/.agents/skills`        |
| `make-repo-contribution`                | `/home/cejidb/.agents/skills`        |
| `markdown-mermaid-writing`              | `/home/cejidb/.agents/skills`        |
| `markitdown`                            | `/home/cejidb/.agents/skills`        |
| `modbus-protocol`                       | `/home/cejidb/.agents/skills`        |
| `multi-agent-patterns`                  | `/home/cejidb/.agents/skills`        |
| `ocr-image-to-markdown`                 | `/home/cejidb/.agents/skills`        |
| `openapi-glossary`                      | `/home/cejidb/.agents/skills`        |
| `prd`                                   | `/home/cejidb/.agents/skills`        |
| `product-requirements`                  | `/home/cejidb/.agents/skills`        |
| `prompt-engineering-patterns`           | `/home/cejidb/.agents/skills`        |
| `prompt-optimize`                       | `/home/cejidb/.agents/skills`        |
| `requirement-review`                    | `/home/cejidb/.agents/skills`        |
| `requirements-clarity`                  | `/home/cejidb/.agents/skills`        |
| `requirements-engineering`              | `/home/cejidb/.agents/skills`        |
| `senior-data-scientist`                 | `/home/cejidb/.agents/skills`        |
| `spec-flow-analyzer`                    | `/home/cejidb/.agents/skills`        |
| `terminology-work`                      | `/home/cejidb/.agents/skills`        |
| `update-specification`                  | `/home/cejidb/.agents/skills`        |
| `create-rule`                           | `/home/cejidb/.cursor/skills-cursor` |
| `create-skill`                          | `/home/cejidb/.cursor/skills-cursor` |
| `create-subagent`                       | `/home/cejidb/.cursor/skills-cursor` |
| `migrate-to-skills`                     | `/home/cejidb/.cursor/skills-cursor` |
| `shell`                                 | `/home/cejidb/.cursor/skills-cursor` |
| `update-cursor-settings`                | `/home/cejidb/.cursor/skills-cursor` |
| `openai-docs`                           | `/home/cejidb/.codex/skills/.system` |
| `skill-creator`                         | `/home/cejidb/.codex/skills/.system` |
| `skill-installer`                       | `/home/cejidb/.codex/skills/.system` |

## Как установить skills через MCP

Используется MCP server `user-skillsmp` (вызывается как `mcp skillsmp.com`), tool name `skillsmp_install_skill`.

Обязательные параметры:

- `source`: GitHub owner/repo или URL репозитория с skill (например, `owner/repo` или `https://...`)
- `skills`: имена skills (одно или несколько; можно строкой через запятую или массивом)
- `agents`: целевые агенты (комма-разделенные значения)

Необязательный параметр:

- `global`: применить настройки/установку глобально (если поддерживается источником)

Допустимые значения для `agents`:

- `opencode`
- `claude-code`
- `codex`
- `cursor`
- `antigravity`
- `github-copilot`
- `roo`

Пример установки одного skill на агент `cursor`:

```bash
mcp skillsmp.com skillsmp_install_skill \
  --source "owner/repo" \
  --skills "architecture" \
  --agents "cursor"
```

## Verification for current subagents

Checked against active files in `.cursor/agents/*.md`:

- `systems-analyst.md`
- `glossary-terms-maintainer.md`
- `git-workflow-master.md`
- `doc-to-markdown.md`
- `demo-days-presentations.md`

Result:

- All referenced **skills** are present in this installed list.
- No additional skill installation is required at the moment.
- Names like `technical-writer`, `security-engineer`, `ux-architect`, etc. are review role names from `.cursor/rules/*.mdc`, not installable skills.
