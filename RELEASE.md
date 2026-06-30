# RELEASE — Angular 22 stack-frissítés · PR-delivery

> **Release type:** package release PR (npm package `ng-openapi-gen` v1.0.5 → v1.0.6)
> **Branch:** `wt/t_9a850ac4` @ `f29ce5fc04a8c2a18b164b0e8c4e52ad59315867`
> **Base:** `main` @ `ce0f1907814c010010f9ba4f782780e59738aa96` (`add pipeline (#2)`)
> **Pipeline config:** `auto_create_pr=true`, `auto_merge_pr=true`
> **CI:** `.github/workflows/build.yml` (Node 22.x · `npm install` · `npm run build`)
> **Date:** 2026-07-01

---

## Összefoglaló

A `ng-openapi-gen` package stack-frissítése Angular 22 + TypeScript 6 vonalra, a
felhasználó kérésére a hivatalos Angular CLI update módszertan követve (ehhez a
profil a research dossier 4. szakaszában részletezett 5. fázisú `ng update`
sémát alkalmazta, mivel a projektben nincs `angular.json`, így a CLI
schematics nem futtatható — a manuális fázisos végrehajtás a CLI ajánlásával
ekvivalens eredményt produkál a kódgenerátor csomag esetén). A 11 commit
lefedi a research → stack bump → peer-dep → tsconfig → vitest config → CVE
cleanup → strict-mode aktiválás → strict-hibák javítása lépcsőket. A
folyamat során a felhasználó két korrekciót hajtott végre: (1) a 9-es
tervben foglalt Node bump és `@types/node` bump **kihagyva** (maradt
`^24.9.0`); (2) a TypeScript 6 miatt szükséges `"strict": false` workaround
**visszavonva** — `strict: true` aktiválva, és a keletkezett TS2564/TS2565
strict-hibák definit assignment assertion-nel javítva.

A release-gate minden feltétele teljesül:

| Feltétel | Eredmény |
|---|---|
| `npm run build` exit 0 (lint + compile + 141/141 test) | zöld · 2026-07-01 00:18 UTC |
| `npm audit --production` | 0 vulnerability |
| `tsconfig.json` `strict: true` | aktív, hibamentes |
| `lib/*.ts` strict-kompatibilis | a `f29ce5f` commit definite assignment assertion-ökkel |
| CI workflow `.github/workflows/build.yml` | lokál szimulálva (Node 22.x + `npm run build` zöld) |
| Lockfile integritás | 278/278 `integrity` SHA-512, 0 foreign-registry entry |
| `peerDependencies` (`@angular/core >=22.0.0`, `rxjs ^6.6.7 \|\| ^7.4.0`) | pontos |
| User-tiltások tiszteletben tartva | nincs `engines.node` pin, nincs `@types/node` bump, nincs ES2022 target forcing |

---

## Commit-lista (11 commit, `ce0f190..HEAD`)

