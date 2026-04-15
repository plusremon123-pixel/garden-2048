# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Artifacts

### `artifacts/garden-2048` (`@workspace/garden-2048`)

식물 테마 2048 퍼즐 게임. 순수 프론트엔드 (백엔드 없음).

**화면 구조:**
- `FrontScreen` → `GameScreen` (슬라이드 전환, 350ms)
- `App.tsx`: `useAppState` 훅으로 화면 전환 + 테마 선택 상태 관리

**파일 구조:**
```
src/
├── App.tsx                  # 화면 전환 컨테이너 + usePlayer 루트 관리
├── hooks/
│   ├── useAppState.ts       # 화면 상태(front/game), 테마 선택 상태
│   ├── useGame.ts           # 게임 로직 (이동, 합치기, 점수, highestTile)
│   └── usePlayer.ts         # 플레이어 레벨/XP/코인 상태 + localStorage 동기화
├── utils/
│   ├── gameUtils.ts         # 순수 함수: 보드 이동/합치기/승패 체크
│   ├── themes.ts            # 테마 데이터 (plant/animal/weather/landscape)
│   ├── playerData.ts        # PlayerData 타입, XP 공식, 레벨 보상 테이블, applyXp
│   └── adService.ts         # 광고 Mock 서비스 (watchAd, isAdAvailable)
├── components/
│   ├── FrontScreen.tsx      # 진입 화면 (레벨바, 테마선택, 게임시작, 광고)
│   ├── Board.tsx            # 4x4 게임 보드 + 터치 스와이프 처리
│   ├── Tile.tsx             # 타일 렌더링 + 등장/합치기 애니메이션
│   ├── Header.tsx           # 홈 버튼, 테마 뱃지, 레벨바(small), 점수, 새게임
│   ├── LevelBar.tsx         # 레벨 + XP 진행 바 (size: large|small)
│   ├── GameEndModal.tsx     # 게임 종료 모달 (XP 내역, 광고 2x, 레벨업 표시)
│   └── Modal.tsx            # 재사용 모달 (확인/취소)
└── pages/
    └── Game.tsx             # 게임 화면 페이지 (보드 + 모달 조합)
```

**레벨 시스템:**
- XP 공식: 기본10 + floor(점수/40) + floor(log2(최고타일)×3) + 2048달성50
- 레벨업 필요 XP: 60 + (현재레벨-1) × 25
- 게임 종료 시 `GameEndModal`에서 XP 확인 후 지급
- "광고 보고 XP 2배" mock 버튼 — `adService.ts` 내부만 교체해 실 SDK 연결 가능
- 레벨업 시 `LEVEL_REWARDS` 테이블에서 코인 지급

**테마 확장 방법:** `themes.ts`의 `THEMES` 객체에 새 테마 추가 후 `available: true` 설정

**localStorage 키:**
- `plant2048_bestScore` — 최고 점수
- `plant2048_selectedTheme` — 마지막 선택 테마
- `plant2048_player` — 플레이어 데이터 (level, xp, totalXp, coins)

---

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
