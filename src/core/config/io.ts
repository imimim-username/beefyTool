/**
 * Configuration file I/O operations.
 * 
 * Handles reading and writing strategy-config.json files,
 * including config version migration support.
 */

import { StrategyConfig, ConfigVersion } from "./model.js";
import { migrateConfig } from "./migration.js";

/**
 * Current supported configuration version.
 */
export const CURRENT_CONFIG_VERSION: ConfigVersion = 1;

/**
 * Reads a strategy configuration from a JSON file.
 * 
 * @param configPath - Path to the strategy-config.json file
 * @returns Parsed and migrated StrategyConfig
 * @throws Error if file cannot be read or parsed
 */
export async function readConfigFile(configPath: string): Promise<StrategyConfig> {
  // TODO: Implement file reading and parsing
  throw new Error("Not implemented");
}

/**
 * Writes a strategy configuration to a JSON file.
 * 
 * @param config - StrategyConfig to write
 * @param outputPath - Path where the config file should be written
 * @throws Error if file cannot be written
 */
export async function writeConfigFile(
  config: StrategyConfig,
  outputPath: string
): Promise<void> {
  // TODO: Implement file writing
  throw new Error("Not implemented");
}

/**
 * Validates and migrates a configuration if needed.
 * 
 * @param config - Raw config object (may be from older version)
 * @returns Migrated StrategyConfig with current version
 */
export function validateAndMigrateConfig(config: any): StrategyConfig {
  const version = config.configVersion || 1;
  
  if (version < CURRENT_CONFIG_VERSION) {
    return migrateConfig(config, version, CURRENT_CONFIG_VERSION);
  }
  
  // TODO: Add validation
  return config as StrategyConfig;
}
