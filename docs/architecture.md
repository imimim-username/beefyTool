# beefyTool – Architecture

This document describes the internal architecture of the **beefyTool** project:  
how it is structured, how data flows through the system, and where different logic lives.

The goal is to give new contributors (including future-you) a clear mental model of the system so that:

- You can quickly find where to implement changes.
- You understand how components depend on each other.
- You can extend the tool without breaking existing behavior.

---

## 1. High-Level Overview

**beefyTool** is a TypeScript-based generator that creates fully structured Hardhat projects for Beefy-style vaults and strategies.

There are two main usage modes:

1. **Interactive web wizard** — a local React app that walks the user through:
   - Network selection (Ethereum, Optimism, Arbitrum, Base)
   - Strategy family selection (initially Solidly-style LP, e.g. Velodrome/Aerodrome)
   - LP & gauge/staking addresses
   - Reward token and swap routes
   - Beefy-specific configuration (fee config, keeper, strategist, etc.)

2. **Config-driven generation** — a non-interactive mode that reads a `strategy-config.json` file and generates a project from it.

The output is a **strategy project folder** containing:

- Solidity strategy contract(s) using Beefy’s modern Solidity 0.8 patterns (e.g. `StratFeeManager` and dynamic fee config).
- Optional vault cloning/initialization logic aligning with Beefy’s vault factory approach.
- Hardhat config & deployment scripts.
- Minimal tests verifying compilation and basic deployment behavior.

The architecture is organized around the following core concepts:

- **Config model** – how strategies are described as data.
- **Network/DEX metadata** – chain addresses, routers, and Beefy core infra.
- **Generators** – how config + templates are turned into actual files.
- **Templates** – Solidity/TypeScript/JSON templates used by generators.
- **Web UI** – the main entry point for user interaction.

---

## 2. Project Layout (Reminder)

```text
beefyTool/
├── .env.example
├── src/
│   ├── core/
│   │   ├── index.ts
│   │   ├── networks.ts
│   │   ├── dex/
│   │   │   ├── solidlyVelodrome.ts
│   │   │   └── routers.ts
│   │   ├── config/
│   │   │   ├── model.ts
│   │   │   ├── io.ts
│   │   │   └── validation.ts
│   │   ├── beefy/
│   │   │   ├── addressBook.ts
│   │   │   └── strategyFamilies.ts
│   │   ├── generators/
│   │   │   ├── orchestrator.ts
│   │   │   ├── contracts.ts
│   │   │   ├── hardhatProject.ts
│   │   │   ├── deployScripts.ts
│   │   │   └── tests.ts
│   │   └── utils/
│   │       ├── fsUtils.ts
│   │       ├── templating.ts
│   │       └── prompts.ts
│   ├── web/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── state/
│   └── cli/
│       ├── main.ts
│       └── commands.ts
├── templates/
├── doc/
├── tests/
├── package.json
├── hardhat.config.ts
└── vite.config.ts
```

The exact filenames may evolve, but the separation between **core**, **web**, **templates**, and **tests** should remain.

---

## 3. Core Concepts & Data Flow

At a high level, data flows as:

> Web UI / config file → `StrategyConfig` → Generators → Hardhat project (contracts + scripts + tests)

### 3.1 Strategy Config Model (`src/core/config/`)

The **config model** defines how strategies are represented as data.

Key types:

- `StrategyConfig`
  - `configVersion`: an integer for schema evolution.
  - `name`: human-readable label; also used for filenames and constructor args.
  - `network`: `'mainnet' | 'optimism' | 'arbitrum' | 'base'`.
  - `strategyFamily`: e.g. `'solidly_lp'` (Velodrome/Aerodrome-style gauge strategies).
  - `dex`: DEX identifier (e.g. `'velodrome'`, `'aerodrome'`).
  - `lpTokenAddress`: address of the LP token.
  - `gaugeAddress` or `stakingAddress`: address of the staking/gauge contract.
  - `rewardToken`: primary reward token address.
  - `routes`: structured routes for:
    - reward → native
    - reward → lpToken0
    - reward → lpToken1
  - `vaultMode`: `'strategy-only' | 'vault-and-strategy'`.
  - `beefyCore`: references to keeper, vaultFactory, feeConfig, feeRecipient, etc.
  - `complexity`: `'basic' | 'intermediate' | 'advanced'` (for future features).

`model.ts` declares these types.  
`validation.ts` enforces correctness (supported networks, valid addresses, route coherence, required fields per strategy family).  
`io.ts` handles reading/writing JSON config files.

---

## 4. Network, DEX, and Beefy Metadata

### 4.1 Networks (`src/core/networks.ts`)

