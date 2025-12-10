# beefyTool – Development Roadmap & Checklist

This document is a **step-by-step development checklist** for building the beefyTool project.

- It assumes the architecture and structure described in `README.md` and `doc/architecture.md`.
- It is organized into **milestones**, each delivering a thin, working slice.
- Each milestone contains:
  - Suggested **branch name**
  - Scope
  - Detailed tasks as **checklists**
  - Tests & acceptance criteria
  - A rough complexity level: **basic → intermediate → advanced**

Developers can work through this in order, opening PRs per milestone (or grouping adjacent ones if appropriate).

---

## Conventions

- **Branch naming:** `feature/<short-description>`  
  e.g. `feature/init-repo-structure`, `feature/basic-solidly-generator`.

- **PR titles:** Use imperative language, e.g. _"Add Solidly LP strategy family"_.

- **Tech stack:**
  - Node.js **20+**
  - TypeScript
  - Hardhat for Solidity compilation & tests
  - React + Vite for the web UI
  - Vitest/Jest (or similar) for core TS tests

- **Config versioning:**  
  `StrategyConfig` includes a `configVersion` integer used to evolve `strategy-config.json` over time.

- **Testing:**
  - `npm test` for TS tests.
  - `npx hardhat compile` / `npx hardhat test` inside generated projects.

---

## Milestone 0 – Repo Initialization & Skeleton (Basic)

**Goal:** Create a clean, minimal TypeScript + Hardhat + React project skeleton that matches the high-level architecture, without implementing real generation logic.

**Branch:** `feature/init-repo-structure`

### Tasks

- [ ] Initialize a new Git repository.
- [ ] Add minimal `package.json` with:
  - [ ] Project metadata (name `beefyTool`, version, description).
  - [ ] Scripts:
    - [ ] `dev` → Vite dev server.
    - [ ] `build` → Vite build.
    - [ ] `test` → core TS tests.
    - [ ] `hardhat:compile` → `hardhat compile`.
    - [ ] `hardhat:test` → `hardhat test`.

- [ ] Add `tsconfig.json` with reasonable TS settings for Node + React + Hardhat.
- [ ] Add root-level `hardhat.config.ts` with:
  - [ ] Basic Solidity 0.8.x config.
  - [ ] TypeScript support.
  - [ ] Placeholder networks (no RPC URLs needed yet).

- [ ] Add basic Vite + React setup:
  - [ ] `src/web/main.tsx`
  - [ ] `src/web/App.tsx` with a “Hello, beefyTool” placeholder.

- [ ] Create directory layout:

  ```text
  src/
    core/
      config/
      generators/
      beefy/
      dex/
      utils/
    web/
    cli/
  templates/
  doc/
  tests/
  .env.example
  README.md
  development_checklist.md
  ```

- [ ] Add placeholder modules in `src/core/` with docstrings/stubs:
  - [ ] `core/index.ts`
  - [ ] `core/config/model.ts`
  - [ ] `core/config/io.ts`
  - [ ] `core/config/validation.ts`
  - [ ] `core/networks.ts`
  - [ ] `core/dex/solidlyVelodrome.ts`
  - [ ] `core/beefy/addressBook.ts`
  - [ ] `core/beefy/strategyFamilies.ts`
  - [ ] `core/generators/orchestrator.ts`
  - [ ] `core/generators/contracts.ts`
  - [ ] `core/generators/hardhatProject.ts`
  - [ ] `core/generators/deployScripts.ts`
  - [ ] `core/generators/tests.ts`
  - [ ] `core/utils/fsUtils.ts`
  - [ ] `core/utils/templating.ts`
  - [ ] `core/utils/prompts.ts`

- [ ] Add `.gitignore` (exclude `node_modules`, `.env`, `dist`, `out`, `artifacts`, `cache`, etc.).

### Tests / Acceptance Criteria

- [ ] `npm test` runs and passes a trivial placeholder test.
- [ ] `npm run dev` starts the Vite dev server without errors.
- [ ] `npm run hardhat:compile` (or `npx hardhat compile`) succeeds with a stub config.

**PR:** _Initialize repo structure and basic tooling_

---

## Milestone 1 – Config Model & Validation (Basic)

**Goal:** Define `StrategyConfig` and implement basic parsing & validation for Solidly LP strategies on the supported networks.

