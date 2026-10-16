# Vite vs Vite+

The same frontend tooling set up two ways, side by side:

| Folder | Stack | How the tooling is wired |
| --- | --- | --- |
| [`vite/`](vite/) | Vite 8 + Vue 3 + TS | Plain Vite, with Oxlint, Oxfmt, Vitest, Husky and lint-staged added by hand |
| [`vite-plus/`](vite-plus/) | Vite+ 1.2 + vanilla TS | One `vite-plus` package and its `vp` CLI |

Both projects end up with the **same underlying tools at the same versions**: Vite 8.3, Rolldown, Oxlint 1.88, Oxfmt 0.73 and Vitest 5.0. The difference is how much you have to install, configure and remember.

> **Note:** `vite/` is a Vue app and `vite-plus/` is a vanilla TS app, so a few dependencies (`@vitejs/plugin-vue`, `vue-tsc`, `@vue/test-utils`, `jsdom`) exist only because of Vue. The comparisons below are about the tooling.

## What is Vite+?

[Vite+](https://viteplus.dev) is a unified toolchain from VoidZero, the team behind Vite. It is distinct from Vite: it **bundles** Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt and Vite Task behind a single CLI called `vp`, and it also handles Node.js runtime and package manager management. Vite itself is still the dev server and bundler; Vite+ is the layer that ties everything together.

```text
$ vp toolchain
vite-plus@1.2.0
├── depends on @voidzero-dev/vite-plus-core@1.2.0
│   ├── bundles vite@8.3.4
│   │   └── uses rolldown@1.2.13
│   ├── bundles rolldown@1.2.13
│   └── bundles tsdown@0.23.1
├── depends on vitest@5.0.4
├── depends on oxlint@1.88.0
├── depends on oxlint-tsgolint@7.0.2004
├── depends on oxfmt@0.73.0
└── compiles vite-task
```

## Packages

Tooling dev dependencies (excluding framework-specific ones):

| Purpose | `vite/` (plain Vite) | `vite-plus/` (Vite+) |
| --- | --- | --- |
| Dev server and bundler | `vite` | `vite-plus` (aliases `vite` to `@voidzero-dev/vite-plus-core`) |
| Linter | `oxlint` | included |
| Formatter | `oxfmt` | included |
| Test runner | `vitest` | included (`vite-plus/test`) |
| Type-aware lint and type check | `vue-tsc` / `tsc` | included (`oxlint-tsgolint`) |
| Git hooks | `husky` | included (`vp hooks`) |
| Staged-file checks | `lint-staged` | included (`vp staged`, bundles lint-staged 17) |
| Library bundling | add `tsdown` yourself | included (`vp pack`) |
| Monorepo task runner and cache | add Turborepo or Nx yourself | included (`vp run`, Vite Task) |
| **Tooling packages to install** | **7** (`vite`, `vitest`, `oxlint`, `oxfmt`, `husky`, `lint-staged`, `typescript`) | **2** (`vite-plus`, `typescript`) |

`vite-plus/package.json`:

```json
"devDependencies": {
  "typescript": "~6.0.2",
  "vite": "npm:@voidzero-dev/vite-plus-core@1.2.0",
  "vite-plus": "1.2.0"
},
"overrides": { "vite": "npm:@voidzero-dev/vite-plus-core@1.2.0" }
```

The `vite` alias and the `overrides` entry make Vite plugins that import `vite` resolve to the Vite+ core, so the whole ecosystem keeps working.

## Commands

| Task | `vite/` (plain Vite) | `vite-plus/` (Vite+) |
| --- | --- | --- |
| Scaffold a project | `npm create vite@latest` | `vp create` |
| Move an existing Vite app over | n/a | `vp migrate` |
| Install dependencies | `npm install` / `pnpm install` / `yarn` / `bun install` | `vp install` (detects the package manager from the lockfile) |
| Dev server | `npm run dev` → `vite` | `vp dev` |
| Production build | `npm run build` → `vue-tsc -b && vite build` | `vp build` |
| Preview build | `npm run preview` → `vite preview` | `vp preview` |
| Lint | `npm run lint` → `oxlint` | `vp lint` |
| Format | `npm run format` → `oxfmt` | `vp fmt` |
| Format, lint and type check together | three separate commands | `vp check` (`vp check --fix` to auto-fix) |
| Tests | `npm test` → `vitest` | `vp test` |
| Staged-file checks | `npx lint-staged` | `vp staged` |
| Git hooks setup | `npx husky init` + `prepare` script | `vp hooks enable` / `vp config` |
| Build a library | `npx tsdown` | `vp pack` |
| Run a script or task | `npm run <name>` | `vp run <name>` (with caching) |
| Run a local binary | `npx <bin>` | `vp exec <bin>` |
| Show tool versions | `npm ls vite vitest oxlint ...` | `vp toolchain` |
| Node.js version management | nvm / fnm / volta | `vp env` |

In plain Vite every row except dev, build and preview needs a `package.json` script you wrote yourself. In Vite+ they are built-in commands. Note that `vp <name>` always runs the built-in command, and `vp run <name>` runs your `package.json` script, so `vp dev` and `vp run dev` can do different things.

## Configuration

**Plain Vite** spreads the tooling config over six places:

```text
vite/
├── vite.config.ts        # Vite
├── vitest.config.ts      # Vitest (merges vite.config.ts)
├── .oxlintrc.json        # Oxlint
├── .oxfmtrc.json         # Oxfmt
├── .husky/pre-commit     # Git hook
└── package.json          # scripts + "lint-staged" block
```

**Vite+** keeps lint, format, test and staged-file rules in `vite.config.ts`:

```ts
// vite-plus/vite.config.ts
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  test: {},
  staged: {
    "*": "vp check --fix",
  },
});
```

Tests import from `vite-plus/test` instead of `vitest`:

```ts
import { describe, expect, it } from "vite-plus/test";
```

## Pre-commit hooks

| | `vite/` | `vite-plus/` |
| --- | --- | --- |
| Hook manager | Husky 9 | `vp hooks` (Husky-compatible dispatcher, default dir `.vite-hooks/`) |
| Staged runner | lint-staged 17 | `vp staged` (bundles lint-staged 17) |
| Rules live in | `package.json` → `"lint-staged"` | `vite.config.ts` → `staged` |
| What runs | `oxlint --fix`, `oxfmt`, then `vitest run` | `vp check --fix` (format + lint + type check) |
| Skip once | `HUSKY=0 git commit ...` | `VP_GIT_HOOKS=0 git commit ...` (also honors `HUSKY=0`) |

A Git repo can have only one `core.hooksPath`. Because this repo holds both projects, a single Husky hook ([`vite/.husky/pre-commit`](vite/.husky/pre-commit)) runs the checks for both:

```sh
# vite/: lint-staged (oxlint + oxfmt) then unit tests
(cd vite && npx lint-staged && npx vitest run)
# vite-plus/: one built-in command, rules live in vite.config.ts
(cd vite-plus && npx vp staged)
```

In a standalone Vite+ repo you would run `vp hooks enable` instead and put `vp staged` in `.vite-hooks/pre-commit`.

## When to pick which

**Plain Vite** works well when:
- you want to choose each tool yourself (ESLint and Prettier instead of Oxlint and Oxfmt, for example)
- you already have a working setup and no reason to change it
- you want the smallest, most widely documented surface

**Vite+** works well when:
- you are starting a new project and want lint, format, test, hooks and builds working from day one
- you run a monorepo and want task caching without adding Turborepo or Nx
- your team works across several package managers or Node versions
- you want one version number to upgrade instead of six

## Running this repo

```bash
git clone https://github.com/saikumar001-sky/vite-vs-vite-plus.git
cd vite-vs-vite-plus

# plain Vite (this also installs the pre-commit hook)
cd vite && npm install && npm run dev

# Vite+
cd ../vite-plus && npm install && npx vp dev
```

Requires Node.js 22.22.1+ or 24.11+ (needed by lint-staged 17 / `vp staged`) and Git 2.32+.
