# RELEASE — Dependency refresh · PR-delivery

> **Release type:** package release PR (npm package `ng-openapi-gen`, version bump: **none** — patch/minor dep refresh, no API/surface change)
> **Branch:** `wt/t_865e998e` @ `570541d6995231e51a717499c29bdf0ea100f2c8`
> **Base:** `main` @ `b61e1473dbb4c976f41dd28f63d02a799a55be79` (`feat(deps): angular 22 + typescript 6 stack update with strict mode re-enabled (#3)`)
> **Pipeline config:** `auto_create_pr=true`, `auto_merge_pr=true`
> **CI:** `.github/workflows/build.yml` (Node 22.x · `npm install` · `npm run build`)
> **Date:** 2026-07-01

---

## Összoglaló

A `docs/research/research-dossier.md` (t_d96bbf39) által azonosított 6 alacsony
kockázatú frissítési lehetőségből 5 elfogadott, 1 elhalasztott:

| # | Csomag | Régi → Új | Típus |
|---|---|---|---|
| 1 | `replace-in-file` (devDep) | `^8.3.0` → **törölve** | holt függőség eltávolítása + 14 tranzitív dropout |
| 2 | `lodash` (dep) | `^4.17.24` → `^4.18.1` | pinning-konzisztencia (a lock már most is 4.18.1-et tartalmaz) |
| 3 | `@types/lodash` (devDep) | `^4.17.20` → `^4.17.24` | patch×4 |
| 4 | `fs-extra` (dep) | `^11.3.2` → `^11.3.6` | patch×3 |
| 5 | `@types/node` (devDep) | `^24.9.0` → `^24.10.0` (feloldva: 24.13.2) | minor×1 |

A 6. ajánlott frissítés (`replace-in-file` 8.3.0→8.4.0 minor) az 1. pont
eltávolításával együtt elesett — nincs értelme egy nem-létező csomagot
„frissíteni".

A release-gate minden feltétele teljesül:

| Feltétel | Eredmény |
|---|---|
| `npm run build` exit 0 (lint + compile + 141/141 test) | zöld · 2026-07-01 01:01 UTC |
| `npm audit --production` | 0 vulnerability |
| `@types/node ^24.10.0` (feloldva 24.13.2) | TS-strict kompatibilis, nincs regresszió |
| Lockfile integritás | 229 csomag, 0 foreign-registry entry |
| `peerDependencies` változatlan | `@angular/core >=22.0.0`, `rxjs ^6.6.7 \|\| ^7.4.0` |
| Reviewer-verdikt (t_92dac5cc) | `approved` — 0 blocker, 0 required fix |
| Security-verdikt (t_ac849bd9) | `clear` — 0 CVE, 0 downgrade, 0 deferred-drift |
| QA-verdikt (t_6473b602) | `pass` — 8/8 lépés, 141/141 teszt, ~1.85s |

---

## Commit-lista (3 commit, `b61e147..570541d`)

| # | SHA | Üzenet |
|---|---|---|
| 1 | `e05375d` | `chore(deps): remove unused replace-in-file devDependency` |
| 2 | `9e35a3a` | `fix(deps): update lodash and @types/lodash declarations to match lockfile` |
| 3 | `570541d` | `chore(deps): bump fs-extra and @types/node within minor` |
| 4 | (PR-side) | `docs(release): RELEASE.md and DEPLOY-LOG.md for dependency refresh` |

A release-docs commit (4.) kizárólag markdown fájlokat ad hozzá, a reviewer
verdiktek scope-ját nem érinti — a qa-tester (t_6473b602) és a security-auditor
(t_ac849bd9) verdiktje a 3. commiton (`570541d`) született, és a build-eredmény
továbbra is zöld.

---

## Változás-statisztika

```
 2 files changed (package.json + package-lock.json), 34 insertions(+), 493 deletions(-)
```

A `package-lock.json` diff 518 soros, amelynek túlnyomó része a `replace-in-file`
eltávolításakor kieső 14 tranzitív csomag (`chalk@4`, `string-width`,
`strip-ansi@6`, `ansi-regex@4`, `ansi-styles@4`, `color-convert`,
`color-name`, `is-fullwidth-code-point`, `lodash@4` klón, `p-limit@2`,
`p-try@2`, `yocto-queue`); a fennmaradó rész a 4 verzió-bump
tranzitív feloldása.

A `package.json` diff 5 tényleges sort érint (1 törlés + 4 csere), 0 új
import/függőség bevezetése.

---

## Risk + blast radius

A release egy **npm-package source PR**, nem production deploy. Nincs futó
szolgáltatás, nincs SLO, nincs on-call rotáció. A blast radius:

- A `ng-openapi-gen` package fogyasztói downstream Angular alkalmazások,
  akik a kódgenerátort build-time eszközként használják. A függőség-változások
  kizárólag patch/minor szintűek, és egyik sem érint publikus API-t vagy
  kódgenerátor-kimenetet.
- A `replace-in-file` eltávolítása 0 fogyasztói hatással jár — a csomag holt
  függőség volt (sehol nem használta a kódgenerátor kódja).
- A `lodash` 4.18.1-re frissítés pinning-konzisztencia: a `package-lock.json`
  már a 4.18.1-et tartalmazta, csak a `package.json` deklaráció nem követte.
  A `npm install` nem változtatja meg a feloldott verziót, csak a caret
  tartomány alsó határát emeli 4.17.24-ről 4.18.1-re.
