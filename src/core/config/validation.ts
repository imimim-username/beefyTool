/**
 * Configuration validation logic.
 * 
 * Validates StrategyConfig objects for correctness, including:
 * - Supported network values
 * - Supported strategy family and DEX values
 * - Address format validation
 * - Required fields based on vaultMode and strategy family
 * - Route coherence (start/end tokens match expected values)
 * - Strategy name filesystem safety
 */

import { StrategyConfig, Network, StrategyFamily, Dex } from "./model.js";
import { ConfigValidationError } from "../utils/errors.js";
import { isSupportedNetwork } from "../networks.js";
import { isSupportedStrategyFamily, getStrategyFamily } from "../beefy/strategyFamilies.js";

/**
 * Standard native token address (EIP-7528 convention).
 * Used to represent native ETH/tokens in swap routes.
 */
const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/**
 * Supported DEX values.
 */
const SUPPORTED_DEXES: Dex[] = ["velodrome", "aerodrome"];

/**
 * Validates a StrategyConfig object.
 * 
 * @param config - Configuration to validate
 * @throws ConfigValidationError if validation fails
 */
export function validateConfig(config: StrategyConfig): void {
  // Validate network
  if (!isSupportedNetwork(config.network)) {
    throw new ConfigValidationError(
      `Unsupported network: ${config.network}. Supported networks: mainnet, optimism, arbitrum, base`,
      "network"
    );
  }

  // Validate strategy family
  if (!isSupportedStrategyFamily(config.strategyFamily)) {
    throw new ConfigValidationError(
      `Unsupported strategy family: ${config.strategyFamily}. Supported families: solidly_lp`,
      "strategyFamily"
    );
  }

  // Validate DEX
  if (!SUPPORTED_DEXES.includes(config.dex)) {
    throw new ConfigValidationError(
      `Unsupported DEX: ${config.dex}. Supported DEXes: ${SUPPORTED_DEXES.join(", ")}`,
      "dex"
    );
  }

  // Validate strategy name is filesystem-safe
  if (!isFilesystemSafeName(config.name)) {
    throw new ConfigValidationError(
      `Strategy name contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed: ${config.name}`,
      "name"
    );
  }

  // Validate addresses format
  if (!isValidAddress(config.lpTokenAddress)) {
    throw new ConfigValidationError(
      `Invalid LP token address format: ${config.lpTokenAddress}`,
      "lpTokenAddress"
    );
  }

  if (!isValidAddress(config.rewardToken)) {
    throw new ConfigValidationError(
      `Invalid reward token address format: ${config.rewardToken}`,
      "rewardToken"
    );
  }

  // Validate required fields based on strategy family
  const familyDef = getStrategyFamily(config.strategyFamily);
  
  // For solidly_lp, either gaugeAddress or stakingAddress must be present
  if (config.strategyFamily === "solidly_lp") {
    if (!config.gaugeAddress && !config.stakingAddress) {
      throw new ConfigValidationError(
        "Either gaugeAddress or stakingAddress must be provided for solidly_lp strategy family",
        "gaugeAddress"
      );
    }
    if (config.gaugeAddress && !isValidAddress(config.gaugeAddress)) {
      throw new ConfigValidationError(
        `Invalid gauge address format: ${config.gaugeAddress}`,
        "gaugeAddress"
      );
    }
    if (config.stakingAddress && !isValidAddress(config.stakingAddress)) {
      throw new ConfigValidationError(
        `Invalid staking address format: ${config.stakingAddress}`,
        "stakingAddress"
      );
    }
  }

  // Validate Beefy core addresses
  if (!isValidAddress(config.beefyCore.keeper)) {
    throw new ConfigValidationError(
      `Invalid keeper address format: ${config.beefyCore.keeper}`,
      "beefyCore.keeper"
    );
  }
  if (!isValidAddress(config.beefyCore.vaultFactory)) {
    throw new ConfigValidationError(
      `Invalid vault factory address format: ${config.beefyCore.vaultFactory}`,
      "beefyCore.vaultFactory"
    );
  }
  if (!isValidAddress(config.beefyCore.feeConfig)) {
    throw new ConfigValidationError(
      `Invalid fee config address format: ${config.beefyCore.feeConfig}`,
      "beefyCore.feeConfig"
    );
  }
  if (!isValidAddress(config.beefyCore.feeRecipient)) {
    throw new ConfigValidationError(
      `Invalid fee recipient address format: ${config.beefyCore.feeRecipient}`,
      "beefyCore.feeRecipient"
    );
  }

  // Validate routes
  validateRoutes(config.routes, config.rewardToken);
}

