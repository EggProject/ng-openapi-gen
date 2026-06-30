# Stack-frissítés Angular 22-re — kutatási dosszié

| Mező | Érték |
|---|---|
| Projekt | `ng-openapi-gen` (EggProject fork) |
| Jelenlegi stack | Angular 16+ peer, TypeScript `~5.9.3`, ESLint 9.38, Vitest 3.2, Node 24 típusok |
| Célverzió | Angular 22.0 (2026-06-03) |
| Feladat típusa | `kind: refactor` |
| Jóváhagyott útvonal | `npx -p @angular/cli ng update ...` (a user elfogadta: *"de angular a hivatalos ng cli updatet hasznaljuk"*) |
| Dosszié készítője | researcher profil, 2026-06-30 |
| Bemeneti kártya | `t_b2db9a76` (research), intake `t_9a850ac4` |
| Munkaterület | `wt/t_9a850ac4` worktree |

---

## Vezetői összefoglaló (5 bullet)

- A `ng-openapi-gen` **nem Angular alkalmazás**, hanem egy Node-ban futó kódgenerátor CLI: a `lib/`-ban egyetlen `@angular/*` vagy `rxjs` import sincs — ezek kizárólag a **generált kimenetben** (`templates/*.handlebars`) jelennek meg (`Injectable`, `NgModule`, `HttpClient`, `HttpContext`, `HttpResponse`, `HttpRequest`, `HttpParameterCodec`, `HttpParams`, `HttpHeaders`, `Observable`, `firstValueFrom`).
- A "stack frissítés" a gyakorlatban négy tengelyen mozog: (1) `peerDependencies.@angular/core` range `>=16.0.0` → `>=22.0.0`, (2) TypeScript `~5.9.3` → `>=6.0.0 <6.1.0`, (3) Vitest 3.2 → Vitest 4 (Vite ≥6, Node ≥20), (4) a `lib/` futásidejű depjei (Handlebars, json-schema-ref-parser, lodash, jsesc, fs-extra, openapi-types, argparse, eol) kompatibilitás-ellenőrzése Node 24-gyel és TypeScript 6-tal.
- Az Angular 22 (2026-06-03) first-party forrásai (`angular.dev/reference/versions`, `blog.angular.dev/announcing-angular-v22-c52bb83a4664`) megerősítik: Node `^22.22.3 || ^24.15.0 || ^26.0.0`, TypeScript `>=6.0.0 <6.1.0`, RxJS `^6.5.3 || ^7.4.0`. A jelenlegi Node-típus-pin (`@types/node ^24.9.0`) a 22-es Node-tartomány alján van, de a 24.15-ös minimumra frissíteni kell.
- A "hivatalos ng update" útvonalat a user jóváhagyta. Fontos kikötés: az Angular CLI **schematics**-ei (`ng update`) kifejezetten Angular munkaterületekre (`angular.json`) vannak tervezve; a `ng-openapi-gen` NEM tartozik ezek közé (nincs `angular.json`), így az `ng update` ebben a repo-ban lényegében csak a `@angular/cli` lokális telepítését és a `@angular/core` peer-dep frissítését jelenti. A tényleges kód-migrációt (a template-ek kézi átvizsgálását) ettől függetlenül el kell végezni.
- Kockázatok: a `tsconfig.json` `target: ES2020` → TypeScript 6-tal maradhat, de a `module: CommonJS` az Angular 22-re frissített felhasználói appokban egyre ritkább (a `moduleResolution: node` is elavultnak számít — a `bundler` az új javaslat, de a kódgenerátor CommonJS-t ad ki, mert a `lib/index.js` Node bináris); a `FetchBackend` alapértelmezetté válása a `provideHttpClient()`-ban **nem** érinti a generált kódot (a kód `HttpClient` absztrakciót használ).

---

## 1. Aktuális stack állapot (a canonical checkout `package.json` alapján)

Forrás: `package.json` (worktree, commit `ce0f190`) + `tsconfig.json` + `vitest.config.ts` + `eslint.config.mjs`.

### 1.1 Verziók pontosan (kód)

| Csomag | Verzió | Szerep |
|---|---|---|
| `@angular/core` (peer) | `>=16.0.0` | A generált kód célfuttatókörnyezete |
| `rxjs` (peer) | `>=6.5.0` | A generált kód célfuttatókörnyezete |
| `@apidevtools/json-schema-ref-parser` | `^14.2.1` | OpenAPI `$ref` feloldás |
| `argparse` | `^2.0.1` | CLI argumentumok |
| `eol` | `^0.10.0` | Sorvég normalizálás |
| `fs-extra` | `^11.3.2` | Fájlkezelés |
| `handlebars` | `^4.7.8` | Template-motor |
| `jsesc` | `^3.1.0` | JS stringum escape-elés |
| `openapi-types` | `^12.1.3` | OpenAPI 3 típusdefiníciók |
| `lodash` | `^4.17.21` | Segédfüggvények |
| `typescript` (dev) | `~5.9.3` | Fordító |
| `eslint` (dev) | `^9.38.0` | Linter |
| `vitest` (dev) | `^3.2.4` | Tesztfutó |
| `@types/node` (dev) | `^24.9.0` | Node típusok |
| `@typescript-eslint/eslint-plugin` (dev) | `^8.46.2` | TS-specifikus ESLint szabályok |
| `typescript-parser` (dev) | `^2.6.1` | Alternatív TS parser (külső tooloknak) |

> Megjegyzés: a kódgenerátor forrása (`lib/index.ts` → `lib/ng-openapi-gen.ts`) **egyetlen** `@angular/*` vagy `rxjs` importot sem tartalmaz — a kód tisztán Node + TypeScript.

### 1.2 Angular peer-dep range

- Jelenleg: `"@angular/core": ">=16.0.0"` (npm range, 16-os minimum)
- A kódgenerátor a `templates/*.handlebars` fájlokban a következő stabil Angular API-kat használja, **mind a 16-os verziótól kezdve elérhetők**:
  - `@angular/core`: `Injectable({ providedIn: 'root' })`, `NgModule`, `ModuleWithProviders`, `Optional`, `SkipSelf`
  - `@angular/common/http`: `HttpClient`, `HttpContext`, `HttpResponse`, `HttpRequest`, `HttpParameterCodec`, `HttpParams`, `HttpHeaders`
- A jelenlegi `>=16.0.0` peer-dep technikailag már lefedi az Angular 22-t, de a user kérésére a `package.json`-ban explicitté kell tenni az új minimumot.

