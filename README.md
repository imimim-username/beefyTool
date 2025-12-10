# beefyTool

**beefyTool** is a modular, extensible TypeScript + Hardhat–based tool that interactively generates **ready-to-compile Beefy vault + strategy projects** for EVM chains.

Instead of hand-crafting Solidity contracts and deployment scripts, users answer a guided set of questions in a **local web UI**, and beefyTool outputs a complete Hardhat project containing:

- Strategy contract(s) that follow Beefy’s latest Solidity 0.8 patterns (e.g. `StratFeeManager`, dynamic fee config).
- Optional vault cloning/initialization logic, following Beefy’s factory pattern.
- TypeScript deployment scripts for Hardhat (strategy-only or vault+strategy).
- Minimal tests to confirm compilation and basic deployment on a local fork.

The repository is structured with clear separation of concerns so contributors can easily locate and modify individual components. Each major functional area lives in its own directory or module for clarity, maintainability, and extensibility.

---

## 📁 Project Structure Overview

```text
beefyTool/
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Web UI dev server / build config
├── hardhat.config.ts              # For internal tests/e2e of the generator itself
├── src/
│   ├── core/                      # Core generation logic (no UI)
│   │   ├── index.ts               # Public API: generate from config / wizard
│   │   ├── config/
│   │   │   ├── model.ts           # StrategyConfig types
│   │   │   ├── io.ts              # Read/write strategy-config.json
│   │   │   └── validation.ts      # Validation logic
│   │   ├── networks.ts            # Supported chains (mainnet, optimism, arbitrum, base)
│   │   ├── dex/
│   │   │   ├── solidlyVelodrome.ts# Solidly-style DEX metadata (Velodrome/Aerodrome, etc.)
│   │   │   └── routers.ts         # Router metadata / helpers
│   │   ├── beefy/
│   │   │   ├── addressBook.ts     # Beefy infra addresses (vaultFactory, feeConfig, keeper, etc.)
│   │   │   └── strategyFamilies.ts# Strategy family definitions (initially: Solidly LP)
│   │   ├── generators/
│   │   │   ├── orchestrator.ts    # Orchestrates full project generation
│   │   │   ├── contracts.ts       # Generates Solidity contracts
│   │   │   ├── hardhatProject.ts  # Generates Hardhat project skeleton
│   │   │   ├── deployScripts.ts   # Generates TS deploy scripts
│   │   │   └── tests.ts           # Generates basic Hardhat tests
│   │   └── utils/
│   │       ├── fsUtils.ts         # Filesystem helpers
│   │       ├── templating.ts      # Template rendering helpers
│   │       └── prompts.ts         # Shared logic for any future CLI usage
│   ├── web/                       # React-based web UI
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── NetworkSelector.tsx
│   │   │   ├── DexStrategyForm.tsx
│   │   │   ├── VaultStrategyToggle.tsx
│   │   │   ├── RoutesEditor.tsx
│   │   │   ├── SummaryView.tsx
│   │   │   └── OutputPreview.tsx
│   │   └── state/
│   │       └── wizardState.ts     # Wizard state container
│   └── cli/                       # Optional CLI entry (future)
│       ├── main.ts
│       └── commands.ts
├── templates/                     # All text templates used by generators (EJS format)
│   ├── solidity/
│   │   ├── StrategySolidlyLP.sol.ejs
│   │   └── VaultWrapper.sol.ejs
│   ├── deploy/
│   │   ├── deployStrategy.ts.ejs
│   │   └── deployVaultAndStrategy.ts.ejs
│   ├── tests/
│   │   └── basicStrategy.test.ts.ejs
│   └── metadata/
│       ├── README.generated.md.ejs
│       └── strategyConfig.json.ejs
├── generated-examples/            # Example outputs for reference (optional)
├── docs/
│   ├── architecture.md
│   ├── config-format.md
│   ├── user-guide.md
│   ├── development-notes.md
│   └── troubleshooting.md
├── tests/
│   ├── core/
│   │   ├── configValidation.test.ts
│   │   ├── generators.test.ts
│   │   └── beefyAddresses.test.ts
│   └── e2e/
│       └── basicSolidlyLPGeneration.test.ts
├── development_checklist.md
└── .gitignore
```

The exact filenames and module splits can evolve, but the separation between **core generator**, **web UI**, **templates**, and **tests** should remain.