/**
 * Validates swap routes for correctness.
 * 
 * @param routes - Routes configuration
 * @param rewardToken - Expected reward token address
 * @throws ConfigValidationError if routes are invalid
 */
function validateRoutes(routes: StrategyConfig["routes"], rewardToken: string): void {
  // Validate rewardToNative route
  if (!isValidAddress(routes.rewardToNative.from)) {
    throw new ConfigValidationError(
      `Invalid rewardToNative.from address format: ${routes.rewardToNative.from}`,
      "routes.rewardToNative.from"
    );
  }
  if (routes.rewardToNative.from.toLowerCase() !== rewardToken.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToNative.from (${routes.rewardToNative.from}) must match rewardToken (${rewardToken})`,
      "routes.rewardToNative.from"
    );
  }
  if (!isValidAddress(routes.rewardToNative.to)) {
    throw new ConfigValidationError(
      `Invalid rewardToNative.to address format: ${routes.rewardToNative.to}`,
      "routes.rewardToNative.to"
    );
  }
  // Native token should be the standard native address
  if (routes.rewardToNative.to.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToNative.to must be the native token address (${NATIVE_TOKEN_ADDRESS}), got: ${routes.rewardToNative.to}`,
      "routes.rewardToNative.to"
    );
  }
  if (!Array.isArray(routes.rewardToNative.path) || routes.rewardToNative.path.length === 0) {
    throw new ConfigValidationError(
      "rewardToNative.path must be a non-empty array",
      "routes.rewardToNative.path"
    );
  }
  // Validate path starts with 'from' and ends with 'to'
  if (routes.rewardToNative.path[0].toLowerCase() !== routes.rewardToNative.from.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToNative.path must start with from address (${routes.rewardToNative.from})`,
      "routes.rewardToNative.path"
    );
  }
  if (routes.rewardToNative.path[routes.rewardToNative.path.length - 1].toLowerCase() !== routes.rewardToNative.to.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToNative.path must end with to address (${routes.rewardToNative.to})`,
      "routes.rewardToNative.path"
    );
  }
  for (const token of routes.rewardToNative.path) {
    if (!isValidAddress(token)) {
      throw new ConfigValidationError(
        `Invalid token address in rewardToNative.path: ${token}`,
        "routes.rewardToNative.path"
      );
    }
  }

  // Validate rewardToLp0 route
  if (!isValidAddress(routes.rewardToLp0.from)) {
    throw new ConfigValidationError(
      `Invalid rewardToLp0.from address format: ${routes.rewardToLp0.from}`,
      "routes.rewardToLp0.from"
    );
  }
  if (routes.rewardToLp0.from.toLowerCase() !== rewardToken.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToLp0.from (${routes.rewardToLp0.from}) must match rewardToken (${rewardToken})`,
      "routes.rewardToLp0.from"
    );
  }
  if (!isValidAddress(routes.rewardToLp0.to)) {
    throw new ConfigValidationError(
      `Invalid rewardToLp0.to address format: ${routes.rewardToLp0.to}`,
      "routes.rewardToLp0.to"
    );
  }
  if (!Array.isArray(routes.rewardToLp0.path) || routes.rewardToLp0.path.length === 0) {
    throw new ConfigValidationError(
      "rewardToLp0.path must be a non-empty array",
      "routes.rewardToLp0.path"
    );
  }
  // Validate path starts with 'from' and ends with 'to'
  if (routes.rewardToLp0.path[0].toLowerCase() !== routes.rewardToLp0.from.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToLp0.path must start with from address (${routes.rewardToLp0.from})`,
      "routes.rewardToLp0.path"
    );
  }
  if (routes.rewardToLp0.path[routes.rewardToLp0.path.length - 1].toLowerCase() !== routes.rewardToLp0.to.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToLp0.path must end with to address (${routes.rewardToLp0.to})`,
      "routes.rewardToLp0.path"
    );
  }
  for (const token of routes.rewardToLp0.path) {
    if (!isValidAddress(token)) {
      throw new ConfigValidationError(
        `Invalid token address in rewardToLp0.path: ${token}`,
        "routes.rewardToLp0.path"
      );
    }
  }

  // Validate rewardToLp1 route
  if (!isValidAddress(routes.rewardToLp1.from)) {
    throw new ConfigValidationError(
      `Invalid rewardToLp1.from address format: ${routes.rewardToLp1.from}`,
      "routes.rewardToLp1.from"
    );
  }
  if (routes.rewardToLp1.from.toLowerCase() !== rewardToken.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToLp1.from (${routes.rewardToLp1.from}) must match rewardToken (${rewardToken})`,
      "routes.rewardToLp1.from"
    );
  }
  if (!isValidAddress(routes.rewardToLp1.to)) {
    throw new ConfigValidationError(
      `Invalid rewardToLp1.to address format: ${routes.rewardToLp1.to}`,
      "routes.rewardToLp1.to"
    );
  }
  if (!Array.isArray(routes.rewardToLp1.path) || routes.rewardToLp1.path.length === 0) {
    throw new ConfigValidationError(
      "rewardToLp1.path must be a non-empty array",
      "routes.rewardToLp1.path"
    );
  }
  // Validate path starts with 'from' and ends with 'to'
  if (routes.rewardToLp1.path[0].toLowerCase() !== routes.rewardToLp1.from.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToLp1.path must start with from address (${routes.rewardToLp1.from})`,
      "routes.rewardToLp1.path"
    );
  }
  if (routes.rewardToLp1.path[routes.rewardToLp1.path.length - 1].toLowerCase() !== routes.rewardToLp1.to.toLowerCase()) {
    throw new ConfigValidationError(
      `rewardToLp1.path must end with to address (${routes.rewardToLp1.to})`,
      "routes.rewardToLp1.path"
    );
  }
  for (const token of routes.rewardToLp1.path) {
    if (!isValidAddress(token)) {
      throw new ConfigValidationError(
        `Invalid token address in rewardToLp1.path: ${token}`,
        "routes.rewardToLp1.path"
      );
    }
  }

  // Note: We cannot validate that rewardToLp0.to and rewardToLp1.to match actual LP token0/token1
  // because we don't have LP token info yet. This will be validated in a later milestone.
}

/**
 * Validates that an address is in the correct format.
 * 
 * @param address - Address string to validate
 * @returns true if address format is valid
 */
export function isValidAddress(address: string): boolean {
  // Basic format check: must be 0x followed by 40 hex characters
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }
  
  // Optional: EIP-55 checksum validation
  // For now, we accept both checksummed and non-checksummed addresses
  // Full checksum validation would require implementing EIP-55 algorithm
  // or using a library like ethereumjs-util
  
  return true;
}

/**
 * Validates that a strategy name is safe for filesystem usage.
 * 
 * @param name - Strategy name to validate
 * @returns true if name is filesystem-safe
 */
export function isFilesystemSafeName(name: string): boolean {
  if (!name || name.length === 0) {
    return false;
  }
  
  // Check for path traversal attempts
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return false;
  }
  
  // Only allow alphanumeric characters, hyphens, underscores, and spaces
  // Spaces will be normalized in actual usage, but we allow them here
  // for user-friendly names that can be sanitized later
  if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
    return false;
  }
  
  // Prevent names that are just dots or start/end with special characters
  if (name.trim().length === 0) {
    return false;
  }
  
  return true;
}