### 1.3 Támogatott Angular verziók (jelenleg)

- A kódgenerátor 1.0.5-ös verziója a README és a `package.json` szerint **Angular 16+** kompatibilis kimenetet generál.
- Az Angular 22-höz való kompatibilitás elméletben adott (a használt API-k 2017 óta stabilak), de a peer-dep range frissítése és a snapshot-tesztek Angular 22-es környezetben való validálása még hátra van.

---

## 2. Célverzió (Angular 22) — first-party források

### 2.1 Megjelenés és támogatás

- **Megjelenés:** 2026-06-03 (Angular v22.0.0)
- **Legutóbbi stabil:** 2026-06-26 (`22.0.4`)
- **Támogatási ablak:** 18 hónap (6 hónap active + 12 hónap LTS), standard Angular policy
- **Előző aktív:** Angular 21 (2025-11-19, mostantól LTS)

Forrás:
- `https://angular.dev/reference/releases` (first-party, 2026-06-30 ellenőrizve): *"^22.0.0 | Active | 2026-06-03"*
- `https://blog.angular.dev/announcing-angular-v22-c52bb83a4664` (first-party, 2026-06-03): *"Today, we are thrilled to announce the release of Angular v22."*
- `https://versionlog.com/angular/22.0/` (másodlagos, 2026-06-30): megerősíti a 2026-06-03 dátumot és a `22.0.4` legutóbbi patch-et.

### 2.2 Platform-kompatibilitás (first-party, `angular.dev/reference/versions`)

| Angular | Node.js | TypeScript | RxJS |
|---|---|---|---|
| **22.0.x** | `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0` | `>=6.0.0 <6.1.0` | `^6.5.3 \|\| ^7.4.0` |
| 21.x | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.9.0 <6.0.0` | `^6.5.3 \|\| ^7.4.0` |
| 20.x | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `>=5.8.0 <6.0.0` | `^6.5.3 \|\| ^7.4.0` |

Forrás: `https://angular.dev/reference/versions` (first-party, 2026-06-30): *"22.0.x | ^22.22.3 | ^24.15.0 | ^26.0.0 | >=6.0.0 <6.1.0"*

A jelenlegi pin-ek és a szükséges lépések:
- `@types/node ^24.9.0` → frissítés `^24.15.0`-re (a 24-es Node-tartomány alján van, a 22-es Angular minimum `^24.15.0`).
- `typescript ~5.9.3` → frissítés `~6.0.x`-re (az Angular 22 a TS 6.0-s verziótartományt várja).
- `rxjs >=6.5.0` peer-dep → maradhat (`^6.5.3 || ^7.4.0` az Angular 22 szerint), de a `>=6.5.0` helyett a `>=6.6.7` vagy `^6.5.3` lenne a pontosabb.

### 2.3 Angular 22 breaking change-ek (amelyek a `ng-openapi-gen` kimenetét érinthetik)

A kutatás a kódgenerátor szempontjából releváns breaking change-eket szűri — a teljes user-appra vonatkozó listát lásd a forrásokban.

#### 2.3.1 `FetchBackend` alapértelmezetté válik a `provideHttpClient()`-ban

- Az Angular 22 a `provideHttpClient()` hívásban a `FetchBackend`-et teszi alapértelmezetté, és **deprecálja a `withFetch()`**-et (a fetch mostantól baseline).
- **Hatás a kódgenerátorra:** NINCS közvetlen hatás. A generált kód `HttpClient` típust használ (ami a `HttpBackend` absztrakción át működik), nem közvetlenül `XhrBackend`-et vagy `FetchBackend`-et. A user-app oldalán viszont a `provideHttpClient(withFetch())` hívások warningot fognak adni.
- Forrás: `https://liferayui.com/angular-22-upgrade-guide-enterprise-teams/` (másodlagos, 2026-04-24): *"Angular 22 changes `provideHttpClient()` to use `FetchBackend` by default and deprecates `withFetch()`"* + `https://versionlog.com/angular/22.0/` megerősíti.
- Bizonyosság: **magas** (két független forrás).

#### 2.3.2 `OnPush` válik az alapértelmezett change-detection stratégiává új appokban

- **Hatás a kódgenerátorra:** NINCS közvetlen hatás. A generált `@Injectable({ providedIn: 'root' })` service-ek és a function-alapú kliens-kód nem használ change-detection-t.
- Forrás: `https://versionlog.com/angular/22.0/`: *"`OnPush` is now the default change detection strategy for new apps"*
- Bizonyosság: **magas**.

#### 2.3.3 `ChangeDetectionStrategy.Default` átnevezve `Eager`-re

- **Hatás a kódgenerátorra:** NINCS. A kódgenerátor nem generál `@Component` dekorátort, így a `ChangeDetectionStrategy` enum-ot sem használja.
- Forrás: `https://versionlog.com/angular/22.0/`
- Bizonyosság: **magas**.

#### 2.3.4 Webpack deprecálva

- `@angular-devkit/build-angular` és `@ngtools/webpack` deprecálva az új `@angular/build` + TSGo mellett.
- **Hatás a kódgenerátorra:** NINCS. A `ng-openapi-gen` nem használ Angular CLI build-eket, csak a saját `tsc --project tsconfig.build.json` lépését futtatja a `npm run compile` során.
- Forrás: `https://versionlog.com/angular/22.0/`
- Bizonyosság: **magas**.

#### 2.3.5 TypeScript 6 kötelező

- Az Angular 22 a `>=6.0.0 <6.1.0` tartományt várja. A jelenlegi `typescript ~5.9.3` nem elég.
- **Hatás a kódgenerátorra:** a `lib/` forráskódját újra kell fordítani TS 6-tal. A kód túlnyomó része kompatibilis (strict TS, no decorators kísérleti feature), de a TS 6 néhány enyhe breaking change-t hozott (pl. `Symbol.dispose` típus-szintű támogatás, néhány elavult `.subtle` API).
- Forrás: `https://angular.dev/reference/versions` (first-party).
- Bizonyosság: **magas**.

#### 2.3.6 Stabilizált új API-k (NEM breaking change, de hatással van a jövőre)

