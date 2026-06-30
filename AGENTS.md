# AGENTS.md — ng-openapi-gen (EggProject fork)

> Auto-bootstrapped by the `new-hermes-project` skill on 2026-06-29.
> Filled from local repo evidence (`package.json`, `README.md`, `tsconfig.json`,
> `vitest.config.ts`, `eslint.config.mjs`) plus 2+ external sources confirming
> the upstream origin (`cyclosproject/ng-openapi-gen` on GitHub + npm registry).

---

## 0 · ⚠️ FORK FLAG — read this first

This repository is **NOT the original project**. It is a private fork maintained
under the `EggProject` organization. The canonical, upstream project lives at:

- **Upstream URL**: `https://github.com/cyclosproject/ng-openapi-gen`
- **Upstream npm**: `ng-openapi-gen` on the public registry
- **Upstream author**: `Cyclos development team`
- **Local fork URL**: `git@github.com:EggProject/ng-openapi-gen.git`

### Manual upstream awareness

This project does **not** wire up an `upstream` git remote — there is no
automated fetch and no automated pre-PR diff against the canonical
repository. The fork-tagging is informational only.

When the team prepares a release, a larger refactor, or a security patch,
the developer responsible manually browses
`https://github.com/cyclosproject/ng-openapi-gen/commits/master` (or the
GitHub Releases page) and notes any divergence between upstream and the
fork in the PR description. The `code-reviewer` profile treats a release
PR that omits this note as an automatic request-changes — but the check
is documentation-only, not git-based.

---

## 0.1 · Communication language

All user-facing communication produced by any Hermes profile that touches
this project — summaries, questions, plan explanations, completion
notifications, completion handoffs — MUST be written in **Hungarian
(magyar)**.

The internal sections of this `AGENTS.md`, technical command names, file
paths, CLI flags, and code identifiers stay in English. Hungarian applies
to the prose around them.

If a profile is uncertain whether a message is user-facing, default to
Hungarian.

---

# 1 · Identity

- **Project name**: `ng-openapi-gen` (EggProject fork)
- **Slug**: `ng-openapi-gen`
- **Purpose**: An OpenAPI 3.0 / 3.1 code generator for Angular 22+. Forked
  from `cyclosproject/ng-openapi-gen` for internal use / customization.
- **Repository URL (local fork)**: `git@github.com:EggProject/ng-openapi-gen.git`
- **Upstream repository URL**: `https://github.com/cyclosproject/ng-openapi-gen`
- **Primary language**: TypeScript
- **License**: MIT (inherited from upstream)

# 2 · Stack

- **Runtime**: Node 24 (`@types/node ^24.9.0` pinned in devDeps; Angular 22
  minimum `^24.15.0` tracked in research; not bumped per user direction — Node
  version stays on the currently-installed 24.9+ devDep range)
- **TypeScript**: `~6.0.3`
- **Package manager**: npm (`package-lock.json` present; no `pnpm-lock.yaml`
  / `bun.lockb` / `yarn.lock`)
- **Framework(s)**: Angular 22+ peer (generator target), Angular CLI not
  required at build time. Reference the targeted CLI version with
  `npx -p @angular/cli@^22.0.0 -- ng version`.
- **Database**: none (pure code generator; consumes OpenAPI specs at
  build-time)
- **Deployment target**: npm registry (the package is published via the
  `compile` script which copies `LICENSE`, `README.md`, `templates/`,
  `ng-openapi-gen-schema.json` into `dist/`)
- **CI**: GitHub Actions (`.github/` directory present; not yet inventoried
  in detail — see §8)

# 3 · Repository layout

```
ng-openapi-gen/
├── .github/                       # CI workflows (inventory pending)
├── .vscode/                       # Editor config
├── eslint.config.mjs              # ESLint 9 flat config (strict TS)
├── lib/                           # Source code (generator core, ~26 .ts files)
│   ├── index.js                   # CLI entry (compiled)
│   └── ...
├── scripts/
│   └── prepare-dist-package.js    # npm-publish packaging helper
├── templates/                     # Handlebars templates for generated client code
│   └── ...                        # ~24 templates (model, service, etc.)
├── test/                          # vitest suite (snapshot + integration tests)
│   └── ...                        # ~89 test files
├── ng-openapi-gen-schema.json     # JSON schema for the config file
├── package.json                   # v1.0.5
├── package-lock.json
├── tsconfig.json                  # Base TS config
├── tsconfig.build.json            # Build-only TS config (excludes test/)
├── vitest.config.ts               # Test runner config
├── README.md                      # User-facing docs (17KB, English)
├── LICENSE                        # MIT
└── AGENTS.md                      # This file
```

> Note: the canonical `docs/adr/`, `.research/`, `.worktrees/` directories
> from the `new-hermes-project` skill are **not yet created** — they are
> reserved for the next orchestrator session that scaffolds Hermes-side
> housekeeping (suggested triage card: `bootstrap-husky-folder-layout`).

# 4 · Commands

