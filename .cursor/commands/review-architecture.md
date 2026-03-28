---
description: Review architecture docs and DDD (software-architect, SAB)
---

Follow `.cursor/rules/software-architect.mdc`.
Use the repository-specific "SAB Repository: Architecture and DDD Review" checklist in that file.

When the topic includes **persistence, relational schema, ER diagrams, indexes, or migrations**, also apply `.cursor/rules/database-optimizer.mdc` (data model alignment, query/migration discipline).

When the topic includes **service/API design, backend integration, or protocol-level flows**, also apply `.cursor/rules/backend-architect.mdc` (scalability, security, protocol consistency).

**Input:** `docs/architecture/**/*.md` (ADR, bounded contexts, study materials); при необходимости артефакты модели данных и `docs/protocols/`.

**Output:** ADR <-> model <-> context-diagram consistency; terminology issues; integration gaps; prioritized findings; при подключении database-optimizer/backend-architect — замечания по схеме БД и бэкенд-контексту.