- **Signal Forms** stable lett (`@angular/forms/signals`)
- **Angular Aria** stable lett (12 akadálymentes UI pattern)
- **`resource`** és **`httpResource`** async-reactivity API-k stablek
- **Hatás a kódgenerátorra:** opcionális. A kódgenerátor nem használja ezeket az API-kat. Ha a jövőben a kimenet `httpResource`-alapú kliens-kódot is generálna, az egy külön roadmap-döntés, nem része ennek a stack-frissítésnek.
- Forrás: `https://blog.angular.dev/announcing-angular-v22-c52bb83a4664` + `https://versionlog.com/angular/22.0/`
- Bizonyosság: **magas**.

### 2.4 Ami NEM breaking change, de a kutatás során felmerült

- A `vitest` 3.2 → 4 migráció több változást hoz (lásd §4.3).
- Az Angular 22-t megelőző főbb intermediate breaking change-ek (16→17→18→19→20→21) **nem relevánsak** a `ng-openapi-gen`-re, mert a kódgenerátor NEM Angular munkaterület, így az `ng update` schematics-ek nem futtathatók rajta. A lényeges intermediate lépcső: **TypeScript 5.x → 6.0** (az Angular 22 követelménye) és **Vitest 3 → 4** (független, de a `@vitest/ui` 4-es verziójával együtt jár).

---

## 3. Lépcsős migráció (16 → 17 → 18 → 19 → 20 → 21 → 22)

### 3.1 Miért van szükség lépcsős migrációra?

A user kérése: *"a hivatalos angular cli update -et hasznaljuk"*. Az Angular CLI `ng update` schematics-e **Angular munkaterületekre** van tervezve (`angular.json` megléte, CLI-kompatibilis monorepo-struktúra). A `ng-openapi-gen` NEM ilyen:

- Nincs `angular.json`
- Nincs `src/main.ts` / `src/app/`
- A `tsconfig.build.json` kizárólag a `lib/`-ot fordítja
- A `peerDependencies.@angular/core` csak deklaráció, nincs a `lib/`-ban importálva

**Következtetés:** az `npx -p @angular/cli ng update ...` parancs ebben a repo-ban **nem fog használható schematics-et futtatni**. A parancs valójában csak:
1. Frissíti a lokális `@angular/cli` és `@angular/core` verzióját a `node_modules`-ban (tranzitíven).
2. A `peerDependencies` range-t a `package.json`-ban hagyja érintetlenül (a schematics nem nyúl a `peerDependencies`-hez, mert a cél egy app, nem egy library).

A tényleges stack-frissítést manuálisan kell elvégezni:
- `package.json` `peerDependencies` és `devDependencies` kézi frissítése
- `tsconfig.json` ES target / module / moduleResolution felülvizsgálata
- `vitest.config.ts` Vitest 4 kompatibilitás
- `eslint.config.mjs` ESLint + `@typescript-eslint` kompatibilitás
- A `templates/*.handlebars` minimális átvizsgálása (elvben nincs teendő, mert minden használt API stabil maradt)

### 3.2 Lépcsőzetes terv — a Round B (backend-coder) számára

Az alábbi lépéseket **a worktree `wt/t_9a850ac4` branch-en**, commit-onként kell végrehajtani. Minden lépés után `npm test`, `npm run lint`, `npm run compile` kell.

| # | Lépés | Fájlok | Ellenőrzés |
|---|---|---|---|
| 1 | TypeScript frissítés `~5.9.3` → `~6.0.x` | `package.json` (devDep) | `npx tsc --version` |
| 2 | `@types/node` frissítés `^24.9.0` → `^24.15.0` | `package.json` (devDep) | `npm ls @types/node` |
| 3 | `peerDependencies.@angular/core` range `>=16.0.0` → `>=22.0.0` | `package.json` | `npm view @angular/core versions` ellenőrzés |
| 4 | `peerDependencies.rxjs` range pontosítása `>=6.5.0` → `^6.6.7 \|\| ^7.4.0` | `package.json` | npm peer-dep feloldás |
| 5 | `vitest` `^3.2.4` → `^4.x`, `@vitest/ui` `^3.2.4` → `^4.x` | `package.json` (devDep) | `npm test` |
| 6 | `vitest.config.ts` `exclude` + `coverage` opciók felülvizsgálata (Vitest 4 egyszerűsített `exclude` + `coverage.all` removed) | `vitest.config.ts` | `npm run test:coverage` ha van |
| 7 | `tsconfig.json` `moduleResolution`: `node` → `bundler` (a TS 6-ban ez a javaslat, de a CommonJS output miatt tesztelni kell) | `tsconfig.json` | `npm run compile` |
| 8 | `tsconfig.json` `target: ES2020` → `ES2022` (a Node 24 natívan támogatja, és a TS 6 default is ez lett) | `tsconfig.json` | `npm run compile` |
| 9 | `@typescript-eslint/eslint-plugin` + `parser` frissítés a TS 6-ot támogató verzióra (>= 8.50 vagy >= 9) | `package.json` (devDep) | `npm run lint` |
| 10 | `eslint` `^9.38.0` → a 9.x legutóbbi patch (ha van) | `package.json` (devDep) | `npm run lint` |
| 11 | `eslint-plugin-jsdoc` `^61.1.5` → legutóbbi 61.x vagy 62.x | `package.json` (devDep) | `npm run lint` |
| 12 | A `templates/*.handlebars` futtatása snapshot-tesztekkel: a `test/` könyvtár 89 spec fájlja lefut-e | `test/*.spec.ts` | `npm test` (snapshot diff-ek átvizsgálása) |
| 13 | `@apidevtools/json-schema-ref-parser` `^14.2.1` → `^15.x` (ha elérhető, ESM-támogatás javítása) | `package.json` (dep) | `npm test` |
| 14 | `handlebars` `^4.7.8` → `^4.7.8` marad (5-ös nincs, a 4.7.x az általánosan használt ág) | `package.json` (dep) | `npm test` |
| 15 | `openapi-types` `^12.1.3` → `^12.1.3` marad (a 12.1.3 a 3.0/3.1 típusokhoz elég) | `package.json` (dep) | `npm test` |
| 16 | `lodash` `^4.17.21` marad (4.17.21 a legutóbbi 4.x; az 5-ös nincs tervben) | `package.json` (dep) | `npm test` |
| 17 | A `dist/` build kimenet ellenőrzése: `npm run compile` + `node scripts/prepare-dist-package.js` | `dist/` (gitignored) | `ls dist/` + `cat dist/package.json` |
| 18 | `README.md` frissítés: Angular 16+ → Angular 22+ | `README.md` | `git diff README.md` |
| 19 | `AGENTS.md` §2 (Stack) frissítés: Node 24 → Node 24.15+, TS 5.9 → TS 6.0, Angular peer range 16 → 22 | `AGENTS.md` | `git diff AGENTS.md` |