- A `fs-extra` 11.3.6 és a `@types/node` 24.13.2 csak a *types* csomagokra
  vonatkoznak, a futtató Node a saját telepítés.

Rollback: `gh pr close <N>` + `git revert -m 1 <merge-sha>` a `main`-en, ha
a downstream felhasználó regressziót jelez. NPM-re nem került ki újabb
verzió (a `package.json` verziója nem változott: maradt `1.0.5`).

---

## Elhalasztott karbantartási figyelmeztetések (out of scope)

A research dossier §4 azonosított 3 olyan csomagot, amelyek karbantartási
problémát jeleznek, de a jelen PR scope-ját meghaladják. Ezek a jövőbeli
security-sprint-ben kerülnek felülvizsgálatra:

1. **`typescript-parser@2.6.1`** — utolsó release 2018. augusztus 31.,
   `typescript: ^3.0.3` függőséggel. Valószínűleg inkompatibilis a TS 6-tal.
2. **`ncp@2.0.0`** — utolsó release 2014-ből, karbantartatlan. A `compile`
   script 4 db `ncp`-hívása refaktorolható natív `fs.cp`-re (Node 22+) —
   script-refaktor, nem verzió-emelés.
3. **`@apidevtools/json-schema-ref-parser`** — ESM/CJS bridge probléma,
   downstream refaktor-ciklus szükséges.

A security-auditor (t_ac849bd9) verdictje ezeket a `deferred register`-en
tartja, a jelen PR scope-ját nem érintik.

---

## Rollback (one-liner)

```bash
# A release PR merge után:
git checkout main && git pull origin main
git revert -m 1 <merge-sha>
git push origin main
```

A `package.json` verziója nem változott (maradt `1.0.5`), így NPM-re nem
került ki új kiadás — a rollback kimerül a PR bezárásában + a `main`-en
egy revert commitban.

---

## Observability (post-merge ellenőrzés, első 24h)

A repo nem futtat production szolgáltatást, így a klasszikus SLO/Grafana
metrikák nem relevánsak. A post-merge megfigyelési checklist:

1. **GitHub Actions tab** — a `build` workflow zöld-e a `main` push-ra
   (a release PR merge egy push a `main` branchre, ami triggerel).
2. **npm registry** — nem triggerelődik publish (nincs `.github/workflows/publish.yml`,
   a `package.json` verziója nem változott), így a `https://www.npmjs.com/package/ng-openapi-gen`
   nem frissül.
3. **Downstream user issue-k** — a GitHub Issues-ban a merge-t követő 24h-ban
   figyelni kell a `fs-extra` 11.3.6 vagy `@types/node` 24.13.2 kapcsán
   beérkező regresszió-jelentéseket. A security-auditor nem jelzett ismert
   inkompatibilitást, és a lokális build zöld.

A post-merge watch window: **24h**. Ha 24h-n belül nincs user-reported
regresszió, a release sikeresnek tekintendő.

---

## Fogyasztói migrációs lépések (release notes, publikus)

```markdown
## ng-openapi-gen 1.0.5 · Függőség-frissítés (patch/minor)

### Nincs törő változás
Ez egy kizárólag belső függőség-frissítés; a kódgenerátor kimenete és a
publikus API nem változott. A `package.json` verziója nem emelkedett.

### Belső karbantartás
- A `lodash` deklaráció mostantól `^4.18.1`-re szinkronban a lockfile
  feloldásával (korábban `^4.17.24` volt deklarálva, miközben a lock 4.18.1-et
  tartalmazott).
- A `fs-extra` 11.3.2 → 11.3.6 (patch×3, nincs API-változás).
- A `@types/lodash` 4.17.20 → 4.17.24 (patch×4).
- A `@types/node` 24.9.0 → 24.10.0 (feloldva 24.13.2; nincs TS-strict regresszió).
- A holt `replace-in-file` devDependency eltávolítva — sehol nem használta
  a kódgenerátor; 14 tranzitív csomag is kiesett.

### Ismert, de elhalasztott karbantartási feladatok
- `typescript-parser` 2018-as utolsó release, TS 6 inkompatibilitás valószínű
- `ncp` 2014-es utolsó release, natív `fs.cp` migráció tervben
- `@apidevtools/json-schema-ref-parser` ESM/CJS bridge, downstream refaktor
```

---

## Hitelesített HEAD + aláírás

- **Verified head SHA:** `570541d6995231e51a717499c29bdf0ea100f2c8`
- **Verified branch:** `wt/t_865e998e`
- **Verified base SHA:** `b61e1473dbb4c976f41dd28f63d02a799a55be79` (`main`)
- **Lockfile resolved:** `lodash 4.18.1`, `fs-extra 11.3.6`, `@types/node 24.13.2`,
  `@types/lodash 4.17.24` (229 csomag, 0 foreign-registry entry)
- **Local build verified:** 2026-07-01 01:01 UTC, exit 0, 31/31 spec file,
  141/141 teszt, ~1.85s
- **npm audit --production:** 0 vulnerability
- **CI workflow:** `.github/workflows/build.yml` (Node 22.x · `npm install` ·
  `npm run build`)