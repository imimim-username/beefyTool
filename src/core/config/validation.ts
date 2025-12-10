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

import { StrategyConfig } from "./model.js";
import { ConfigValidationError } from "../utils/errors.js";

/**
 * Validates a StrategyConfig object.
 * 
 * @param config - Configuration to validate
 * @throws ConfigValidationError if validation fails
 */
export function validateConfig(config: StrategyConfig): void {
  // TODO: Implement validation logic
  // - Check supported network values
  // - Check supported strategy family and DEX values
  // - Validate address format (0x checks, checksum)
  // - Check required fields based on vaultMode and strategy family
  // - Validate route start/end tokens match reward/native/LP tokens
  // - Validate strategy name is filesystem-safe
}

/**
 * Validates that an address is in the correct format.
 * 
 * @param address - Address string to validate
 * @returns true if address format is valid
 */
export function isValidAddress(address: string): boolean {
  // TODO: Implement address validation
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates that a strategy name is safe for filesystem usage.
 * 
 * @param name - Strategy name to validate
 * @returns true if name is filesystem-safe
 */
export function isFilesystemSafeName(name: string): boolean {
  // TODO: Implement filesystem safety validation
  // - No path traversal characters
  // - Valid characters only
  return /^[a-zA-Z0-9_-]+$/.test(name);
}