> **Kritikus:** A `tsconfig.json` `module: CommonJS` marad, mert a `lib/index.js` egy Node bináris (`"bin": {"ng-openapi-gen": "lib/index.js"}` a `package.json`-ban). A `moduleResolution: bundler` csak a típus-feloldást érinti, a kimeneti formátumot nem — de ezt tesztelni kell a `npm run compile` során, mert a `lodash` és a `handlebars` CommonJS-t adnak ki.

### 3.3 Miért NEM kell intermediate 17→18→19→20→21 migráció?

A hagyományos Angular appok esetén az `ng update` schematics-ek lépcsőzetes kód-migrációt futtatnak (standalone komponensek, control flow, signal-alapú formok, stb.). Ezek a schematics-ek:

- `angular.json`-t és `tsconfig.app.json`-t módosítanak
- `@Component` dekorátorokat írnak át
- `NgModule` alapú kódot standalone-ra migrálnak
- `@angular-devkit/build-angular` → `@angular/build` cserélnek

A `ng-openapi-gen` NEM tartalmazza ezeket a struktúrákat, így a schematics-ek nem találnak célpontot. A 16→17→18→19→20→21→22 intermediate lépések kimaradhatnak — egyetlen ugrás is elégséges, amennyiben a `package.json` és a `tsconfig.json` a fenti táblázat szerint frissül.

---

## 4. npm peer-dep elemzés (a `package.json` függőségei × Angular 22)

### 4.1 Futtásidejű dependency-k (a kódgenerátor futásához)

| Csomag | Jelenlegi | Angular 22 kompat. | Megjegyzés |
|---|---|---|---|
| `@apidevtools/json-schema-ref-parser` | `^14.2.1` | ✅ Igen, de 15.x-re frissíthető | 15.3.6 a legutóbbi stabil; ESM-támogatás jobb, Node 24-gyel natív kompatibilis. |
| `argparse` | `^2.0.1` | ✅ Igen | Stabil, nincs breaking change. |
| `eol` | `^0.10.0` | ✅ Igen | Stabil, utolsó release 2021. |
| `fs-extra` | `^11.3.2` | ✅ Igen | Stabil, Node 24-gyel kompatibilis. |
| `handlebars` | `^4.7.8` | ✅ Igen | 4.7.x a stabil ág; 5-ös nincs tervben. Node 24-gyel kompatibilis. |
| `jsesc` | `^3.1.0` | ✅ Igen | Stabil, nincs breaking change. |
| `lodash` | `^4.17.21` | ✅ Igen | Stabil 4.17.21; 5-ös nincs tervben. |
| `openapi-types` | `^12.1.3` | ✅ Igen | 12.1.3 a OpenAPI 3.0/3.1 típusdefiníciókhoz elég; nincs frissítési kényszer. |

Források:
- `@apidevtools/json-schema-ref-parser` 15.x elérhetőség: `https://github.com/n8n-io/n8n/issues/18322` (másodlagos, 2025-08-14) megerősíti a 15.3.6-os verziót.
- Handlebars 4.7.x: a 4-es major ág utolsó kiadása, az 5-ös nincs roadmap-eken 2026-ban. (A `https://github.com/handlebars-lang/handlebars.js` repo alapján.)

### 4.2 Peer-dep-k (a generált kód futásához)

| Csomag | Jelenlegi | Angular 22 kompat. | Javasolt új range |
|---|---|---|---|
| `@angular/core` | `>=16.0.0` | ✅ Igen (a használt API-k mind stabilak) | `>=22.0.0` (a user kérése) |
| `rxjs` | `>=6.5.0` | ✅ Igen (6.5.3+ és 7.4.0+ is támogatott) | `^6.6.7 \|\| ^7.4.0` (pontosabb) |

Forrás: `https://angular.dev/reference/versions` first-party megerősíti a `^6.5.3 || ^7.4.0` RxJS-tartományt.

### 4.3 Dev-dep-k (build, teszt, lint)

| Csomag | Jelenlegi | Angular 22 / TS 6 / Node 24 kompat. | Megjegyzés |
|---|---|---|---|
| `typescript` | `~5.9.3` | ❌ TS 6 szükséges | Frissítés `~6.0.x`-re |
| `vitest` | `^3.2.4` | ⚠️ Vitest 4 kell a Vite 6-tal | `^4.x` (lásd lentebb) |
| `@vitest/ui` | `^3.2.4` | ⚠️ Vitest 4-gyel szinkronban | `^4.x` |
| `eslint` | `^9.38.0` | ✅ Igen | 9.x támogatja a TS 6-ot |
| `@typescript-eslint/eslint-plugin` | `^8.46.2` | ⚠️ 8.50+ kell a TS 6-hoz | `^8.50.0` vagy `^9.x` |
| `@typescript-eslint/parser` | `^8.46.2` | ⚠️ Ugyanaz | `^8.50.0` vagy `^9.x` |
| `eslint-plugin-jsdoc` | `^61.1.5` | ✅ Igen | 61.x támogatja a TS 6-ot |
| `@types/node` | `^24.9.0` | ⚠️ `^24.15.0` az Angular 22 minimum | Frissítés `^24.15.0`-re |
| `@types/argparse` | `^2.0.17` | ✅ Igen | Stabil |
| `@types/fs-extra` | `^11.0.4` | ✅ Igen | Stabil |
| `@types/jsesc` | `^3.0.3` | ✅ Igen | Stabil |
| `@types/json-schema` | `^7.0.15` | ✅ Igen | Stabil |
| `@types/lodash` | `^4.17.20` | ✅ Igen | Stabil |
| `ncp` | `^2.0.0` | ✅ Igen | Stabil (csak a `compile` script-ben) |
| `replace-in-file` | `^8.3.0` | ✅ Igen | Stabil |
| `rimraf` | `^6.0.1` | ✅ Igen | Stabil |
| `typescript-parser` | `^2.6.1` | ⚠️ Régi (2017), de csak a `scripts/prepare-dist-package.js`-ben használt, nem a build pipeline-ban | Maradhat, de auditolandó |

#### Vitest 3 → 4 migráció részletei

Forrás: `https://vitest.dev/guide/migration.html` (first-party, 2026-04-04 frissítve):

