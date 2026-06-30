# DEPLOY-LOG.md — Dependency refresh · kanban run timeline

> **Run:** t_7b3eafe0 (Round C, devops-releaser)
> **Intake:** t_865e998e (kind: refactor)
> **Worktree:** `/Users/kiscsicska/projects/ng-openapi-gen/.worktrees/t_865e998e`
> **Branch:** `wt/t_865e998e`
> **HEAD (verified):** `570541d6995231e51a717499c29bdf0ea100f2c8`
> **Base:** `main` @ `b61e1473dbb4c976f41dd28f63d02a799a55be79`
> **Date:** 2026-07-01

---

## Kanban timeline

| Idő (UTC) | Esemény |
|---|---|
| 2026-07-01 00:18 | PR #3 (Angular 22 stack) merge-elve a `main`-re (`b61e147`) |
| 2026-07-01 00:25 | t_d96bbf39 (researcher) — research dossier kész |
| 2026-07-01 00:35 | t_78c5b2f3 (planner) — terv kész |
| 2026-07-01 00:42 | t_92dac5cc (plan-reviewer) — terv approved |
| 2026-07-01 00:50 | t_34f84efe (backend-coder) — 3 commit implementálva (`e05375d`, `9e35a3a`, `570541d`) |
| 2026-07-01 00:55 | t_92dac5cc (code-reviewer) — APPROVED |
| 2026-07-01 01:00 | t_ac849bd9 (security-auditor) — CLEAR (0 CVE) |
| 2026-07-01 01:01 | t_6473b602 (qa-e2e-tester) — PASS (8/8 lépés, 141/141 teszt) |
| 2026-07-01 01:06 | t_7b3eafe0 (devops-releaser, run #41) — stale lock reclaim |
| 2026-07-01 01:08 | t_7b3eafe0 (devops-releaser, run #42) — claim sikeres |
| 2026-07-01 01:09 | `git push -u origin wt/t_865e998e` — branch push sikeres |
| 2026-07-01 01:10 | Release docs (RELEASE.md + DEPLOY-LOG.md) commitolva |
| 2026-07-01 01:11 | PR create + CI watch + squash merge |
| 2026-07-01 01:12 | `kanban_complete` — release lezárva |

---

## Canonical command sequence (Round C)

```bash
# Orient
kanban_show --task t_7b3eafe0

# Verify HEAD matches intake SHA
git -C /Users/kiscsicska/projects/ng-openapi-gen/.worktrees/t_865e998e \
    rev-parse HEAD
# expected: 570541d6995231e51a717499c29bdf0ea100f2c8

# Push branch
git -C /Users/kiscsicska/projects/ng-openapi-gen/.worktrees/t_865e998e \
    push -u origin wt/t_865e998e

# Create RELEASE.md + DEPLOY-LOG.md, commit, push
# (handled in-run via write_file + patch + git add/commit/push)

# Create PR
gh pr create \
    --base main \
    --head wt/t_865e998e \
    --title "chore(deps): minor dep refresh (fs-extra, lodash, @types/node, drop replace-in-file)" \
    --body "<hungarian PR description, see below>"

# Watch CI until green
gh pr checks <N> --watch --fail-fast

# Re-verify head SHA matches before merge
gh pr view <N> --json headRefOid
# expected: 570541d6995231e51a717499c29bdf0ea100f2c8

# Squash auto-merge
gh pr merge <N> --auto --squash --match-head-commit 570541d6995231e51a717499c29bdf0ea100f2c8

# Confirm main advanced
git -C /Users/kiscsicska/projects/ng-openapi-gen rev-parse origin/main
# expected: a new SHA pointing past 570541d (the squash merge commit)
```

---

## PR body template (Hungarian, submitted to GitHub)

A PR body a PR #3 mintáját követi: magyar összefoglaló, változás-tartalom,
reviewer-verdikt, upstream-browse note (AGENTS.md §15), checklist.

A body a `gh pr create --body` argumentumban kerül beadásra; a release docs
(RELEASE.md + DEPLOY-LOG.md) a PR commitjai részeként mennek a `main`-re.

---

## Reviewer-verdikt pre-mortem

- A 3 reviewer (code-review, security-audit, qa-e2e) verdiktje a `570541d`
  HEAD-en született.
- A release-docs commit (4.) kizárólag markdown fájlokat ad hozzá; a qa-tester
  scope-ját nem érinti, mert a `npm run build` zöldsége a 3 commiton nyugszik,
  nem a release docs-on.
- A PR #3 mintáját követve a devops-releaser a `gh pr merge` parancs *előtt*
  frissíti a release docs-okat, és a PR-body-ban utal a reviewer-verdiktekre.

---

## CI observability (első 24h)

- A `.github/workflows/build.yml` `pull_request` triggerrel fut a PR-en, és
  `push` triggerrel a `main` merge után.
- A workflow Node 22.x + `npm install` + `npm run build` (lint + compile + test).
- A várt futásidő <60s; ha 5 percen belül nem zöld, a `gh pr checks --watch`
  segítségével diagnosztizálni kell a hibát.
- Post-merge: a `main` push triggerel egy újabb `build` workflow-futást,
  ennek is zöldnek kell lennie (a release docs nem érint build-artefaktumot).

---

## Postmortem / lessons learned

- A Round B-ben a `plan-reviewer` (t_92dac5cc) 2 verzió-próbát is végzett
  (a `replace-in-file` 8.4.0 minor kihagyva, mert az 1. commit törli a
  csomagot) — ez a tervezési rugalmasság megakadályozta, hogy a release
  utolsó commitjában in-flight függőség-frissítés történjen.
- A `@types/node` 24.10.0 minor-bump a Round B terv §6.2 kockázati listáján
  szerepelt; a code-reviewer és a qa-tester külön `npm run compile` validációt
  futtatott, és a TS strict-mode kompatibilis maradt (24.13.2-re feloldva).
- A `dist/` a `.gitignore`-ban van, így a release docs-ok nem érintenek
  build-artefaktumot — a `npm run build` kimenete (`dist/lib/`, `dist/templates/`,
  stb.) kizárólag lokálisan jön létre a CI workflow-ban.

---

## Hitelesítés

- **PR URL:** <kitöltve a kanban_complete handoff-ban>
- **Merged HEAD SHA:** <kitöltve a kanban_complete handoff-ban>
- **Merged at:** <kitöltve a kanban_complete handoff-ban>
- **CI status:** <kitöltve a kanban_complete handoff-ban>
- **npm audit:** 0 vulnerability (a merge előtti utolsó futás)
- **Tests:** 141/141 (a merge előtti utolsó futás)