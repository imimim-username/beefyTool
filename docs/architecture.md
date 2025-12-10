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

1. **Interactive web wizard** — a local React app (with backend API server) that walks the user through:
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
- **Network/DEX metadata** – chain addresses and Beefy core infra.
- **Generators** – how config + templates are turned into actual files.
- **Templates** – EJS templates for Solidity, TypeScript, and JSON used by generators.
- **Web UI** – React-based interface with local API server for file generation.
- **Error handling** – typed error system for validation, generation, and filesystem operations.

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
│   │   │   └── solidlyVelodrome.ts
│   │   ├── config/
│   │   │   ├── model.ts
│   │   │   ├── io.ts
│   │   │   ├── validation.ts
│   │   │   └── migration.ts
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
│   │       ├── prompts.ts
│   │       └── errors.ts
│   ├── web/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── state/
│   └── cli/
│       ├── main.ts
│       └── commands.ts
├── templates/
├── docs/
├── tests/
├── src/
│   └── server/           # Local API server for web UI (Express/Node)
│       ├── index.ts
│       └── routes.ts
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
`validation.ts` enforces correctness (supported networks, valid addresses, route coherence, required fields per strategy family, filesystem-safe names).  
`io.ts` handles reading/writing JSON config files and triggers migrations for older config versions.  
`migration.ts` provides config version migration utilities when the schema evolves.

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

- Any DEX-specific nuances (e.g., how gauges are structured).
- (Optional) Helper functions for LP token info retrieval.

**Note:** Router addresses are not needed here. Strategies use Beefy's router from the addressBook (part of `CommonAddresses`), not separate DEX routers.

Route validation currently checks token addresses match; future versions may validate route existence via Beefy's router on a fork.

### 4.3 Beefy Metadata (`src/core/beefy/`)

`addressBook.ts` stores Beefy-specific infrastructure addresses per network, such as:

- `vaultFactory` (for cloning vaults when `vault-and-strategy` mode is selected).
- `keeper`.
- `beefyFeeConfig`.
- `beefyFeeRecipient`.

**Maintenance:** Addresses should be periodically validated against on-chain state. Future versions may support dynamic address resolution via on-chain registries or APIs. Manual updates are required when Beefy infrastructure changes.

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
- Instructions for installing Beefy contract dependencies (npm package, git submodule, or manual installation).

**Beefy Contract Dependencies:** Generated projects need access to Beefy's base contracts and interfaces. The recommended approach is:
1. If an npm package exists (`@beefy/contracts`), include it in `package.json`.
2. Otherwise, document manual installation from the Beefy repository.
3. Generated projects include clear instructions in their README.

### 5.3 Contracts Generator (`contracts.ts`)

Generates:

- The main **strategy contract**, using a template like `StrategySolidlyLP.sol.ejs`.

  The template should:
  - Use `pragma solidity ^0.8.0;`.
  - Import compatible OpenZeppelin 0.8 contracts.
  - Extend the appropriate Beefy base for Solidly-style LP strategies.
  - Use a `StratFeeManager`/`CommonAddresses`-style pattern and dynamic fee config.
  - Wire in `want`, `gauge`, Beefy core addresses (including router from `CommonAddresses`), and swap routes.
  - Include standard Beefy lifecycle methods (deposit, withdraw, harvest, emergency handling).

- Optionally, a thin **vault wrapper/initializer** when `vaultMode === 'vault-and-strategy'`, using a template such as `VaultWrapper.sol.ejs`. This encapsulates:
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

## 6. Web UI Layer (`src/web/`) & API Server (`src/server/`)

The web UI runs in a browser but communicates with a local Node.js API server to perform file generation operations securely.

### 6.1 Web UI Components (`src/web/`)

Key pieces:

- `App.tsx` — top-level router/state orchestration for the wizard.
- `components/NetworkSelector.tsx` — chooses chain.
- `components/DexStrategyForm.tsx` — gathers LP, gauge, reward token, and DEX-specific info.
- `components/VaultStrategyToggle.tsx` — toggles between strategy-only vs vault+strategy modes.
- `components/RoutesEditor.tsx` — configures swap routes as simple arrays of token addresses.
- `components/SummaryView.tsx` — shows a final summary of the assembled `StrategyConfig`.
- `components/OutputPreview.tsx` — shows code snippets and file structure previews before generation.
- `components/ErrorDisplay.tsx` — displays validation and generation errors to users.
- `state/wizardState.ts` — encapsulates wizard state and actions.

### 6.2 API Server (`src/server/`)

The API server provides secure access to filesystem and core generation functions:

- `routes.ts` — API endpoints:
  - `POST /api/validate` — validates a `StrategyConfig`.
  - `POST /api/generate` — generates a project from a `StrategyConfig`.
  - `GET /api/health` — server health check.
- `index.ts` — Express server setup and Vite proxy configuration.

**Architecture Rationale:** This separation ensures:
- Browser security is maintained (no direct filesystem access).
- File operations are isolated and secure.
- Core generation logic can be reused by CLI and programmatic APIs.
- Error handling is centralized in the server layer.

On "Generate", the flow is:

1. UI builds a `StrategyConfig` from state.
2. UI sends config to `POST /api/validate` for validation.
3. If valid, UI sends config to `POST /api/generate`.
4. Server calls `core/index.ts` to run the orchestrator.
5. Server writes files to disk (e.g., under `out/<strategy-name>/`).
6. Server returns success/error response to UI.

---

## 7. Templates (`templates/`)

The `templates/` directory holds all **EJS (Embedded JavaScript)** templates used by generators. Files use the `.ejs` extension.

- `solidity/`
  - `StrategySolidlyLP.sol.ejs` – core Solidly LP strategy contract.
  - `VaultWrapper.sol.ejs` – optional vault wrapper/initializer.

- `deploy/`
  - `deployStrategy.ts.ejs`
  - `deployVaultAndStrategy.ts.ejs`

- `tests/`
  - `basicStrategy.test.ts.ejs`

- `metadata/`
  - `README.generated.md.ejs`
  - `strategyConfig.json.ejs`

**Template Engine:** EJS is used because:
- Familiar JavaScript syntax.
- Good TypeScript/Node.js ecosystem support.
- Sufficient expressiveness for contract and script generation.
- Rendered by `src/core/utils/templating.ts` using the `ejs` npm package.

**Template Guidelines:**
- Templates are **pure text** and should not contain business logic or validation.
- All decisions and data preparation happen in the TypeScript generator modules.
- Template variables are sanitized before rendering to prevent injection attacks.
- Complex logic should be computed in generators and passed as simple data to templates.

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
     - Generated contracts have correct structure (smoke tests for key functions).

**Future Testing Enhancements:**
- Integration tests that validate strategy logic (harvest, withdraw, deposit flows).
- Gas estimation checks to ensure generated strategies are efficient.
- Fork-based tests that validate generated strategies against real on-chain state.

This approach provides good regression protection while keeping test times reasonable.

---

## 9. Environment Variables and Security

beefyTool reads configuration from `.env` at the root of the tool:

- RPC URLs (`*_RPC_URL`).
- Optional private keys for local testing/evaluation.

Security guidelines:

- `.env` is never committed (enforced by `.gitignore`).
- Private keys are never logged and should only be used for local/fork testing.
- Generators only write files under an explicit output directory to avoid accidental overwrites.
- File paths are sanitized to prevent directory traversal attacks.
- Strategy names are validated for filesystem safety before use in paths.
- Template variables are sanitized/escaped to prevent code injection.
- The tool **defaults to local Hardhat networks or forks**; if users adapt generated projects for live deployment, that is a separate, explicit step outside of beefyTool.

**Generated Code Security:**
- Generated contracts are starting points and must be reviewed by experienced Solidity developers.
- The tool does not perform security audits or vulnerability scanning.
- Generated projects include security warnings in their README.
- Users are responsible for security assessments before deployment.

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

---

## 12. Error Handling

beefyTool uses a typed error system defined in `src/core/utils/errors.ts`:

- **ConfigValidationError** — validation failures (invalid network, missing fields, etc.).
- **GenerationError** — errors during file generation (template rendering, filesystem issues).
- **TemplateError** — template rendering errors (missing variables, syntax errors).
- **FileSystemError** — filesystem operation failures (permission denied, path issues).

Error propagation:
1. Core modules throw typed errors.
2. Orchestrator catches and wraps errors with context.
3. API server converts errors to HTTP responses with user-friendly messages.
4. CLI converts errors to console output with actionable guidance.
5. Web UI displays errors to users in a helpful format.

Error recovery:
- Validation errors prevent generation and provide specific feedback.
- Generation errors attempt cleanup of partial file generation.
- Filesystem errors are caught before critical operations.

---

## 13. Config Versioning & Migration

The `StrategyConfig` includes a `configVersion` integer for schema evolution. When the config schema changes:

1. Increment the current `configVersion` in `model.ts`.
2. Implement a migration function in `config/migration.ts` that transforms older configs to the new format.
3. Update `io.ts` to automatically call migrations when loading older configs.
4. Document breaking changes in `docs/config-format.md`.

Migration functions follow the pattern:
```typescript
migrateConfig(config: any, fromVersion: number, toVersion: number): StrategyConfig
```

Migrations should be:
- Idempotent (safe to run multiple times).
- Backward-compatible where possible.
- Well-documented with deprecation notices.

---

## 14. Performance Considerations

Generation performance targets:
- Single strategy generation: < 5 seconds on modern hardware.
- Multi-strategy projects: linear scaling with number of strategies.

Optimization strategies:
- Template compilation can be cached (EJS compiles to functions).
- File operations are batched where possible.
- Heavy operations (route validation, on-chain queries) are optional and can be deferred.

For large projects:
- Consider incremental generation (only regenerate changed files).
- Support generation in background workers if needed.

---

## 15. Dependency Management

**Internal Dependencies:**
- Core modules should use dependency injection for external services (RPC providers, filesystem).
- This makes testing easier and allows swapping implementations.

**Generated Project Dependencies:**
- Hardhat projects depend on Beefy contracts and OpenZeppelin.
- Primary: npm package if available (`@beefy/contracts`).
- Fallback: git submodule or manual installation instructions.
- Generated `package.json` includes all required dependencies with version constraints.

**Version Compatibility:**
- Document supported Solidity versions.
- Document OpenZeppelin version compatibility.
- Document Hardhat version requirements.