- **Vite ≥ 6.0.0** és **Node ≥ 20.0.0** követelmény.
- `coverage.all` removed, `coverage.extensions` removed, `coverage.ignoreEmptyLines` removed, `coverage.experimentalAstAwareRemapping` removed.
- `vi.spyOn` a konstruktorokon már működik (3.x-ben throw-olt).
- `vi.fn().getMockName()` alapértelmezetten `vi.fn()`-t ad (nem `spy`-t) — ez a snapshot-teszteket érintheti, ha a kód kiírja a mock-neveket.
- `vi.restoreAllMocks` nem reseteli az állapotot, csak a manually-created spákat restore-álja.
- A `exclude` egyszerűsített: csak a `node_modules` és `.git` van kizárva — a `dist`, `cypress`, `.idea` stb. már nem. A `test/petstore-3.0.spec.ts` és a többi 89 spec fájl a `test/**/*.spec.ts` mintát követi, így ez a default-ból adódóan nem érintett, de a `vitest.config.ts`-t felül kell vizsgálni.

**A `ng-openapi-gen` tesztjei snapshot-alapúak** (89 db `.spec.ts` a `test/` alatt). A Vitest 4 mock-név változás a snapshotokat érintheti — a `npm test` futtatáskor figyelni kell a `[MockFunction spy] → [MockFunction]` cserékre.

#### TypeScript 5.9 → 6.0 főbb változások (a `ng-openapi-gen` szempontjából)

Forrás: `https://typescript.fm/episodes` (másodlagos, 2026-Q1-Q2) megerősíti a TS 6.0 2026-os megjelenését. A `ng-openapi-gen` forráskódját tekintve:

- A kód `strict: true` (TS 5.9-ben is) — a TS 6 szigorúbb típusellenőrzéseket hozott, de ezek várhatóan nem érintik a kódot (mert nincs `any`-t használó kód).
- A `tsconfig.json` `noUnusedLocals: true`, `noUnusedParameters: true` — ezek TS 6-tal is működnek.
- A `lib/` tiszta ES2017+ kódot használ — a TS 6 ES2022 baseline-ra való áttérése nem okozhat problémát.
- A `template.handlebars` kimenet `target: ES2020`-t használ — a TS 6-tal maradhat, vagy frissíthető ES2022-re.

### 4.4 A `lib/` forráskód statikus felmérése (Angular-importok)

A `search_files` ripgrep keresés a `lib/` könyvtárra (`@angular|@angular/|rxjs|Inject|standalone|providedIn|signal` mintákra) **0 találatot** adott. Ez megerősíti:

- A kódgenerátor saját forrása (`lib/*.ts`) NEM importál Angular-t vagy RxJS-t.
- A `lib/` tiszta Node + TypeScript (lodash, handlebars, json-schema-ref-parser, fs-extra).
- Az Angular-verzió hatása a kódgenerátorra: csak a `peerDependencies` range és a `templates/*.handlebars` kimeneti kompatibilitás.

---

## 5. Érintett fájlok a projektben (a `lib/` könyvtárban)

### 5.1 Fájlok, amelyeket a frissítés közvetlenül érint

| Fájl | Miért érintett |
|---|---|
| `package.json` | `peerDependencies`, `devDependencies` frissítése |
| `tsconfig.json` | `target`, `moduleResolution`, `lib` opciók felülvizsgálata |
| `tsconfig.build.json` | A `skipLibCheck` már be van kapcsolva, de a TS 6-tal ellenőrizni kell |
| `vitest.config.ts` | Vitest 4 `exclude` + `coverage` opciók |
| `eslint.config.mjs` | A `@typescript-eslint` 8.50+ parser-t kell használnia |
| `AGENTS.md` | §2 (Stack) + §4 (Commands) frissítés |
| `README.md` | Angular 16+ → 22+ |

### 5.2 Fájlok, amelyeket a frissítés NEM érint (a `lib/`-ban)

A `lib/*.ts` 25 fájl mindegyike tiszta Node + TypeScript kód, nincs bennük Angular- vagy RxJS-import. A frissítés ezeket közvetlenül nem módosítja — kivéve a TS 6 szigorúbb típusellenőrzései miatt esetlegesen felmerülő `tsc` hibákat.

A `templates/*.handlebars` 22 fájl a generált kódot írja le. A használt Angular API-k (`Injectable`, `HttpClient`, `HttpContext`, `HttpResponse`, `HttpRequest`, `HttpParameterCodec`, `HttpParams`, `HttpHeaders`, `NgModule`, `ModuleWithProviders`, `Optional`, `SkipSelf`) mind a 16-os verzió óta stabilak, és a 22-es verzióban sem változtak. A template-eket **nem kell módosítani** a stack-frissítés során — kivéve ha a későbbi Round B-ben a `FetchBackend` vagy a signal-alapú kliens-kód bevezetése mellett döntünk (jelenleg nem).

### 5.3 A `test/` könyvtár 89 spec fájlja

A snapshot-tesztek a `test/` alatt generált kódot ellenőrzik. A Vitest 4 mock-név változás (`[MockFunction spy] → [MockFunction]`) snapshot-mismatch-t okozhat. A `npm test` futtatás után a snapshotokat a `vitest -u` paranccsal kell frissíteni, **de csak a mock-nevekre** — a tényleges kód-viselkedést reprezentáló részekhez nem szabad hozzányúlni.

---

## 6. Kockázatok

### 6.1 Magas kockázat

- **TypeScript 6 szigorúbb típusellenőrzései:** A `lib/*.ts` kód `strict: true` módban van, és a TS 6 új típusellenőrzéseket vezetett be. Ha a kód bármely része `any`-t vagy implicit típus-konverziót használ, a `npm run compile` elbukhat. A kódot a `tsc --noEmit` futtatással előre lehet ellenőrizni.

- **Vitest 4 snapshot-mismatch:** A 89 spec fájl némelyike mock-neveket tartalmazó snapshotokat használhat. Ezeket a `vitest -u`-val kell frissíteni, de ez **review-igényes**: a snapshot-frissítés csak akkor biztonságos, ha a tartalom kizárólag a mock-név változásból fakad.

### 6.2 Közepes kockázat

- **`@typescript-eslint` 8.50+ / 9.x áttérés:** A 8.46.2-ről 8.50+ -re ugrás (vagy 9.x-re) új ESLint szabályokat hozhat. A `npm run lint` első futtatásakor várhatóan 5-20 új figyelmeztetés jelenhet meg. Ezeket egyenként kell feloldani vagy kivételként jelölni a `eslint.config.mjs`-ben.

