/**
 * Strategy configuration model definitions.
 * 
 * Defines the core types and interfaces for representing strategy configurations,
 * including StrategyConfig, ConfigVersion, and related types.
 */

/**
 * Configuration version number for schema evolution.
 */
export type ConfigVersion = number;

/**
 * Supported network identifiers.
 */
export type Network = "mainnet" | "optimism" | "arbitrum" | "base";

/**
 * Strategy family identifiers.
 */
export type StrategyFamily = "solidly_lp";

/**
 * DEX identifiers.
 */
export type Dex = "velodrome" | "aerodrome";

/**
 * Vault generation mode.
 */
export type VaultMode = "strategy-only" | "vault-and-strategy";

/**
 * Complexity level for strategy generation.
 */
export type Complexity = "basic" | "intermediate" | "advanced";

/**
 * Swap route structure for reward token conversions.
 */
export interface SwapRoute {
  /** Token address to swap from */
  from: string;
  /** Token address to swap to */
  to: string;
  /** Route path (array of token addresses) */
  path: string[];
}

/**
 * Routes configuration for harvest operations.
 */
export interface Routes {
  /** Route from reward token to native token */
  rewardToNative: SwapRoute;
  /** Route from reward token to LP token0 */
  rewardToLp0: SwapRoute;
  /** Route from reward token to LP token1 */
  rewardToLp1: SwapRoute;
}

/**
 * Beefy core infrastructure addresses.
 */
export interface BeefyCore {
  /** Keeper address */
  keeper: string;
  /** Vault factory address */
  vaultFactory: string;
  /** Fee configurator address */
  feeConfig: string;
  /** Fee recipient address */
  feeRecipient: string;
}

/**
 * Main strategy configuration type.
 * 
 * This type captures all information needed to generate a Beefy vault + strategy project.
 */
export interface StrategyConfig {
  /** Configuration version for schema evolution */
  configVersion: ConfigVersion;
  /** Human-readable strategy name */
  name: string;
  /** Target network */
  network: Network;
  /** Strategy family identifier */
  strategyFamily: StrategyFamily;
  /** DEX identifier */
  dex: Dex;
  /** LP token address */
  lpTokenAddress: string;
  /** Gauge or staking contract address */
  gaugeAddress?: string;
  /** Staking contract address (alternative to gaugeAddress) */
  stakingAddress?: string;
  /** Primary reward token address */
  rewardToken: string;
  /** Swap routes for harvest operations */
  routes: Routes;
  /** Vault generation mode */
  vaultMode: VaultMode;
  /** Beefy core infrastructure addresses */
  beefyCore: BeefyCore;
  /** Complexity level */
  complexity: Complexity;
}
