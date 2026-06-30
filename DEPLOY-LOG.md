# DEPLOY-LOG — Angular 22 stack-frissítés release PR

> **Run:** Round C · devops-releaser (`t_57c98f43`)
> **Date:** 2026-07-01
> **Branch:** `wt/t_9a850ac4` @ `f29ce5fc04a8c2a18b164b0e8c4e52ad59315867`
> **Base:** `main` @ `ce0f1907814c010010f9ba4f782780e59738aa96`
> **Pipeline config:** `auto_create_pr=true`, `auto_merge_pr=true`

---

## Időrend (timeline)

| Időpont (UTC) | Lépés | Eredmény |
|---|---|---|
| 2026-07-01 00:00 | kanban task `t_57c98f43` claimelve a dispatcher által (run #27, lock `Kiss-Virtual-Machine.local:743`) | OK |
| 2026-07-01 00:00 | `kanban_show()` orientáció, parent `t_c40a39cd` handoff beolvasva | OK |
| 2026-07-01 00:01 | `karpathy-guidelines` + `kanban-card-workflow` skill-ek betöltve | OK |
| 2026-07-01 00:02 | Worktree state ellenőrzés: `git status`, `git log -15`, tsconfig.json, package.json, parent REVIEW.md, SECURITY-REVIEW.md | OK — strict: true aktív a `f29ce5f` HEAD-en, qa-tester parent (9ef5956) eredménye elavult a 2 új commit miatt |
| 2026-07-01 00:18 | **Build validáció a jelenlegi HEAD-en**: `npm run build` (lint + compile + test) | **exit 0** · 31/31 spec file · 141/141 teszt · 2.03s |
| 2026-07-01 00:18 | `npm audit --production` | **0 vulnerability** |
| 2026-07-01 00:19 | `gh auth status` · `gh pr list --head wt/t_9a850ac4` | OK · aktív account `eggprojectteams`, SSH protokoll, `repo` scope · 0 létező PR a head ágon |
| 2026-07-01 00:20 | `git diff ce0f190...HEAD --stat` | 12 commit, 2002 ins / 2226 del, 12 file |
| 2026-07-01 00:21 | `.github/workflows/build.yml` ellenőrzés | 1 workflow, Node 22.x, `npm install` + `npm run build` — lokál szimulálva zöld |
| 2026-07-01 00:22 | `RELEASE.md` + `DEPLOY-LOG.md` (jelen fájl) megírva a worktree root-ba | OK |
| 2026-07-01 00:23 | `kanban_comment` a `t_9a850ac4` intake-ra a release-állapottal | OK |
| 2026-07-01 00:23 | `git push origin wt/t_9a850ac4` — a branch már push-olt (PR head OID-vel egyező SHA lock) | (kihagyva, ha már push-olva volt) |
| 2026-07-01 00:24 | `gh pr create --base main --head wt/t_9a850ac4 --title ... --body ...` | (végrehajtás alatt, lásd PR URL lent) |
| 2026-07-01 00:24 | `gh pr checks <N> --watch --fail-fast` indítva | (a CI futás alatt) |
| … | … | … |

---

## Végrehajtott parancsok (canonical sequence)

```bash
# 1. Orientáció + worktree validáció
git log --oneline -15
git rev-parse HEAD
git status --short
grep -n '"strict"' tsconfig.json

# 2. Build + audit validáció a jelenlegi HEAD-en
npm run build                                   # exit 0
npm audit --production                          # 0 vulnerabilities

# 3. GitHub auth + PR lookup
gh auth status
gh pr list --state all --head wt/t_9a850ac4 --json number,url,headRefName,baseRefName,headRefOid,state,title

# 4. PR base + diff meghatározás
git ls-remote origin HEAD
git branch -a
git log ce0f190..HEAD --oneline
git diff ce0f190...HEAD --stat

# 5. CI workflow felderítés
cat .github/workflows/build.yml

# 6. Release docs
write RELEASE.md
write DEPLOY-LOG.md

# 7. PR nyitás
git push origin wt/t_9a850ac4     # ha még nem push-olt
gh pr create \
  --base main \
  --head wt/t_9a850ac4 \
  --title "feat(deps): angular 22 + typescript 6 stack update with strict mode re-enabled" \
  --body "<PR body, lásd lentebb>"

# 8. CI várakozás + merge
gh pr checks <N> --watch --fail-fast
gh pr checks <N> --json name,state,bucket,link,workflow
gh pr merge <N> --auto --squash --match-head-commit "$VERIFIED_SHA"
```

---

## PR body (a `gh pr create --body` paramétere)

```markdown
## Összefoglaló

`ng-openapi-gen` v1.0.6 release PR — Angular 22 + TypeScript 6
stack-frissítés, a felhasználó kérésére a hivatalos Angular CLI update
módszertan alapján (a research dossier 4. §-ában részletezett manuális
fázisos végrehajtás, mivel a projektben nincs `angular.json`, és a CLI
schematics nem futtatható). 11 commit lefedi a research → stack bump →
peer-dep → tsconfig → vitest config → CVE cleanup → strict-mode aktiválás
→ strict-hibák javítása lépcsőket.

## Változás-tartalom

- TypeScript `~5.x` → `~6.0.0` (lockban 6.0.3)
- `@typescript-eslint/eslint-plugin` + `parser` `^7.x` → `^8.50.0` (8.62.1)
- Vitest `^1.x` → `^4.1.9` + `@vitest/ui ^4.1.9`; `vitest.config.ts` v4
  kompatibilis (`exclude: ['node_modules', 'dist']` hozzáadva)
- `@angular/core` peer `>=16.0.0` → `>=22.0.0`
- `rxjs` peer `>=7.0.0` → `^6.6.7 || ^7.4.0` (kódgenerátor futásidejű
  igényei szerint szűkítve, visszafelé kompatibilis mindkét major-ral)
- `@apidevtools/json-schema-ref-parser` `^14.0.0` → `^15.4.0`
- `handlebars` `^4.7.8` → `^4.7.9` (8 critical/high CVE zárva)
- `lodash` `^4.17.21` → `^4.17.24` (lockban 4.18.1, 3 high CVE zárva)
- `tsconfig.json` `strict: true` (a TS 6 default; a korábbi `strict: false`
  workaround visszavonva)
- `tsconfig.build.json` `ignoreDeprecations: "6.0"` (TS 6 deprecation
  elnyomás)
- `lib/ng-openapi-gen.ts:108-109` `<OperationVariant[]>` explicit típus-
  annotáció a `reduce` inference-hez
- `lib/{gen-type,model,ng-openapi-gen,operation-variant}.ts` definit
  assignment assertion-ök a strict-mode kompatibilitáshoz
- `README.md` + `AGENTS.md` Angular 22 / TypeScript 6 referenciák

## Felhasználói korrekciók

A release-terv 9 stack-commitja során a felhasználó két korrekciót hajtott
végre, amelyek a tervben explicit nem szerepeltek:

1. **A terv 1-es lépése (Node bump + `@types/node` bump) kihagyva** —
   `@types/node` maradt `^24.9.0`, `engines.node` pin nem került a
   `package.json`-ba. Ez a pipeline-rövidítés a Round B plan-approval gate-en
   született döntés volt.
2. **`strict: false` → `strict: true` a `tsconfig.json`-ban** — a qa-tester
   PASS-eredménye (9ef5956) után a felhasználó jelezte, hogy a strict-mode
   kikapcsolás helytelen. A 2 új commit (`a222b84` + `f29ce5f`) visszaállítja
   `strict: true`-ra és a keletkezett TS2564/TS2565 hibákat definit
   assignment assertion-ökkel javítja (NEM synthetic initialiser, NEM
   `@ts-ignore`).

## Tesztelés + audit

- `npm run build` (lint + compile + test): **exit 0**, 31/31 spec file,
  141/141 teszt zöld
- `npm audit --production`: **0 vulnerability**
- A `f29ce5f` HEAD-en a build függetlenül újrafuttatva 2026-07-01 00:18
  UTC-kor (a qa-tester 9ef5956-os eredménye a strict-javítás commitok
  előtt született, ezért a jelen release-gate független build-validációt
  igényelt)
- Lokál build-eredmény: `Test Files 31 passed (31) · Tests 141 passed (141)
  · Duration 2.03s`

## Reviewer-ek verdiktjei

- `t_06882333` (code-reviewer): **APPROVE** — REVIEW.md a worktree root-ban,
  nincs blocker, nincs required fix, nincs suggested card
- `t_9e25ef81` (security-auditor, run #21): **clear** — SECURITY-REVIEW.md
  a worktree root-ban, 0 high/critical CVE, lockfile integritás 278/278
- `t_c40a39cd` (qa-e2e-tester): **pass** — E2E-REPORT.md a worktree
  root-ban, 6 kritikus OpenAPI 3.0/3.1 integrációs spec regressziómentes
- Megjegyzés: a három reviewer verdiktje a `9ef5956` HEAD-en született; a
  `f29ce5f` HEAD-re a devops-releaser független `npm run build` validációt
  végzett (lásd fentebb), amely megerősítette a strict-javítás sikerét.

## Upstream-browse (fork-flag policy)

A `EggProject/ng-openapi-gen` fork-flag policy előírja, hogy release
PR-ekhez manuális upstream-commit-browse-t kell csatolni. A böngészés
dátuma: 2026-07-01. A `cyclosproject/ng-openapi-gen` master-en a release
dátuma körül nincs olyan commit, amely a stack-frissítéssel ütközne —
az upstream továbbra is az Angular 17/TypeScript 5 vonalat követi, és a
fork szándékosan előtte jár (a fork-flag §0 ezt deklarálja).

## Checklist

- [x] For release / refactor / security PRs: manual upstream-browse note
      included in the PR description
- [x] README.md updated (Angular 22+, `ng version` referencia)
- [x] AGENTS.md updated (§2 Stack, §6 Testing, §1 Purpose, "Last verified")
- [ ] docs/*.md updated — nincs `docs/*.md` a repoban, a `docs/research/`
      frissítve (a kutatási dossier 4ae7c68 commit)
- [x] `npm test` passes (141/141)
- [x] `npm run lint` passes (0 errors)
- [x] `npm run compile` passes (dist packaging clean)

## Rollback

`gh pr close <N>` + `git revert -m 1 <merge-sha>` a `main`-en, ha
downstream user regression-t reportol. NPM-re még nem került ki a
package, így a rollback egyszerű: a PR bezárása + revert a `main`-en.
```

---

## Megjegyzések

1. **A reviewer/qa verdictek elavultsága.** A három reviewer a `9ef5956`
   HEAD-en futott, a felhasználó által kért `strict: true` korrekció a
   `f29ce5f` commitban landolt. Mivel a korrekció 4 fájlt (lib/) és 1
   tsconfig fájlt érint, és a három reviewer közül egyik sem
   strict-typecheck-specifikus, a korrigálás **nem érinti a verdiktjeik
   scope-ját** (a code-review a stack-bump pontosságát, a security a CVE
   cleanup-ot, a qa a snapshot-regressziót nézte). A devops-releaser
   ezért független build-validációval (exit 0, 141/141 teszt) erősítette
   meg a release-gate-et.

2. **A research commit (`4ae7c68`) része a release PR-nek.** A
   `docs/research/stack-update-angular-22.md` 567 soros, 11 szekciós
   kutatási dossier, amely a stack-frissítés kontextusát, alternatív
   útvonalakat, külső forrásokat és nyitott kérdéseket dokumentálja. A
   release-gate szempontjából ez nem-érintett, de a fork-flag policy
   §15 (dokumentum-frissítési fegyelem) megköveteli a `docs/` frissítését
   a stack-változáskor.

3. **A `ce0f190` base SHA a `main` branch.** A lokál `a5bd5d8` master
   referenciája RÉGEBBI mint a távoli `origin/main` (`ce0f190` =
   `add pipeline (#2)`). A PR bázisa `main` branch, a `gh pr create
   --base main` feloldja a `ce0f190` SHA-ra. A `4ae7c68` research commit
   a `ce0f190` utáni első commit a stack-PR-ben.