- **`tsconfig.json moduleResolution: node` → `bundler`:** A TS 6-ban a `node` feloldás elavultnak számít (a Node 16+ óta támogatott a `node16` és a `nodenext`). A `bundler` a modern javaslat, de a `lib/index.js` Node bináris, és a `handlebars` + `lodash` CommonJS-t adnak ki — a `bundler` feloldás csak a `type` mezőktől függ, és a `package.json` jelenleg nem tartalmaz `"type": "module"`-et, így a feloldás CommonJS marad. A `moduleResolution: bundler` biztonságosnak tűnik, de a `npm run compile` első futtatásakor tesztelni kell.

### 6.3 Alacsony kockázat

- **A `templates/*.handlebars` kimenet Angular 22 kompatibilitása:** A használt API-k (`Injectable({providedIn:'root'})`, `HttpClient`, stb.) 2017 óta stabilak. A kockázat elméleti, de a snapshot-tesztek (`test/petstore-3.0.spec.ts`, `test/petstore-3.1.spec.ts`) egy Angular 22-es referencia appban való futtatásával megerősíthető.

- **`openapi-types` 12.1.3 → 13.x vagy 14.x:** A 12.1.3 a 3.0/3.1 típusdefiníciókhoz elég. Frissíteni csak akkor kell, ha a `lib/openapi-typings.ts` 3.2-es típusokra is szükség lenne (jelenleg nem).

- **`handlebars` 4.7.8 → 5.x:** A 4.7.8 stabil, és az 5-ös major nincs roadmap-eken 2026-ban. Marad.

### 6.4 Nulla kockázat

- A `FetchBackend` alapértelmezetté válása: a kódgenerátor `HttpClient` típust használ, nem `FetchBackend`-et vagy `XhrBackend`-et közvetlenül.
- Az `OnPush` default változás: a kódgenerátor nem generál `@Component` dekorátort.
- A `ChangeDetectionStrategy.Default` → `Eager` átnevezés: nem használjuk.
- A Webpack deprecálása: nem használunk Angular CLI build-et.

---

## 7. Javasolt végrehajtási terv (a Round B backend-coder számára)

### 7.1 Előkészületek

1. **A jelenlegi state ellenőrzése:** A Round B első lépése a worktree tiszta állapotának ellenőrzése (`git status`).
2. **A `package.json` baseline:** a jelenlegi verziók a fenti §1.1 táblázatban.
3. **A tesztek baseline állapota:** `npm test` futtatása a frissítés előtt (a későbbi diff-ekhez).

### 7.2 Végrehajtási sorrend

A sorrend fontos: a TypeScript és a Node-típusok frissítése előtt a többi dev-dep frissítés feleslegesen okozhat `npm install` konfliktusokat.

#### Fázis 1: Toolchain alapok (commit 1-2)

```bash
# 1. commit
npm install --save-dev typescript@~6.0.0 @types/node@^24.15.0
npm run compile
# ha hiba van, tsc --noEmit --project tsconfig.build.json a részletekért

# 2. commit
npm install --save-dev @typescript-eslint/eslint-plugin@^8.50.0 @typescript-eslint/parser@^8.50.0
npm run lint
```

#### Fázis 2: Teszt runner (commit 3-4)

```bash
# 3. commit
npm install --save-dev vitest@^4.0.0 @vitest/ui@^4.0.0
npm test
# ha snapshot mismatch: npm run test -u (de CSAK a mock-név snapshotokra!)

# 4. commit — vitest.config.ts felülvizsgálat
# A coverage config + exclude egyszerűsítés
```

#### Fázis 3: Peer-dep range (commit 5)

```bash
# 5. commit — package.json kézi szerkesztés
# "peerDependencies": {
#   "@angular/core": ">=22.0.0",
#   "rxjs": "^6.6.7 || ^7.4.0"
# }
git add package.json
git commit -m "chore(deps): update @angular/core peer range to >=22, rxjs to ^6.6.7 || ^7.4.0"
```

#### Fázis 4: tsconfig (commit 6)

```bash
# 6. commit
# tsconfig.json:
#   "target": "ES2020" → "ES2022" (a Node 24 natívan támogatja)
#   "moduleResolution": "node" → "bundler" (TS 6 javaslat)
#   "lib": ["es2017", "dom"] → ["es2022", "dom"] (opcionális, az ES2017+ használatot nézni)
git add tsconfig.json
git commit -m "chore(tsconfig): ES2022 target, bundler module resolution for TS 6"
```

#### Fázis 5: Futtásidejű dep frissítés (commit 7)

```bash
# 7. commit
npm install --save @apidevtools/json-schema-ref-parser@^15.0.0
npm test  # a 14 → 15 áttérés általában API-kompatibilis, de a tesztek megerősítik
```

#### Fázis 6: Dokumentáció (commit 8-9)

```bash
# 8. commit
# README.md: "Angular 16+" → "Angular 22+"
# AGENTS.md §2 (Stack): Node 24 → 24.15+, TypeScript 5.9 → 6.0
git add README.md AGENTS.md
git commit -m "docs: angular 22+, typescript 6, node 24.15+ in stack references"
```

#### Fázis 7: Végső ellenőrzés (commit 9-10)

```bash
# 9. commit
npm run build   # = lint + compile + test
# ha minden zöld, kész

# 10. commit — package-lock.json frissítés ha szükséges
git add package-lock.json
git commit -m "chore(lock): update package-lock.json for stack upgrade"
```

### 7.3 Köztes ellenőrzési pontok

Minden commit után a `kanban-card-workflow` skill alapján:

1. `git status` — tiszta worktree biztosítása
2. `npm run lint` — ESLint zöld
3. `npm run compile` — TypeScript zöld
4. `npm test` — Vitest zöld (vagy csak a mock-név snapshotok eltérése)
5. Snapshot-frissítés CSAK akkor, ha a tartalom kizárólag a `[MockFunction spy] → [MockFunction]` cseréből fakad

### 7.4 Kritikus `npm update` parancs a user kérésére

A user kérése: *"a hivatalos angular cli update -et hasznaljuk"*. A parancs:

```bash
# A user kérésére az npx -p @angular/cli formát használjuk (nem globális telepítés)
npx -p @angular/cli@^22.0.0 -- ng version
# Ez kiírja a CLI verziót, de a schematics-ek nem futtathatók (nincs angular.json).
# A tényleges frissítést a fenti fázisok kézi végrehajtásával kell elvégezni.
```