Defines supported networks and their metadata:

- Chain IDs.
- Recommended RPC environment variable names (e.g. `MAINNET_RPC_URL`).
- Optional default fork block numbers (for reproducible fork tests).

Generators use this to:

- Validate `network` values.
- Build Hardhat network config for generated projects.

### 4.2 DEX Metadata (`src/core/dex/`)

`solidlyVelodrome.ts` encodes DEX-specific rules for the initial strategy family:

- Known routers and factory addresses per network.
- Any DEX-specific nuances (e.g., how gauges are structured).

`routers.ts` captures information about route behavior and supported swap paths so the UI can:

- Offer sensible default routes.
- Validate that each route starts and ends with the correct tokens.

### 4.3 Beefy Metadata (`src/core/beefy/`)

`addressBook.ts` stores Beefy-specific infrastructure addresses per network, such as:

- `vaultFactory` (for cloning vaults when `vault-and-strategy` mode is selected).
- `keeper`.
- `beefyFeeConfig`.
- `beefyFeeRecipient`.

`strategyFamilies.ts` describes, per strategy family:

- Required config fields.
- Default values (e.g., harvest delay, keeper usage).
- Which templates should be used for contracts and scripts.

---

## 5. Generators Layer (`src/core/generators/`)

Generators are responsible for turning a validated `StrategyConfig` into a concrete Hardhat project.

### 5.1 Orchestrator (`orchestrator.ts`)

The orchestrator is the main entry point for generation:

1. Validates the `StrategyConfig`.
2. Creates an output directory structure for the project.
3. Calls sub-generators:
   - `hardhatProject.ts` – base project files (package.json, hardhat config).
   - `contracts.ts` – actual Solidity contracts.
   - `deployScripts.ts` – TS deployment scripts.
   - `tests.ts` – minimal tests.
   - Metadata generators (e.g., generated README).

Adding a new strategy family should primarily involve adding templates and small extensions, not rewriting the orchestrator.

### 5.2 Hardhat Project Layout (`hardhatProject.ts`)

Creates a minimal Hardhat project:

```text
my-strategy/
├── contracts/
├── scripts/
├── test/
├── hardhat.config.ts
├── package.json
└── README.generated.md
```

This module wires:

- TypeScript support for scripts and tests.
- Network configuration using RPC URLs from environment variables.
- Optional fork settings for local integration tests.

### 5.3 Contracts Generator (`contracts.ts`)

Generates:

- The main **strategy contract**, using a template like `StrategySolidlyLP.sol.j2`.

  The template should:
  - Use `pragma solidity ^0.8.0;`.
  - Import compatible OpenZeppelin 0.8 contracts.
  - Extend the appropriate Beefy base for Solidly-style LP strategies.
  - Use a `StratFeeManager`/`CommonAddresses`-style pattern and dynamic fee config.
  - Wire in `want`, `gauge`, router, Beefy core addresses, and swap routes.
  - Include standard Beefy lifecycle methods (deposit, withdraw, harvest, emergency handling).

- Optionally, a thin **vault wrapper/initializer** when `vaultMode === 'vault-and-strategy'`, using a template such as `VaultWrapper.sol.j2`. This encapsulates:
  - Vault cloning via the Beefy vault factory.
  - Initialization with name, symbol, and strategy.
  - Ownership transfer to the canonical Beefy vault owner (or configurable owner).

### 5.4 Deployment Scripts (`deployScripts.ts`)

Generates TypeScript files such as:

- `scripts/deployStrategy.ts` – deploy only the strategy against an existing vault.
- `scripts/deployVaultAndStrategy.ts` – clone a vault, deploy strategy, initialize both, and transfer ownership.

These scripts are intentionally conservative:

- Designed for local testing and as a starting point.
- Do not assume live network deployment.
- Rely on environment variables for RPC URLs and optional deployer key.

### 5.5 Tests Generator (`tests.ts`)

Generates a minimal test file:

- Compiles contracts.
- Deploys strategy (and vault where applicable) on a Hardhat in-memory or forked chain.
- Performs basic smoke tests:
  - `want` address matches config.
  - Core roles (keeper, strategist, vault) are set.
  - Key view functions are callable.

---

## 6. Web UI Layer (`src/web/`)

The web UI is the primary interaction layer for end users.

Key pieces:

- `App.tsx` — top-level router/state orchestration for the wizard.
- `components/NetworkSelector.tsx` — chooses chain.
- `components/DexStrategyForm.tsx` — gathers LP, gauge, reward token, and DEX-specific info.
- `components/VaultStrategyToggle.tsx` — toggles between strategy-only vs vault+strategy modes.
- `components/RoutesEditor.tsx` — configures swap routes (with auto-suggestions where possible).
- `components/SummaryView.tsx` — shows a final summary of the assembled `StrategyConfig`.
- `components/OutputPreview.tsx` — shows code snippets and file structure previews before generation.
- `state/wizardState.ts` — encapsulates wizard state and actions.

On “Generate”, the UI:

1. Builds a `StrategyConfig` from state.
2. Validates it.
3. Calls into `core/index.ts` to run the orchestrator and write files to disk (e.g., under `out/<strategy-name>/`).

---

## 7. Templates (`templates/`)

The `templates/` directory holds all text templates used by generators.

- `solidity/`
  - `StrategySolidlyLP.sol.j2` – core Solidly LP strategy contract.
  - `VaultWrapper.sol.j2` – optional vault wrapper/initializer.

- `deploy/`
  - `deployStrategy.ts.j2`
  - `deployVaultAndStrategy.ts.j2`

- `tests/`
  - `basicStrategy.test.ts.j2`

- `metadata/`
  - `README.generated.md.j2`
  - `strategyConfig.json.j2`

Templates are **pure text** and should not contain business logic or validation. All decisions and data preparation happen in the TypeScript generator modules.

---

## 8. Testing Strategy

The `tests/` directory covers:

1. **Unit tests** (`tests/core/`):

   - Config parsing and validation.
   - Network/DEX/Beefy metadata helper functions.
   - Generators for contracts, Hardhat project layout, deploy scripts, and tests.

2. **Integration / end-to-end tests** (`tests/e2e/`):

   - Use example `StrategyConfig` fixtures for a Solidly-style LP on a supported network.
   - Run the full generation pipeline into a temporary directory.
   - Assert:
     - Expected files are created.
     - `npx hardhat compile` succeeds in the generated project.
     - `npx hardhat test` passes the basic strategy test.

This approach provides good regression protection while keeping test times reasonable.

---

## 9. Environment Variables and Security

beefyTool reads configuration from `.env` at the root of the tool:

- RPC URLs (`*_RPC_URL`).
- Optional private keys for local testing/evaluation.

Security guidelines:

- `.env` is never committed (enforced by `.gitignore`).
- Private keys are never logged.
- Generators only write files under an explicit output directory to avoid accidental overwrites.
- The tool **defaults to local Hardhat networks or forks**; if users adapt generated projects for live deployment, that is a separate, explicit step outside of beefyTool.

Generated projects can have their own `.env.example` for strategy-specific settings if desired.

---

## 10. Extension Points

The architecture is designed so that new features are predictable and localized:

- **Add a new network**
  - Update `src/core/networks.ts` with network metadata.
  - Update `src/core/beefy/addressBook.ts` with any Beefy infra addresses.

- **Add a new strategy family**
  - Add a new entry in `src/core/beefy/strategyFamilies.ts`.
  - Create new Solidity templates in `templates/solidity/`.
  - Extend the generators to handle family-specific behavior.
  - Add UI controls for new family-specific fields.

- **Add a CLI mode**
  - Implement commands in `src/cli/commands.ts`.
  - Wire them into `src/cli/main.ts` and `package.json` bin entry.

- **Add advanced “complexity” modes**
  - Extend `StrategyConfig` with advanced options.
  - Update generators to interpret advanced options (e.g., multiple reward tokens, custom hooks).
  - Add tests and docs to cover the new behavior.

---

## 11. Design Principles

The design of beefyTool follows these principles:

1. **Single Responsibility**  
   Each module does one thing: configuration, metadata, generation, or UI.

2. **Separation of Concerns**  
   Core generation logic lives under `src/core`.  
   Presentation/UI lives under `src/web`.  
   CLI adapters (if used) live under `src/cli`.  
   File content shapes live under `templates`.

3. **Config-Driven Behavior**  
   Generators operate solely from `StrategyConfig` plus network/DEX/Beefy metadata. This makes behavior predictable, reproducible, and easy to test.

4. **Extensibility First**  
   Adding new strategy families, networks, or UX variants should:
   - Add new modules and templates.
   - Require minimal changes to core interfaces.

5. **Safety & Clarity**  
   The tool:
   - Avoids live deployments by default.
   - Encourages local/fork testing workflows.
   - Provides clear error messages and validation feedback.
   - Targets power users who understand EVM basics but may not be deep Solidity experts.

With this architecture in mind, contributors can:

- Quickly locate the correct area to modify.
- Understand how user input becomes a fully generated Hardhat project.
- Extend the system without introducing fragile, cross-cutting changes.