**Branch:** `feature/config-model-and-validation`

### Tasks

- [ ] In `src/core/config/model.ts`:
  - [ ] Define `StrategyConfig`, `ConfigVersion`, and related types.
  - [ ] Include fields for:
    - [ ] `configVersion`.
    - [ ] `name`, `network`, `strategyFamily`, `dex`.
    - [ ] `lpTokenAddress`, `gaugeAddress`/`stakingAddress`.
    - [ ] `rewardToken`.
    - [ ] `routes` (with typed structures for reward→native, reward→lp0, reward→lp1).
    - [ ] `vaultMode` (`'strategy-only' | 'vault-and-strategy'`).
    - [ ] `beefyCore` (keeper, vaultFactory, feeRecipient, feeConfig).
    - [ ] `complexity` (`'basic' | 'intermediate' | 'advanced'`).

- [ ] In `src/core/config/io.ts`:
  - [ ] Implement functions to read/write `strategy-config.json`.
  - [ ] Ensure `configVersion` is included and validated.

- [ ] In `src/core/config/validation.ts`:
  - [ ] Validate:
    - [ ] Supported `network` values.
    - [ ] Supported `strategyFamily` and `dex` values.
    - [ ] Address format (basic 0x checks, plus optional checksum check).
    - [ ] Presence of required fields given `vaultMode` and strategy family.
    - [ ] Route start/end tokens match reward/native/LP tokens.

- [ ] Add a clear error type (e.g. `ConfigValidationError`) with helpful messages.

### Tests / Acceptance Criteria

- [ ] `tests/core/configValidation.test.ts`:
  - [ ] Valid config passes.
  - [ ] Invalid network fails.
  - [ ] Missing LP token fails.
  - [ ] Invalid address format fails.
  - [ ] Routes with incorrect endpoints fail.

**PR:** _Add StrategyConfig model and validation_

---

## Milestone 2 – Network, DEX & Beefy Metadata (Basic)

**Goal:** Introduce metadata for Ethereum, Optimism, Arbitrum, and Base, plus minimal Velodrome/Aerodrome and Beefy addressBook entries.

**Branch:** `feature/networks-dex-beefy-metadata`

### Tasks

- [ ] In `src/core/networks.ts`:
  - [ ] Enumerate supported networks with:
    - [ ] Chain ID.
    - [ ] Default RPC env var key.
    - [ ] Optional suggested fork block.

- [ ] In `src/core/dex/solidlyVelodrome.ts`:
  - [ ] Define types for Solidly-style pools.
  - [ ] For each supported network:
    - [ ] Add router address (for Velodrome/Aerodrome/etc.).
    - [ ] Add factory address (if needed).
  - [ ] Provide helper functions such as:
    - [ ] `getRouterForNetwork(network, dex)`.
    - [ ] (Stub) `getLpTokenInfo(provider, lpTokenAddress)` for later enrichment.

- [ ] In `src/core/beefy/addressBook.ts`:
  - [ ] For each network:
    - [ ] Add entries for `vaultFactory`, `keeper`, `beefyFeeConfig`, `beefyFeeRecipient` (real or placeholder with docs).
  - [ ] Add helper accessors with descriptive errors for unsupported networks.

- [ ] In `src/core/beefy/strategyFamilies.ts`:
  - [ ] Define the initial `solidly_lp` family with:
    - [ ] Required fields.
    - [ ] Defaults where applicable.
    - [ ] Reference to the Solidity template to use.

### Tests / Acceptance Criteria

- [ ] `tests/core/beefyAddresses.test.ts`:
  - [ ] Resolving metadata for supported networks succeeds.
  - [ ] Unsupported network throws a clear, user-friendly error.

**PR:** _Add network, DEX, and Beefy metadata_

---

## Milestone 3 – Basic Generation Orchestrator (No Contracts Yet) (Basic)

**Goal:** Implement the generation orchestrator skeleton and project layout generator, without real Solidity contracts yet.

**Branch:** `feature/basic-generation-orchestrator`

### Tasks