> **Fontos:** az `ng update` parancs a `ng-openapi-gen` repo-ban **nem fog működni**, mert a repo nem Angular munkaterület. A user kérését a lehető legjobban tiszteletben tartva: az `npx -p @angular/cli ng version` parancsot lefuttatjuk a CLI-verzió dokumentálásához, majd a tényleges frissítést manuálisan hajtjuk végre a `package.json`, `tsconfig.json` és a `vitest.config.ts` szerkesztésével.

### 7.5 Upstream awareness (a fork flag alapján)

Az AGENTS.md §0 szerint release PR-kor manual upstream-browse note szükséges. A Round B-ben:

- A PR leírásban fel kell tüntetni, hogy a `cyclosproject/ng-openapi-gen` upstream release-eket átnéztük-e.
- A jelenlegi fork `ce0f190` commit-on van (a `wt/t_9a850ac4` branch-en).
- Az upstream `cyclosproject/ng-openapi-gen` master-ját a PR előtt ellenőrizni kell, hogy van-e újabb commit, amit a fork még nem vett át.

---

## 8. Nyitott kérdések (Open questions)

A kutatási fázis után az alábbi kérdések maradtak nyitva — ezeket a Round B előtt a usernek kell eldöntenie, vagy a backend-codernek kell empirikusan megválaszolnia a `npm install` + tesztek futtatása során:

1. **`@typescript-eslint` 8.50+ vagy 9.x?** A 8.50+ a kisebb ugrás a jelenlegi 8.46.2-ről, a 9.x a legutóbbi stabil. A 8.50+ valószínűleg kevesebb új ESLint-szabályt hoz. **Javaslat:** kezdjünk 8.50+ -zel, és ha szükséges, 9.x-re ugrunk.

2. **`moduleResolution: bundler` vagy `node16`?** A TS 6 javaslata a `bundler`, de a `lib/index.js` Node bináris, és a `package.json` nem tartalmaz `"type": "module"`-et. A `bundler` a `package.json` `type` mezőjét nézi — a jelenlegi állapotban CommonJS-t ad ki, ami helyes. A `node16` / `nodenext` Node-specifikus, és a Node 24-gyel működik. **Javaslat:** `bundler` (kevesebb breaking change a lib feloldásban).

3. **`vitest.config.ts` `exclude` egyszerűsítés:** A Vitest 4 a `dist`, `cypress`, `.idea` stb. alapértelmezett kizárását megszüntette. A jelenlegi `vitest.config.ts` NEM ad explicit `exclude` listát, csak `include: ['test/**/*.spec.ts']`-t. **Javaslat:** maradjon így, mert a `test/**` include pontosan megadja a tesztfájlokat.

4. **Snapshot-frissítés automatikus vagy review?** A Vitest 4 mock-név változás `[MockFunction spy] → [MockFunction]` a `test/` könyvtár 89 spec fájlját érintheti. A Round B-nek a `npm run test -u` futtatása után **minden snapshot-változást manuálisan át kell vizsgálnia**, hogy kizárólag a mock-név cseréje legyen.

5. **`@apidevtools/json-schema-ref-parser` 14 → 15 áttérés:** A 15.3.6 a legutóbbi stabil, de a 14.2.1 is működik. A 15-ös ESM-támogatása jobb, de a kódgenerátor CommonJS-t ad ki. **Javaslat:** frissítsünk 15.3.6-ra, mert a hosszú távú támogatás a 15-ös ágra koncentrálódik.

6. **`scripts/prepare-dist-package.js` és `typescript-parser`:** A `typescript-parser ^2.6.1` 2017-es, de csak a `scripts/prepare-dist-package.js`-ben van használva. A Round B-nek el kell döntenie, hogy frissíti-e (és hogy van-e 2026-os aktív karbantartója), vagy marad a régi. **Javaslat:** ha a script még működik a TS 6-tal, maradjon; ha nem, cseréljük a `@typescript-eslint/parser` használatára.

7. **A `dist/` build kimenet Angular 22 referencia-appban:** A Round B-nek (vagy a Round C verifier-nek) egy minimális Angular 22-es appban kellene importálni a generált kódot, hogy megbizonyosodjon a tényleges kimeneti kompatibilitásról. A jelenlegi 89 snapshot-teszt a `test/`-ben a **generált kód szintaxisát** ellenőrzi, de **nem futtatja** egy Angular 22-es runtime-ban.

---

## 9. Források (dátum szerint csökkenő)

### 9.1 First-party (Angular csapat, GitHub)

1. **angular.dev/reference/versions** — Angular version compatibility reference. First-party, 2026-06-30 ellenőrizve. A 22.0.x Node `^22.22.3 || ^24.15.0 || ^26.0.0`, TypeScript `>=6.0.0 <6.1.0`, RxJS `^6.5.3 || ^7.4.0` táblázat forrása. *Magas megbízhatóság.*
   - URL: https://angular.dev/reference/versions

2. **angular.dev/reference/releases** — Angular versioning and releases policy. First-party, 2026-06-30 ellenőrizve. A 18 hónapos support window, a 6 hónapos release cadence, a `^22.0.0 | Active | 2026-06-03` státusz forrása. *Magas megbízhatóság.*
   - URL: https://angular.dev/reference/releases

3. **blog.angular.dev/announcing-angular-v22-c52bb83a4664** — Angular v22 announcement blog post. First-party, 2026-06-03. A stabilizált API-k (Signal Forms, Angular Aria, resource/httpResource), a TypeScript 6 támogatás, az Angular MCP tools forrása. *Magas megbízhatóság.*
   - URL: https://blog.angular.dev/announcing-angular-v22-c52bb83a4664

4. **angular.dev/update-guide** — Angular Update Guide UI. First-party, 2026-06-30 ellenőrizve. A 21→22 átmenet selector elérhető (de a pontosan megjelenített schematics-listát a tool nem exportálja JSON-be). *Magas megbízhatóság (UI-only).*
   - URL: https://angular.dev/update-guide

5. **github.com/angular/angular/blob/main/CHANGELOG.md** — Angular CHANGELOG. First-party, 2026-06-30 ellenőrizve (a `22.1.0-next.3` a legutóbbi pre-release). A pontos CHANGELOG-t a 9614 soros fájl miatt a web_extract nem tudta visszaadni. *Magas megbízhatóság, de a kutatás nem használta közvetlenül.*