---

## 🌱 What This Project Does

**Target users:** power DeFi users who want their own custom Beefy strategies but aren’t full-time Solidity devs.

beefyTool provides:

- A **local web wizard** (running on a local development server) for guided creation:
  - Network (Ethereum, Optimism, Arbitrum, Base)
  - DEX + strategy family (starting with Solidly-style LP strategies such as Velodrome/Aerodrome)
  - Want LP token, gauge/staking contract, reward token
  - Beefy-specific fields (keeper, strategist, feeConfig, router, etc.) with sensible defaults

- A **config-driven mode**, using a `strategy-config.json` file (supports CLI and programmatic usage).

- A **mode toggle** between:
  - **Strategy-only** generation (contracts + deploy script targeting an existing vault).
  - **Vault+Strategy** generation that follows Beefy’s vault-factory cloning and initialization patterns.

- Automatic creation of:
  - Strategy contract using the latest Beefy patterns (Solidity 0.8, dynamic fee config via fee configurator).
  - Optional vault wrapper/initialization logic.
  - Hardhat project layout (including a sample test).
  - A generated README for the strategy project.

The generated output is a complete Hardhat project that can be compiled and run on localhost forks, and later adapted into a Beefy PR or personal deployment.

**⚠️ Important Security Note:** Generated contracts are starting points and should be reviewed by experienced Solidity developers before mainnet deployment. This tool does not perform security audits or vulnerability scanning. Always test thoroughly on testnets first.

---

## 🔑 Environment Variables (`.env.example`)

Users copy `.env.example` → `.env`.  
`.env` is automatically ignored via `.gitignore` to protect secrets.

Example:

```bash
# RPC URLs (use archival or stable full nodes where possible)
MAINNET_RPC_URL=
OPTIMISM_RPC_URL=
ARBITRUM_RPC_URL=
BASE_RPC_URL=

# Optional private key for local/fork deployments ONLY
# ⚠️ WARNING: Never use mainnet private keys. Use test keys only.
# ⚠️ Only used for local Hardhat network or fork testing.
DEPLOYER_PRIVATE_KEY=

# Optional default strategist address (can also be set in the wizard/config)
STRATEGIST_ADDRESS=

# Optional logging overrides
LOG_LEVEL=info
```

These are used when:

- Running generated tests that depend on `hardhat.config.ts`.
- Running generated deployment scripts against a local Hardhat network or fork.
- Optionally doing manual local deployments to a fork.  
  (beefyTool does **not** auto-deploy to live networks.)

---

## 🚀 Quickstart

**Prerequisites:**

- Node.js **20+**
- `npm` or `yarn` (examples below use `npm`)
- Git

### 1. Install dependencies

```bash
git clone <your-repo-url> beefyTool
cd beefyTool
cp .env.example .env  # fill in RPC URLs and any local testing keys
npm install
```

### 2. Run the web wizard

```bash
npm run dev
```

This starts both the Vite dev server (for the React UI) and a local API server (for file generation).  
Open `http://localhost:3000` in your browser.

**Note:** The web UI communicates with a local Node.js API server to perform file generation. This architecture keeps filesystem operations secure and isolated from the browser.

### 3. Walk through the wizard

You’ll be asked to provide:

- **Strategy name**  
  (e.g. `Moo Velodrome USDC-USDT`).

- **Network**  
  (Ethereum, Optimism, Arbitrum, Base).

- **DEX + pool details**:
  - LP token address
  - Gauge / staking contract address
  - Reward token address

- **Routes**:
  - Reward → native
  - Reward → LP token0
  - Reward → LP token1  
  The wizard can auto-suggest routes based on known routers and token lists, but you can override them.

- **Beefy options**:
  - Strategy family (initially: Solidly LP)
  - Strategy vs Vault+Strategy mode
  - Strategist and Beefy core addresses (with defaults from the internal address book)

### 4. Review & generate

The UI shows a preview of:

- Solidity strategy contract code
- Optional vault wrapper
- Hardhat deployment script(s)
- Minimal test

Click **Generate** to write them into a local output folder (e.g. `./out/moo-velodrome-usdc-usdt/`).

### 5. Use the generated project

```bash
cd out/moo-velodrome-usdc-usdt
npm install
npx hardhat compile
npx hardhat test
```