- [ ] In `src/core/generators/hardhatProject.ts`:
  - [ ] Given an output directory and `StrategyConfig`, create:
    - [ ] `contracts/` (empty for now).
    - [ ] `scripts/` (empty).
    - [ ] `test/` (empty).
    - [ ] `hardhat.config.ts` (template or inline).
    - [ ] `package.json` (dependencies for Hardhat + TypeScript).
    - [ ] `README.generated.md` with a short description of the strategy.

- [ ] In `src/core/generators/orchestrator.ts`:
  - [ ] Implement `generateStrategyProject(config: StrategyConfig, outDir: string)`:
    - [ ] Validate config.
    - [ ] Create output directory structure.
    - [ ] Call `hardhatProject.ts` to scaffold project.
    - [ ] For now, have `contracts.ts`, `deployScripts.ts`, `tests.ts` invoked as no-op or placeholder.

- [ ] In `src/core/utils/fsUtils.ts`:
  - [ ] Implement safe directory creation and file write helpers (e.g., fail if directory exists unless a flag allows overwrite).

### Tests / Acceptance Criteria

- [ ] `tests/core/generators.test.ts`:
  - [ ] Given a valid `StrategyConfig` and temp directory:
    - [ ] `generateStrategyProject` creates expected folders and base files.
    - [ ] Generated `package.json` and `hardhat.config.ts` can be imported/parsed without errors.

**PR:** _Implement base generation pipeline (project layout only)_

---

## Milestone 4 – Solidity Templates for Solidly LP Strategies (Basic)

**Goal:** Generate a minimal, compilable Solidly LP strategy contract that follows modern Beefy patterns, plus an optional vault wrapper template.

**Branch:** `feature/basic-solidly-strategy-contracts`

### Tasks

- [ ] In `templates/solidity/StrategySolidlyLP.sol.j2`:
  - [ ] Create a minimal strategy contract template that:
    - [ ] Uses `pragma solidity ^0.8.0;`.
    - [ ] Imports appropriate OpenZeppelin 0.8 contracts.
    - [ ] Extends the correct Beefy base for Solidly LP strategies (to be chosen when integrating with Beefy’s code).
    - [ ] Uses a `StratFeeManager`/`CommonAddresses` pattern for shared addresses.
    - [ ] Declares key immutable fields: `want`, `gauge`, `router`, reward token, etc.
    - [ ] Encodes routes for harvest path (reward→native, reward→LP tokens).
    - [ ] Implements standard Beefy methods at least in minimal form (deposit, withdraw, harvest, emergency behavior).

- [ ] In `src/core/generators/contracts.ts`:
  - [ ] Render `StrategySolidlyLP.sol.j2` with context built from `StrategyConfig` and metadata.
  - [ ] Write it to `contracts/StrategySolidlyLP_<NormalizedName>.sol`.

- [ ] If `vaultMode === 'vault-and-strategy'`:
  - [ ] Add `templates/solidity/VaultWrapper.sol.j2` with:
    - [ ] Simple wrapper contract or initialization helper compatible with Beefy’s vault factory.
    - [ ] Name/symbol wiring and ownership transfer pattern.

### Tests / Acceptance Criteria

- [ ] In a generated sample project:
  - [ ] `npx hardhat compile` succeeds.
- [ ] Extend `tests/core/generators.test.ts` to check:
  - [ ] Strategy Solidity file is created.
  - [ ] Contains expected identifiers (e.g. `want`, `gauge`, `StratFeeManager`).

**PR:** _Add Solidly LP strategy Solidity templates and generator_

---

## Milestone 5 – Deployment Scripts & Vault/Strategy Toggle (Basic)

**Goal:** Generate Hardhat deployment scripts for both **strategy-only** and **vault+strategy** flows.

**Branch:** `feature/basic-deploy-scripts`

### Tasks

- [ ] In `templates/deploy/deployStrategy.ts.j2`:
  - [ ] Script that:
    - [ ] Assumes an existing vault address (passed via env or args).
    - [ ] Deploys the strategy contract.
    - [ ] Initializes it with appropriate constructor/initializer args.
    - [ ] Logs addresses and a summary.

- [ ] In `templates/deploy/deployVaultAndStrategy.ts.j2`:
  - [ ] Script that:
    - [ ] Uses `vaultFactory` to clone/create a vault when supported.
    - [ ] Initializes the vault (name, symbol, strategy).
    - [ ] Deploys the strategy contract and wires it to the vault.
    - [ ] Transfers vault ownership to the intended owner (Beefy’s owner or a configurable address).