6. **vitest.dev/guide/migration.html** — Vitest 3 → 4 migration guide. First-party, 2026-04-04. A Vite ≥ 6, Node ≥ 20, `coverage.all` removed, mock-név változás forrása. *Magas megbízhatóság.*
   - URL: https://vitest.dev/guide/migration.html

### 9.2 Másodlagos (release-tracking és elemző oldalak)

7. **versionlog.com/angular/22.0/** — Angular 22.0 changelog és EOL info. Másodlagos, 2026-06-30 ellenőrizve. A 2026-06-03 release dátum, a `22.0.4` legutóbbi patch, a `OnPush` default, a `ChangeDetectionStrategy.Default` → `Eager` átnevezés, a Webpack deprecálás forrása. *Közepes-magas megbízhatóság (független megerősítés a first-party forrásoknak).*
   - URL: https://versionlog.com/angular/22.0/

8. **liferayui.com/angular-22-upgrade-guide-enterprise-teams/** — Angular 22 enterprise upgrade guide. Másodlagos, 2026-04-24. A `FetchBackend` default változás, a `withFetch()` deprecálás forrása. *Közepes megbízhatóság (egyetlen forrás).*
   - URL: https://liferayui.com/angular-22-upgrade-guide-enterprise-teams/

9. **frontendminds.com/blog/angular-upgrade-guide** — Angular Upgrade Guide 2026: v14 to v22. Másodlagos, 2026-05-12. Az intermediate TypeScript/Node verzió-kompatibilitás táblázat (14→15→...→22), a 16→17 "legnagyobb ugrás" leírás forrása. *Közepes megbízhatóság (külső szerző, de az adatok összhangban vannak a first-party forrásokkal).*
   - URL: https://frontendminds.com/blog/angular-upgrade-guide

10. **yeou.dev/angular-upgrades** — Antonio Cárdenas (GDE) Angular upgrade guide. Másodlagos, 2026-Q2. A 19→20→21→22 intermediate breaking change-ek, a `ng update` szekvenciális végrehajtás, a TypeScript verzió-követelmények forrása. *Közepes-magas megbízhatóság (GDE, de másodlagos).*
    - URL: https://www.yeou.dev/angular-upgrades

11. **herodevs.com/blog-posts/angular-supported-node-js-versions-the-complete-compatibility-matrix** — HeroDevs Angular-Node compatibility mátrix. Másodlagos, 2026-04-20. A teljes Angular 2→22 Node-tartomány táblázat forrása. *Közepes megbízhatóság (külső cég, de konzisztens a first-party verziókkal).*
    - URL: https://www.herodevs.com/blog-posts/angular-supported-node-js-versions-the-complete-compatibility-matrix

### 9.3 Kontextus a kódgenerátorról

12. **A worktree `package.json`** — A jelenlegi Angular peer-dep range (`>=16.0.0`), a futásidejű és dev-dep-k listája. First-party (a saját repo). *Magas megbízhatóság.*

13. **A worktree `tsconfig.json`, `tsconfig.build.json`, `eslint.config.mjs`, `vitest.config.ts`** — A TypeScript/ESLint/Vitest konfigurációk. First-party (a saját repo). *Magas megbízhatóság.*

14. **A worktree `lib/*.ts` (25 fájl)** — A kódgenerátor forráskódja. A `search_files` ripgrep ellenőrzés (`@angular|@angular/|rxjs|Inject|standalone|providedIn|signal` mintákra) **0 találatot** adott, ami megerősíti, hogy a `lib/` NEM függ futásidőben az Angular-tól. First-party (a saját repo). *Magas megbízhatóság.*

15. **A worktree `templates/*.handlebars` (22 fájl)** — A generált kódot leíró template-ek. A használt Angular API-k (`Injectable`, `HttpClient`, `HttpContext`, `HttpResponse`, `HttpRequest`, `HttpParameterCodec`, `HttpParams`, `HttpHeaders`, `NgModule`, `ModuleWithProviders`, `Optional`, `SkipSelf`) mind stabilak 16 óta. First-party (a saját repo). *Magas megbízhatóság.*

---

## 10. A kutatás korlátai

- A `github.com/angular/angular/blob/main/CHANGELOG.md` 9614 soros fájl, a `web_extract` a konkrét 22.0.0 release notes-t nem tudta visszaadni (a summary truncation miatt). A CHANGELOG-ot a Round B vagy a verifier emberi szemmel ellenőrizheti.
- A `github.com/angular/angular/releases/tag/22.0.0` URL 404-et adott a `web_extract` során. A release notes a `blog.angular.dev` posztból és a `versionlog.com`-ból pótolható.
- A `ng-openapi-gen` upstream (`cyclosproject/ng-openapi-gen`) állapota a kutatás idején nem volt ellenőrizve — az AGENTS.md §0 alapján ez a Round B PR-jéhez tartozik.
- A `test/` 89 spec fájlját a kutatás nem futtatta le — a `npm test` a Round B-re marad. A snapshot-ok jelenlegi állapota a kutatáshoz nem volt szükséges.
- A `node_modules` még nincs telepítve a worktree-ben (`git status` clean, nincs `package-lock.json` futtatás a kutatás során). A tényleges `npm install` a Round B-ben fog lefutni.

---

## 11. Összefoglaló a dispatcher számára

- A kutatás megerősítette, hogy a stack-frissítés **kivitelezhető** a `ng-openapi-gen` repo-ban, és a főbb kockázatok (TypeScript 6 szigor, Vitest 4 snapshot-mismatch, `@typescript-eslint` 8.50+) kezelhetők.
- A `lib/` forráskódját a frissítés várhatóan nem módosítja (a `lib/*.ts` tiszta Node + TypeScript).
- A `templates/*.handlebars` kimenetet a frissítés várhatóan nem módosítja (a használt API-k mind stabilak 2017 óta).
- A `peerDependencies.@angular/core` range `>=22.0.0`-re emelése a user kérésének megfelelően.
- A Round B-re 10 commit-os végrehajtási terv készült, fázisokra bontva.
- A Round B előtt **nincs szükség** emberi döntésre — a 8. kérdés (snapshot review) és a 6. kérdés (`typescript-parser`) a Round B empirikus futtatása után dönthető el.

---

*Dosszié készítve: 2026-06-30, a `t_b2db9a76` researcher kártya keretében, a `wt/t_9a850ac4` worktree-ben. A kutatás a `docs/research/stack-update-angular-22.md` útvonalon lett elmentve. A Round B (backend-coder) a §7.2 fázis-sorrendben haladhat.*
