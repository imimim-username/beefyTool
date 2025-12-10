/**
 * Configuration file I/O operations.
 * 
 * Handles reading and writing strategy-config.json files,
 * including config version migration support.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { StrategyConfig, ConfigVersion } from "./model.js";
import { migrateConfig } from "./migration.js";
import { validateConfig } from "./validation.js";
import { FileSystemError, ConfigValidationError } from "../utils/errors.js";

/**
 * Current supported configuration version.
 */
export const CURRENT_CONFIG_VERSION: ConfigVersion = 1;

/**
 * Reads a strategy configuration from a JSON file.
 * 
 * @param configPath - Path to the strategy-config.json file
 * @returns Parsed and migrated StrategyConfig
 * @throws FileSystemError if file cannot be read
 * @throws ConfigValidationError if config is invalid
 */
export async function readConfigFile(configPath: string): Promise<StrategyConfig> {
  try {
    const fileContent = await readFile(configPath, "utf-8");
    const rawConfig = JSON.parse(fileContent);
    
    // Ensure configVersion is present
    if (rawConfig.configVersion === undefined) {
      throw new ConfigValidationError(
        "Missing required field: configVersion",
        "configVersion"
      );
    }
    
    // Validate and migrate if needed
    const migratedConfig = validateAndMigrateConfig(rawConfig);
    
    return migratedConfig;
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new ConfigValidationError(
        `Invalid JSON in config file: ${error.message}`,
        "json"
      );
    }
    // Check for Node.js file system errors
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError?.code === "ENOENT") {
      throw new FileSystemError(
        `Config file not found: ${configPath}`,
        configPath
      );
    }
    throw new FileSystemError(
      `Failed to read config file: ${error instanceof Error ? error.message : String(error)}`,
      configPath
    );
  }
}

/**
 * Writes a strategy configuration to a JSON file.
 * 
 * @param config - StrategyConfig to write
 * @param outputPath - Path where the config file should be written
 * @throws FileSystemError if file cannot be written
 * @throws ConfigValidationError if config is invalid
 */
export async function writeConfigFile(
  config: StrategyConfig,
  outputPath: string
): Promise<void> {
  try {
    // Ensure configVersion is set to current version
    const configWithVersion: StrategyConfig = {
      ...config,
      configVersion: CURRENT_CONFIG_VERSION,
    };
    
    // Validate before writing
    validateConfig(configWithVersion);
    
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError?.code !== "EEXIST") {
        throw error;
      }
    }
    
    // Write file with pretty formatting
    const jsonContent = JSON.stringify(configWithVersion, null, 2);
    await writeFile(outputPath, jsonContent, "utf-8");
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }
    if (error instanceof FileSystemError) {
      throw error;
    }
    throw new FileSystemError(
      `Failed to write config file: ${error instanceof Error ? error.message : String(error)}`,
      outputPath
    );
  }
}

/**
 * Validates and migrates a configuration if needed.
 * 
 * @param config - Raw config object (may be from older version)
 * @returns Migrated StrategyConfig with current version
 * @throws ConfigValidationError if config is invalid
 */
export function validateAndMigrateConfig(config: any): StrategyConfig {
  // Ensure configVersion is present
  if (config.configVersion === undefined || config.configVersion === null) {
    throw new ConfigValidationError(
      "Missing required field: configVersion",
      "configVersion"
    );
  }
  
  const version = config.configVersion as ConfigVersion;
  
  // Migrate if version is older than current
  let migratedConfig: StrategyConfig;
  if (version < CURRENT_CONFIG_VERSION) {
    migratedConfig = migrateConfig(config, version, CURRENT_CONFIG_VERSION);
  } else if (version > CURRENT_CONFIG_VERSION) {
    throw new ConfigValidationError(
      `Config version ${version} is newer than supported version ${CURRENT_CONFIG_VERSION}`,
      "configVersion"
    );
  } else {
    migratedConfig = config as StrategyConfig;
  }
  
  // Ensure migrated config has current version
  migratedConfig.configVersion = CURRENT_CONFIG_VERSION;
  
  // Validate the migrated config
  validateConfig(migratedConfig);
  
  return migratedConfig;
}