- [ ] In `src/core/generators/deployScripts.ts`:
  - [ ] Always generate `scripts/deployStrategy.ts`.
  - [ ] Generate `scripts/deployVaultAndStrategy.ts` only when `vaultMode === 'vault-and-strategy'`.

### Tests / Acceptance Criteria

- [ ] In a generated sample project:
  - [ ] `npx hardhat compile` succeeds.
  - [ ] `npx hardhat run scripts/deployStrategy.ts --network hardhat` runs without runtime errors (minimal smoke test).
- [ ] Core tests:
  - [ ] Confirm that the correct deploy script(s) are generated based on `vaultMode`.

**PR:** _Add deploy scripts and vault/strategy mode toggle_

---

## Milestone 6 – Minimal Tests for Generated Strategies (Basic)

**Goal:** Provide a minimal Hardhat test template for each generated strategy.

**Branch:** `feature/basic-strategy-tests`

### Tasks

- [ ] In `templates/tests/basicStrategy.test.ts.j2`:
  - [ ] Create a test file that:
    - [ ] Deploys the generated strategy (and vault if applicable) on the Hardhat network.
    - [ ] Asserts:
      - [ ] `want` address matches config.
      - [ ] Key roles (keeper, strategist, vault) are set correctly.
      - [ ] Core view functions do not revert.

- [ ] In `src/core/generators/tests.ts`:
  - [ ] Render this template per strategy.
  - [ ] Write it to `test/basicStrategy.test.ts` (or a name derived from the strategy name).

### Tests / Acceptance Criteria

- [ ] In a sample generated project:
  - [ ] `npx hardhat test` passes.
- [ ] Core tests:
  - [ ] Confirm that a test file is generated and references expected contract names.

**PR:** _Add basic Hardhat tests for generated strategies_

---

## Milestone 7 – Web Wizard (Basic Solidly LP Flow) (Basic)

**Goal:** Implement a minimal, working web wizard that can build a basic Solidly LP `StrategyConfig` and run the generator.

**Branch:** `feature/web-wizard-basic-solidly`

### Tasks

- [ ] In `src/web/App.tsx`:
  - [ ] Implement a multi-step wizard:
    - [ ] Step 1: Strategy name + network selection.
    - [ ] Step 2: DEX + LP token + gauge/staking address.
    - [ ] Step 3: Reward token + routes.
    - [ ] Step 4: Beefy options (vault mode, strategist, etc.).
    - [ ] Step 5: Summary + “Generate” button.

- [ ] Implement:
  - [ ] `NetworkSelector.tsx` (dropdown).
  - [ ] `DexStrategyForm.tsx` (inputs for LP, gauge, reward token).
  - [ ] `VaultStrategyToggle.tsx` (radio buttons or switch).
  - [ ] `RoutesEditor.tsx` (manual route editing; auto-suggest later).
  - [ ] `SummaryView.tsx` (read-only config summary).
  - [ ] `OutputPreview.tsx` (optional preview of generated files/snippets).

- [ ] Implement `wizardState.ts` to hold and update `StrategyConfig`-compatible state.
- [ ] Wire the final step’s “Generate” button to call `generateStrategyProject` in `src/core/index.ts`, writing output under a configurable root (e.g. `out/`).

### Tests / Acceptance Criteria

- [ ] Manual:
  - [ ] Run `npm run dev`, walk through the wizard, generate a project.
  - [ ] In the generated project: `npm install`, `npx hardhat compile`, and `npx hardhat test` all succeed.

**PR:** _Add basic web wizard for Solidly LP generation_

---

## Milestone 8 – Config-Driven Mode & JSON Schema (Basic)

**Goal:** Add a non-interactive mode that reads `strategy-config.json` and runs the generator, plus documentation of the config format.

**Branch:** `feature/config-driven-generation`

### Tasks

- [ ] In `src/core/index.ts`:
  - [ ] Expose `generateFromConfigFile(configPath: string, outDir: string)`.

- [ ] Implement a simple CLI entry in `src/cli/main.ts`:
  - [ ] Support `--config` and `--out` flags.
  - [ ] Wire to `generateFromConfigFile`.

