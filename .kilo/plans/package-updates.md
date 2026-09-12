# Package Dependency Update Plan

## Strategy

Update all packages step-by-step, verifying the project still works (lint, build, dev) after each phase. Each phase is designed to be self-contained with minimal risk.

---

## Phase 0: Setup

1. Create a git branch: `git checkout -b chore/update-dependencies`
2. Verify current state:
   - `npm run build:icons`
   - `npm run lint`
   - `npm run build`
3. Delete `package-lock.json` and `node_modules`, re-install with `npm install` to get a clean baseline.

---

## Phase 1: Safe updates (same-major, non-breaking)

Update pinned package versions to latest within their current major version. These should not break anything.

### Dependencies:
| Package | Current | Target | Reason |
|---------|---------|--------|--------|
| `@floating-ui/dom` | `1.6.8` | `^1.7.6` | Pinned, minor bump |
| `vuetify` | `3.7.5` | `^3.12.8` | Pinned, same major (3.x) |
| `vite-plugin-vuetify` | `2.0.3` | `^2.1.3` | Pinned, minor bump |
| `vue3-apexcharts` | `1.5.2` | `^1.11.1` | Pinned, same major (1.x) |
| `@iconify-json/bx` | `^1.2.2` | check latest | Within range |
| `@iconify-json/bxl` | `^1.2.2` | check latest | Within range |
| `@iconify-json/bxs` | `^1.2.2` | check latest | Within range |
| `@iconify-json/fa` | `^1.2.1` | check latest | Within range |
| `@iconify-json/mdi` | `^1.2.1` | check latest | Within range |
| `boxicons` | `^2.1.4` | check latest | Within range |
| `prismjs` | `^1.29.0` | check latest | Within range |
| `roboto-fontface` | `^0.10.0` | check latest | Within range |
| `webfontloader` | `^1.6.28` | check latest | Within range |
| `vue-prism-component` | `^2.0.0` | check latest | Within range |
| `sass` | `~1.76.0` | `^1.100.0` | Tilde range, major behind |

### Dev Dependencies:
| Package | Current | Target | Reason |
|---------|---------|--------|--------|
| `@antfu/utils` | `^0.7.10` | check latest | Within range |
| `@iconify/tools` | `^4.0.7` | check latest | Within range |
| `@iconify/utils` | `^2.1.13` | check latest | Within range |
| `postcss-html` | `^1.7.0` | check latest | Within range |
| `postcss-scss` | `^4.0.9` | check latest | Within range |
| `@tailwindcss/vite` | `^4.3.0` | check latest | Within range |
| `tailwindcss` | `^4.3.0` | check latest | Within range |
| `tsx` | `^4.19.2` | check latest | Within range |
| `unplugin-auto-import` | `^0.18.6` | check latest | Within 0.x range |
| `unplugin-vue-components` | `^0.27.5` | check latest | Within 0.x range |
| `vite-svg-loader` | `^5.1.0` | check latest | Within range |

### Steps:
1. Update each pinned dep to use `^` range targeting latest within same major
2. Run `npm install`
3. Verify: `npm run build:icons && npm run lint && npm run build`
4. Commit: `git commit -m "chore: update dependencies to latest within major version"`

---

## Phase 2: ESLint migration — flat config (BREAKING)

The most complex change. Replace legacy `.eslintrc.cjs` + `@antfu/eslint-config-vue@0.43.1` with `@antfu/eslint-config` v9 using flat config.

### Remove these devDependencies (many are subsumed by `@antfu/eslint-config`):
- `@antfu/eslint-config-vue` (deprecated, replaced by `@antfu/eslint-config`)
- `eslint-config-airbnb-base` (not needed)
- `eslint-plugin-import` (replaced by `eslint-plugin-import-lite` bundled in antfu)
- `eslint-import-resolver-typescript` (replaced by built-in resolver in antfu)
- `eslint-plugin-promise` (bundled: `eslint-plugin-n` covers this)
- `eslint-plugin-case-police` (check if bundled — may need separate install)
- `eslint-plugin-regex` (custom internal rules — migrate to flat config format)
- `eslint-plugin-sonarjs` (not bundled — may need separate install or drop)
- `eslint-plugin-unicorn` (bundled in antfu v9)
- `eslint-plugin-regexp` (bundled in antfu v9)
- `eslint-plugin-vue` (bundled in antfu v9)

### Install:
- `eslint@^9.10.0`
- `@antfu/eslint-config@^9.0.0`

### Create `eslint.config.js` (flat config):
- Translate all rules and settings from `.eslintrc.cjs` to flat config format
- Use `antfu()` factory with appropriate options (vue, typescript, formatters)
- Include custom regex rule via `eslint-plugin-regex` or migrate to flat format
- Configure `eslint-plugin-sonarjs` and `eslint-plugin-case-police` if needed (not bundled)
- Handle the auto-import globals via flat config
- Set ignore patterns