| Action | Command |
|---|---|
| Install deps | `npm ci` |
| Start dev (watch tests) | `npm run test:watch` |
| Run unit + integration tests | `npm test` |
| Run E2E tests | not configured (generator has no UI; coverage is via `test/`) |
| Lint | `npm run lint` (runs ESLint over `lib/**` and `test/*.ts`) |
| Type-check (build) | `npm run compile` (runs `tsc --project tsconfig.build.json`) |
| Build (full) | `npm run build` (= lint + compile + test) |
| Migrations | n/a (no database) |

# 5 · Linting — STRICT

- **Strictness profile**: ESLint 9 flat config with
  `@typescript-eslint/eslint-plugin` + `eslint-plugin-jsdoc`. Config at
  `eslint.config.mjs` (1.9 KB).
- **Zero-warning policy**: yes (`npm run build` runs lint first; any error
  blocks the build).
- **Exempt rules**: TBD — first PR reviews the rule set and proposes a
  documented exemption list if anything in the existing code conflicts.
- **Banned patterns**: TBD on first PR (researcher fills from evidence).
- **Complexity caps**: cyclomatic ≤ 10, function ≤ 50 lines, file ≤ 400
  lines (Hermes default; tighten if reviewer finds weaker spots in `lib/`).

# 5.5 · TDD discipline

- **Cycle**: red → green → refactor on every behavior change.
- **Enforcement**: `code-reviewer` profile rejects diffs where the
  production-code commit precedes the failing-test commit on the same
  branch.
- **Exempt files**: `scripts/prepare-dist-package.js` (build-time
  packaging, no testable behavior); generated `dist/` is gitignored.

# 6 · Testing

- **Unit runner**: Vitest 4 (`vitest.config.ts`, `npm test`)
- **Integration runner**: Vitest 4 (same runner, no separate suite)
- **E2E runner**: not applicable — the package is a CLI code generator;
  end-to-end coverage lives under `test/` as snapshot tests of generated
  output. There is no running app to bring up.
- **E2E real-app target**: n/a
- **Coverage target**: statements ≥ 80%, branches ≥ 70% (Hermes default;
  researcher to confirm actual numbers from `vitest --coverage` output).

# 7 · Security

- **Secret provider**: none (the package has no runtime secrets — it
  processes local OpenAPI specs)
- **Auth mechanism**: none
- **CVE scan command**: `npm audit --production` (run before each release)
- **Upstream supply-chain**: this fork SHOULD track upstream dependency
  versions. When bumping a dep version in the fork, the PR description
  should note whether the same version is available upstream; reviewer
  flags unexplained divergence.

# 8–11

To be filled by the `researcher` profile on first scan (CI workflows in
`.github/`, detailed template inventory under `templates/`, exact vitest
configuration, snapshot-test mechanics under `test/`).

# 13 · Kanban board conventions

- **Board slug**: `ng-openapi-gen` (per-project board under
  `~/.hermes/kanban/boards/ng-openapi-gen/`)
- **Card tags**: `project:ng-openapi-gen`, `phase:<discovery|plan|orchestrate|build|review|ship>`,
  `stack:node-cli`, `priority:<Pn>`, `fork:true`.

# 14 · HITL contract

- **Tool-approval policy**: strict.
- **Reflexion iteration cap**: 3 (planner ⇄ plan-reviewer).
- **Mandatory HITL gates**: plan approval, ship approval, any
  `security-auditor: vulnerable`, any PR that touches the fork-flag /
  upstream-sync checklist.

---

## ⚠️ 15 · Documentation-update discipline (MANDATORY — blocks PR)

**Every code change MUST trigger a documentation audit.** The
`code-reviewer` profile treats the following as automatic request-changes:

| File scope | When it MUST be updated |
|---|---|
| `AGENTS.md` (this file) | When any §0–§14 fact becomes stale: stack, commands, lint rules, TDD exemptions, security policy, board conventions, fork-flag policy. |
| Every `README*.md` in the repo (root + any future `lib/README*`, `templates/README*`, etc.) | When new CLI flag, new config option, new generated-code behavior, breaking change, or migration step is added. |
| Every `docs/*.md` (when the `docs/` directory is created) | When an architectural decision, ADR, or design rationale changes. |

### Reviewer checklist (must be visible in the PR description)

```
- [ ] For release / refactor / security PRs: manual upstream-browse note included in the PR description
- [ ] README.md updated (if user-facing behavior changed)
- [ ] AGENTS.md updated (if any §0–§14 fact changed)
- [ ] Any docs/*.md updated (if applicable)
- [ ] npm test passes
- [ ] npm run lint passes
- [ ] npm run compile passes
```

A PR that ships without ticking every relevant box is rejected even if
the code itself is correct.

---

> **Last verified**: 2026-06-30 against commit `a12a41b` (Angular 22 stack-upgrade,
> `wt/t_9a850ac4` branch) on the
> `master` branch of the `EggProject/ng-openapi-gen` fork.