You can then adapt the project for your own deployment or for a Beefy PR.

---

## 🧩 Core Concepts

- **StrategyConfig**  
  A typed configuration model capturing everything needed to generate a strategy:
  - Network, DEX, LP token, gauge/staking contract, reward tokens
  - Fee config & Beefy core addresses
  - Swap routes
  - Strategy family parameters
  - Vault mode

- **Strategy Families**  
  A set of templates describing how different categories of Beefy strategies behave.  
  Initial focus: **Solidly-style LP strategies** (Velodrome/Aerodrome-like gauges).

- **Generators**  
  Modules that turn `StrategyConfig` into:
  - Solidity contracts
  - Hardhat deployment scripts
  - Minimal tests
  - Generated metadata/README

- **Templates**  
  EJS (Embedded JavaScript) templates for Solidity, TypeScript, and JSON—no business logic, just structure and data interpolation. Templates are rendered by the generator modules.

- **Web Wizard**  
  A React UI that builds a StrategyConfig, validates it, and invokes generators.

---

## 🧪 Tests

Tests include:

- **Unit tests** (in `tests/core/`):
  - Config parsing & validation
  - Network/DEX metadata & addressBook resolution
  - Generators (contracts, Hardhat project, deploy scripts)

- **End-to-end tests** (in `tests/e2e/`):
  - Given a sample Solidly LP config, run the full pipeline:
    - Build `StrategyConfig`
    - Generate project into a temp directory
    - Assert that key files exist and compile under Hardhat
    - Run a basic deployment test against a local Hardhat network or fork
    - Validate that generated contracts have correct structure and basic functionality

---

## 📖 Documentation

- `docs/architecture.md`  
  High-level system design: modules, data flows, and extension points.

- `docs/config-format.md`  
  JSON schema for `strategy-config.json`, including basic/intermediate/advanced fields.

- `docs/user-guide.md`  
  Step-by-step walkthroughs for:
  - Using the web wizard
  - Editing a config file directly
  - Consuming the generated projects

- `docs/development-notes.md`  
  Contributing guidelines, branch naming, PR expectations, how to run tests, and CI notes.

- `docs/troubleshooting.md`  
  Common issues, solutions, and FAQ.

## 🔧 Technical Details

### Template Engine

beefyTool uses **EJS (Embedded JavaScript)** templates (`.ejs` extension) for generating all code files. EJS provides:
- Familiar JavaScript syntax for template logic
- Good TypeScript/Node.js ecosystem support
- Sufficient expressiveness for contract and script generation

Templates are rendered by `src/core/utils/templating.ts` using the `ejs` npm package.

### Beefy Contract Dependencies

Generated projects depend on Beefy's contract interfaces and base contracts. The recommended approach:
- **Primary:** Generated projects include Beefy contracts via npm package (e.g., `@beefy/contracts` if available) or git submodule
- **Fallback:** Users manually install Beefy contracts from the official repository
- Generated `package.json` includes instructions for installing dependencies

### Web UI Architecture

The web UI runs in a browser but communicates with a local Node.js API server (started alongside the Vite dev server) to:
- Validate configurations
- Generate files to disk
- Access filesystem safely

This separation ensures:
- Browser security is maintained
- File operations are secure
- The core generation logic can be reused by CLI and programmatic APIs

---

## 🤝 Contributing

Contributions are welcome. Recommended flow:

1. Pick a milestone from `development_checklist.md`.
2. Create a branch like `feature/<short-description>`.
3. Implement the tasks for that milestone.
4. Add/extend tests and ensure they pass.
5. Open a PR with a clear, imperative title (e.g. "Add basic Solidly LP strategy generator").

Keep documentation and architecture in sync with actual behavior as features evolve.

## ⚠️ Security & Safety

- **Generated code review required:** All generated contracts should be reviewed by experienced Solidity developers before deployment.
- **Test thoroughly:** Always test generated strategies on testnets before mainnet use.
- **No security audits:** This tool does not perform security audits. Users are responsible for security assessments.
- **Private key safety:** Never use mainnet private keys in `.env`. Only use test keys for local development.

## 🐛 Troubleshooting

See `docs/troubleshooting.md` for common issues and solutions. Common topics:
- Template rendering errors
- Config validation failures
- Hardhat compilation issues
- AddressBook resolution problems