- [ ] Update `package.json` to expose a CLI bin (optional, can be `npx`-only at first).

- [ ] In `doc/config-format.md`:
  - [ ] Describe the JSON schema for basic Solidly LP configs.
  - [ ] Include an example config file.

### Tests / Acceptance Criteria

- [ ] `tests/e2e/basicSolidlyLPGeneration.test.ts`:
  - [ ] Use a fixture config file.
  - [ ] Run `generateFromConfigFile` into a temp dir.
  - [ ] Assert that:
    - [ ] Expected files are present.
    - [ ] `npx hardhat compile` and `npx hardhat test` succeed inside the generated project.

**PR:** _Add config-driven generation mode_

---

## Milestone 9 – Intermediate: Multiple Strategies per Repo (Intermediate)

**Goal:** Support generating multiple strategies into the same Hardhat project, plus basic multi-strategy UX.

**Branch:** `feature/intermediate-multi-strategy-support`

### Tasks

- [ ] Extend the config model:
  - [ ] Either introduce a `ProjectConfig` that can contain multiple `StrategyConfig` entries, or allow an array and treat it as multiple strategies.

- [ ] Update orchestrator:
  - [ ] Support generating:
    - [ ] One shared Hardhat project.
    - [ ] Multiple contracts, deploy scripts, and test files under that project.

- [ ] Update web UI:
  - [ ] Add the ability to add/remove multiple strategies in a single session.
  - [ ] Provide a combined summary view.

### Tests / Acceptance Criteria

- [ ] E2E test:
  - [ ] Given a config with two strategies, generate a project.
  - [ ] `npx hardhat compile` and `npx hardhat test` pass and cover both strategies.

**PR:** _Add multi-strategy project support_

---

## Milestone 10 – Advanced Features & Extensibility (Advanced)

**Goal:** Introduce advanced features while preserving basic & intermediate flows.

**Branch:** `feature/advanced-features`

### Ideas (choose selectively):

- [ ] Multiple reward tokens (e.g., solidly gauges with extra rewards).
- [ ] Custom hook insertion points:
  - [ ] Pre-/post-harvest.
  - [ ] Custom deposit/withdraw logic.
- [ ] Advanced fee configurations (e.g., choosing fee categories by label).
- [ ] Optional extra strategy parameters (e.g., performance tuning knobs).

### Tasks

- [ ] Extend `StrategyConfig` and templates to support selected advanced features.
- [ ] Update validation and generators accordingly.
- [ ] Add advanced examples & tests in `tests/fixtures/` and `tests/e2e/`.

### Tests / Acceptance Criteria

- [ ] Advanced fixtures generate valid projects.
- [ ] Advanced tests pass and do not break basic flows.

**PR:** _Add advanced strategy features and extension hooks_

---

## Milestone 11 – Documentation, UX Polish & CI (Basic/Intermediate)

**Goal:** Ensure the implementation fully aligns with `README.md` and `doc/architecture.md`, and provide a smooth developer and user experience.

**Branch:** `feature/docs-and-polish`

### Tasks

- [ ] Update `README.md`:
  - [ ] Confirm Quickstart is accurate and minimal.
  - [ ] Show both web wizard and config-driven workflows.

- [ ] Update `doc/architecture.md` if any changes were made compared to the initial design.
- [ ] Flesh out:
  - [ ] `doc/user-guide.md` – detailed examples of using the wizard and config mode.
  - [ ] `doc/config-format.md` – full config schema (basic/intermediate/advanced fields).
  - [ ] `doc/development-notes.md` – contributing guidelines, branch/PR conventions, how to run tests/CI.

- [ ] Confirm `.env.example` includes all env vars actually used in code and tests.
- [ ] (Optional) Add CI (e.g., GitHub Actions) to:
  - [ ] Install dependencies.
  - [ ] Run `npm test`.
  - [ ] Run a small E2E generation + `hardhat compile` check on a sample config.

### Tests / Acceptance Criteria

- [ ] Manual end-to-end:
  - [ ] Fresh clone of the repo.
  - [ ] Follow `README` Quickstart.
  - [ ] Confirm all steps work (wizard → generation → compile → test).

- [ ] CI (if configured) is green.

**PR:** _Align documentation, polish UX, and add CI_