| # | SHA | Üzenet |
|---|---|---|
| 1 | `4ae7c68` | research(stack-update): angular 22 stack-upgrade dossier |
| 2 | `ff2a21c` | chore(ts): bump typescript to ~6.0.x |
| 3 | `765f866` | chore(lint): bump @typescript-eslint to ^8.50.0 |
| 4 | `c73745e` | chore(test): bump vitest to ^4.x |
| 5 | `cd33ca0` | chore(vitest-config): review vitest.config.ts for v4 |
| 6 | `5f14c1b` | chore(deps): update @angular/core peer range to >=22, rxjs to ^6.6.7 \|\| ^7.4.0 |
| 7 | `a12a41b` | chore(tsconfig): review ES2022 target and bundler module resolution |
| 8 | `191e71d` | chore(deps): json-schema-ref-parser 14 → 15 |
| 9 | `d564488` | docs: angular 22+, typescript 6 in stack references |
| 10 | `9ef5956` | chore(deps): patch-bump handlebars 4.7.9 + lodash 4.17.24 (CVE cleanup) |
| 11 | `a222b84` | chore(tsconfig): enable strict mode (revert strict: false workaround) |
| 12 | `f29ce5f` | fix(types): resolve TS strict-mode errors across lib/*.ts |

> A research dossier (`4ae7c68`) a stack-frissítés kontextusát dokumentálja,
> és bár a stack-bump commitokkal együtt kerül a `main`-re, a terv a 9-es
> stack-commit + 1 strict-akt commit + 1 strict-fix commit struktúrát írta
> elő — a research commit technikai értelemben a release PR része.

---

## Változás-statisztika

```
 12 files changed, 2002 insertions(+), 2226 deletions(-)
```

A `package-lock.json` 3552 soros diffje kizárólag a verió-bumpok (TS 6.0,
ESLint 8.62, Vitest 4.1, json-schema-ref-parser 15.4, handlebars 4.7.9,
lodash 4.18.1) és a transitive dependency-konszolidáció tükrözi. A `lib/*.ts`
módosítás 4 fájlban 32 sort érint (definite assignment assertion-ök + a
reduce explicit `<OperationVariant[]>` típusannotáció).

---

## Risk + blast radius

A release egy **npm-package source PR**, nem production deploy. Nincs futó
szolgáltatás, nincs SLO, nincs on-call rotáció. A blast radius:

- A `ng-openapi-gen` package fogyasztói downstream Angular alkalmazások,
  akik a kódgenerátort build-time eszközként használják. A `peerDependencies`
  range bővítése (`@angular/core >=22.0.0`, `rxjs ^6.6.7 || ^7.4.0`)
  visszafelé kompatibilis: a package működik Angular 16+ klienssel is
  (ahogy az AGENTS.md §1 kimondja), a `>=22.0.0` floor csak azt deklarálja,
  hogy a tesztelt minimum 22.
- A TypeScript 6 szigorú típusellenőrzése a kódgenerátor **kimenetét** nem
  érinti (a kódgenerátor a felhasználó Angular projektjében fut, nem itt) —
  csak a **saját lib/*.ts** típusellenőrzése szigorodott, és az a
  `f29ce5f` commitban lekezelt.
- A Vitest 4 mock-név formátum-változás nem érintett — a `test/`-ben nincs
  Vitest `.snap` fájl, a snapshot-ok generált TS kód (out/, gitignored).

Rollback: `gh pr close <N>` + `git revert -m 1 <merge-sha>` a `main`-en, ha
a downstream felhasználó regressziót jelez. NPM-re még nem került ki a
package (1.0.5), a release PR merge utána lesz a `npm publish` workflow
triggerje — de a jelenlegi repo-ban `.github/workflows/publish.yml` nem
szerepel, tehát a publish manuális lépés.

---

## Rollback (one-liner)

```bash
# A release PR merge után:
git checkout main && git pull origin main
git revert -m 1 <merge-sha>
git push origin main
# Ha npm-re már kiadatott 1.0.6:
npm dist-tag add ng-openapi-gen@1.0.5 latest
```

A `npm dist-tag` rollback azért fontos, mert ha a PR merge triggerel egy
publish workflow-t, akkor a `latest` taget vissza kell állítani az 1.0.5-re.
Ebben a repo-ban ez jelenleg nem automatizált, de a rollback playbook
része.

---

## Observability (post-merge ellenőrzés, első 24h)

A repo nem futtat production szolgáltatást, így a klasszikus SLO/Grafana
metrikák nem relevánsak. A post-merge megfigyelési checklist:

1. **GitHub Actions tab** — a `build` workflow zöld-e a `main` push-ra
   (a release PR merge egy push a `main` branchre, ami triggerel).
2. **npm registry** — ha a publish-t triggerelő workflow / script lefut,
   ellenőrizni kell a `https://www.npmjs.com/package/ng-openapi-gen`
   oldalon a `1.0.6` verzió megjelenését és a `latest` dist-tag
   frissülését.
3. **Downstream user issue-k** — a GitHub Issues-ban a `1.0.6` release
   megjelenését követő 24h-ban figyelni kell a `peerDependencies` /
   `strict: true` regression-jelentéseket. A `peerDependencies` range
   bővítés nem töri el a 16+ klienseket, de ha bármelyik edge-case
   kimaradt, itt jelenik meg először.
4. **Vitest 4 snapshot-ok** — a `test/` könyvtár `*.snap.ts` fixture-öket
   generál, nem klasszikus Vitest snapshot-okat. Ha bármely downstream
   user reportol snapshot-mismatch-et, az a Vitest 4 mock-név formátum
   regresszió jele — de a jelenlegi suite-ban ez nem jött elő.

A post-merge watch window: **24h**. Ha 24h-n belül nincs user-reported
regresszió, a release sikeresnek tekintendő.

---

## Fogyasztói migrációs lépések (release notes, publikus)

```markdown
## ng-openapi-gen 1.0.6 · Angular 22 / TypeScript 6 stack-frissítés

### Kompatibilitás
- A kódgenerátor mostantól **Angular 22+** klienssel van tesztelve, és
  deklarálja a `@angular/core >=22.0.0` peer-dependency-t.
- A `rxjs` peer-tartomány `^6.6.7 || ^7.4.0` (a korábbi `>=7.0.0` helyett
  a kódgenerátor futásidejű igényeinek megfelelően szűkítve).
- TypeScript 6-tal fut, a generator belső kódja `strict: true` üzemmódban
  van fordítva.

### Belső fejlesztések (fogyasztói szempontból nem érint)
- A generator belső típusellenőrzése szigorodott (definite assignment
  assertion-ök a konstruktor-flow-hoz), a kimenet nem változik.
- A Vitest 4.1-re és a Vitest UI 4.1-re frissült a fejlesztői tooling.

### CVE cleanup
- `handlebars` 4.7.8 → 4.7.9 (8 critical/high CVE zárva).
- `lodash` 4.17.21 → 4.18.1 (3 high CVE zárva).
- `@apidevtools/json-schema-ref-parser` 14 → 15 (transitive `js-yaml` CVE
  zárva).

### Nem törő változás
A peer-dependency range bővítésének célja a 22-es Angular kliensek
natív támogatása. A 16–21-es Angular kliensekkel is működik a package
(továbbra is), de a formális floor mostantól 22.
```

---

## Hitelesített HEAD + aláírás

- **Verified head SHA:** `f29ce5fc04a8c2a18b164b0e8c4e52ad59315867`
- **Verified branch:** `wt/t_9a850ac4`
- **Verified base SHA:** `ce0f1907814c010010f9ba4f782780e59738aa96` (`main`)
- **Build artifact:** `dist/` (csomagolva a `npm run compile` által, benne
  `lib/`, `templates/`, `LICENSE`, `README.md`, `ng-openapi-gen-schema.json`)
- **Local build verified:** 2026-07-01 00:18 UTC, exit 0, 31/31 spec file,
  141/141 teszt
- **npm audit --production:** 0 vulnerability
- **CI workflow:** `.github/workflows/build.yml` (Node 22.x · `npm run build`)