### Remove:
- `.eslintrc.cjs`
- `.eslintrc-auto-import.json` (auto-import globals configured differently in flat config)

### Update `package.json` scripts:
- Remove `--config .eslintrc.cjs` and `-c .eslintrc.cjs` from lint script (flat config auto-detected)
- Adjust `--ext` flags (not needed with flat config)

### Steps:
1. Remove old eslint devDependencies
2. Install new packages
3. Write `eslint.config.js`
4. Remove old config files
5. Update lint script in `package.json`
6. Run `npm install`
7. Verify: `npm run lint --fix`
8. Build check: `npm run build`
9. Commit: `git commit -m "refactor: migrate eslint to flat config with @antfu/eslint-config v9"`

---

## Phase 3: Stylelint package cleanup

### Remove:
- `stylelint-codeguide@2.0.0` (deprecated — already replaced by `@stylistic/stylelint-config` and `@stylistic/stylelint-plugin` in `.stylelintrc.json`)

### Update:
- `stylelint` pinned `16.18.0` → `^17.13.0` (or latest 17.x) — **major version change**
- `stylelint-config-standard-scss` pinned `13.1.0` → `^17.0.0`
- `@stylistic/stylelint-config` `^1.0.1` → `^5.0.0`
- `stylelint-config-idiomatic-order` pinned `10.0.0` → check if still compatible
- `stylelint-use-logical-spec` pinned `5.0.1` → check latest

### Verify `.stylelintrc.json` compatibility:
- Rules may need updates for new version syntax
- Check if `@stylistic/stylelint-plugin` version 5 config still works

### Steps:
1. Remove `stylelint-codeguide`
2. Update stylelint-related deps to latest within their new majors
3. Run `npm install`
4. Verify: `npm run lint` (if stylelint is part of lint script, otherwise manual check)
5. Build: `npm run build`
6. Commit: `git commit -m "chore: update stylelint packages and remove deprecated stylelint-codeguide"`

---

## Phase 4: Bump to Vite 6 (medium risk)

Vite 5 → 6 involves breaking changes. Need to update:
- `vite` `^5.4.11` → `^6.x`
- `@vitejs/plugin-vue` `^5.2.1` → `^6.x`
- `@vitejs/plugin-vue-jsx` `^4.1.1` → `^5.x`

### Steps:
1. Update packages in package.json
2. Run `npm install`
3. Check `vite.config.js` for any deprecated APIs
4. Verify: `npm run build:icons && npm run lint && npm run build`
5. Commit: `git commit -m "chore: update vite to v6 and related plugins"`

---

## Phase 5: VueUse, Pinia, Vue Router (medium risk)

These are commonly used packages with migration guides:

### VueUse:
- `@vueuse/core` `^10.11.1` → `^14.3.0` (2 major bumps)
- `@vueuse/math` `^10.11.1` → `^14.3.0`
- Check VueUse v11→v14 migration notes for any breaking changes in composables used

### Pinia:
- `pinia` `^2.3.0` → `^3.0.4`
- Check Pinia v3 migration guide (main change: removal of `_pina` internals)

### Vue Router:
- `vue-router` `^4.5.0` → `^5.1.0`
- Check Vue Router v5 migration guide

### Steps:
1. Update each package in package.json (one at a time or together)
2. Run `npm install`
3. Verify lint + build
4. Commit: `git commit -m "chore: update vueuse, pinia, vue-router to latest"`

---

## Phase 6: ApexCharts + vue3-apexcharts (low-medium risk)

- `apexcharts` pinned `3.49.2` → `^5.14.0` (2 major bumps)
- `vue3-apexcharts` already at `^1.11.1` (updated in Phase 1)
- Check if `vue3-apexcharts` v1 is compatible with apexcharts v5
- May need to update `vue3-apexcharts` to latest if there's a compatibility issue

### Steps:
1. Update `apexcharts`
2. Run `npm install`
3. Verify build
4. Commit: `git commit -m "chore: update apexcharts to v5"`

---

## Phase 7: Vite 7 or 8 (higher risk, optional)

If the project is stable after Phase 4, consider bumping Vite further:
- `vite` → `^7.x` or `^8.x`
- Related vite plugins as needed
- This is higher risk and may require changes to vite config

### Steps (optional):
1. Update vite and related packages
2. Run `npm install`
3. Verify everything
4. Commit

---

## Phase 8: Final verification

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` from scratch
3. Verify no deprecation warnings in npm install output
4. Run full build
5. Run lint
6. Start dev server and verify app works in browser
7. Run `npm audit` to check for any remaining vulnerabilities
8. Merge the branch if everything passes

---

## Verification checks after each phase

```powershell
# After each phase, run:
npm run build:icons
npm run lint
npm run build
# If any command fails, roll back the phase and investigate
```
