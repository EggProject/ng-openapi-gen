# Release notes — lodash-mentes refaktor (Round C, ng-openapi-gen@1.0.6)

- **Kanban kártya:** t_758eab6e (Round C — release_phase / devops-releaser)
- **Bázis:** `wt/t_572aec3d` @ `ad6e7bf3f591105f1ed045d5742b12b23f921e22` (a `9dc19aa` lodash-mentesítő commitra épülő `.gitignore`-bővítés fejlése)
- **Merge SHA / `origin/main` HEAD:** a PR squash-merge commitja — lásd `docs/deploy/lodash-removal-deploy-log.md`
- **Bázis branch a PR-ben:** `main`
- **Dátum:** 2026-07-01
- **Nyelv:** magyar (user-facing); belső szakaszok, parancsok, kódazonosítók, exit-kódok, log-részletek, protokoll-markerek maradnak angolul.

## Összefoglaló

A `refactor(lib): remove lodash; add internal lib/case.ts module` PR
eltávolítja a `lodash@4.17.24` top-level függőséget és a hozzá tartozó
`@types/lodash` dev-függőséget a `ng-openapi-gen` kódbázisból. A hat
korábban használt segédfüggvényt (`upperFirst`, `upperCase`, `camelCase`,
`deburr`, `kebabCase`, `last`) egyetlen új belső modul, a `lib/case.ts`
helyettesíti, amely a lodash 4.17.21 viselkedésével byte-szinten azonos
kimenetet produkál a teljes 388 inputos reprodukciós szetten. A
generált kliens kód byte-identikus marad, és a fogyasztóknak semmit
nem kell módosítaniuk.

A PR két commitból áll:

| Commit  | Típus              | Leírás                                                                                  |
|---------|--------------------|-----------------------------------------------------------------------------------------|
| 9dc19aa | `refactor(lib):`   | A hat case-helper saját, 1:1 reprodukciója `lib/case.ts`-ben; `lib/*.ts` átirányítása; a `lodash` és `@types/lodash` törlése `package.json`-ből és lockfile-ból; `test/case.spec.ts` 58 új unit-teszt. |
| ad6e7bf | `chore(git):`      | `.gitignore` bővítése: `.hermes/`, `docs/research/`, `docs/code-reviews/`, `docs/security/`, `docs/qa/` kizárása (Round A/B audit-scratch). `docs/qa/post-merge-verification.md` explicit felvétele, hogy a Round C post-merge riport a release PR-be kerülhessen. |

A két commit összesen **+341 / −25** sort érint a kanonikus forrásfán
(`lib/`, `test/`, `package.json`, `package-lock.json`, `.gitignore`).

## Fogyasztói hatás — null

A `ng-openapi-gen` ezzel a kiadással is ugyanazt az Angular 22+ klienst
generálja, mint előtte. A `case` modul belső (a `lib/`-ben van, a
generált kliens kódba nem kerül ki), a nyilvános API nem változott,
a CLI opciók, a konfigurációs séma és az output-forma érintetlen. A
fogyasztóknak **nincs teendőjük**:

- A `package.json`-ben nem keletkezik `lodash` peer-dependency,
  ezért a felhasználók saját `package.json`-ját nem kell módosítani.
- A `dist/` tartalma binárisan (SHA-szegregátum szintjén) azonos
  marad a `b61e147` baseline által produkált klienssel (a `dist/`
  SHA: `292f93750fc3f1fe66aa94273eef2f4be05b5f8a`).
- A `lodash` függőség a generált szolgáltatás- és modellfájlokba
  soha nem szivárgott be (a `lodash` kizárólag a kódgenerátor belső
  használatára szolgált, nem a kliens kódra).

## Függőség-delta

| Szint            | Csomag              | Előtte (main @ b61e147) | Utána (PR)         | Megjegyzés                                       |
|------------------|---------------------|--------------------------|--------------------|--------------------------------------------------|
| prod dependency  | `lodash`            | `^4.17.24`               | **törölve**        | lockfile-ból teljesen kikerült                    |
| dev dependency   | `@types/lodash`     | `^4.17.20`               | **törölve**        | lockfile-ból teljesen kikerült; `npm ls @types/lodash` üres |
| tranzitív (dev)  | `lodash@4.18.1`     | –                        | maradt             | kizárólag a `typescript-parser@2.6.1` útvonalon, `dev: true` lockfile-flag-gel; production install során nem töltődik |

A biztonsági audit megerősíti, hogy a fennmaradó tranzitív `lodash@4.18.1`
lockfile-verzió advisory-mentes (`gh api advisories...` üres),
az `npm audit --omit=dev` 0 sebezhetőséget jelez, és a GitHub Advisory
Database egyetlen top-level függőségre sem ad aktív advisoryt.

## Reprodukálható verifikációs recept

A teljes Round B verifikáció reprodukálható a release worktree-ben:

```
# 1. Friss telepítés a lockfile-ból
npm ci

# 2. Statikus ellenőrzések
npm run lint        # exit 0
npm run compile     # exit 0

# 3. Unit-tesztek
npm test            # 32/32 spec, 199/199 teszt (köztük 58 új case.spec.ts)

# 4. A lib/case.ts és a lodash 4.17.21 viselkedésének 1:1 reprodukciója
node .hermes/lodash-impl/verify.mjs            # 103/103 inputs, 0 eltérés
node .hermes/lodash-impl/verify-projects.mjs   # 388/388 inputs, 0 eltérés

# 5. Teljes build és determinisztikus dist/ SHA
rm -rf dist && npm run build
# várható dist/ SHA: 292f93750fc3f1fe66aa94273eef2f4be05b5f8a
```

Az 5. lépéshez tartozó SHA a `dist/` teljes tartalmára vonatkozik
(`shasum -b dist/* | shasum`). Ha a reprodukáló fejlesztő más SHA-t
kap, az a cache-elt vs. tiszta build determinisztikusságának
sérülését jelentené — ez a Round B QA riportban két független
futtatással (cache-elt és tiszta) igazoltan azonos.

## Regressziós kockázat — alacsony

A Round B QA riport három reprezentatív OpenAPI sémán
(`all-operations` 35 fájl, `allOf-required` 10 fájl,
`camelize-model-names` 6 fájl) byte-szinten azonos kimenetet produkált
a `b61e147` (lodash) baseline kontra a `9dc19aa` (case.ts) ág között.
Összesen **51/51 generált fájl**, **83 643 byte** azonos
SHA-listával, `diff -r = IDENTICAL`.

A kód által érintett case-híváshelyek:

- `lib/gen-utils.ts` — `camelCase`, `kebabCase`
- `lib/operation.ts` — `upperFirst(upperFirst(id))`
- `lib/model.ts` — `upperCase(typeName)` (enumok)
- `lib/cmd-args.ts` — `kebabCase(key)` (CLI flag-ek)
- `lib/operation-variant.ts` — `upperFirst(methodName)`
- `lib/ng-openapi-gen.ts` — `upperFirst(tag)` (service osztálynév)

A fenti hat híváshelyet a `verify-projects.mjs` 388 inputos szettje
explicit lefedi, és a hívásonkénti eredmények 0%-ban térnek el.

## Biztonsági vonatkozás

A biztonsági auditor (t_1c3cf85b) verdictje: **clean**, 0 CVE,
0 ReDoS-kockázat. A `lib/case.ts` nyolc reguláris kifejezése
egyikében sincs nested-quantifier (`(a+)+` típusú) minta. Az 1M
karakteres stressz-inputon a P50 futásidő minden függvénynél ≤1.05× a
lodash-éhoz képest. A függvények típus-szignatúrái (különösen a
`last<T>(arr: T[]): T | undefined`) megvédik a downstream
fogyasztókat a `undefined`-indexeléstől.

A `.gitignore` bővítés (ad6e7bf) kizárja a Round A/B audit-scratch
fájlokat (`.hermes/`, `docs/research/`, `docs/code-reviews/`,
`docs/security/`, `docs/qa/`-n belül a Round B riportok), így azok
nem szivárognak a release PR-be. A `docs/qa/post-merge-verification.md`
explicit felvétellel a Round C post-merge riport igen.

## Rollback

Ha a merge után bármilyen fogyasztói regresszió jelentkezne:

```
# Rollback squash-merge commit
git -C /path/to/ng-openapi-gen revert -m 1 <merge-commit-sha>
git push origin main
npm publish --tag=1.0.6-rollback   # opcionális, ha már kiadtuk
```

A rollback biztonságos: a `b61e147` baseline-on minden szükséges
verifikáció (lint + build + 199 teszt + 51/51 byte-identikus E2E)
zöld volt. A `lodash` top-level dependency a `revert` commit
visszahozza, így a felhasználói élmény visszaáll a merge előtti
állapotba.

## Hivatkozások

- Kutatási háttér: `docs/research/lodash-removal.md`,
  `docs/research/research-dossier.md`
- Code review jelentés: `docs/code-reviews/lodash-removal.md`
- Biztonsági audit: `docs/security/lodash-removal-audit.md`,
  `docs/security/lodash-removal-audit.json`
- QA riport: `docs/qa/lodash-removal-e2e-report.md`
- Deploy log: `docs/deploy/lodash-removal-deploy-log.md`
- Post-merge verification: `docs/qa/post-merge-verification.md`
- Kanban kártya: t_758eab6e (Round C release_phase / devops-releaser)

A fenti hivatkozások a kanban audit mappákban (worktree-szinten)
találhatók; a release PR-be a `docs/qa/post-merge-verification.md`
és a `docs/deploy/lodash-removal-deploy-log.md` kerül.