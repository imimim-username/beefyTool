/**
 * Configuration version migration utilities.
 * 
 * Provides migration functions to transform older config versions
 * to the current version when the schema evolves.
 */

import { StrategyConfig, ConfigVersion } from "./model.js";
import { GenerationError } from "../utils/errors.js";

/**
 * Migration function type signature.
 * 
 * A migration function takes a config from one version and returns
 * a config for the next version.
 */
type MigrationFunction = (config: any) => any;

/**
 * Registry of migration functions.
 * 
 * Key format: `${fromVersion}->${toVersion}`
 * Each migration function transforms a config from `fromVersion` to `toVersion`.
 */
const migrationRegistry: Map<string, MigrationFunction> = new Map();

/**
 * Registers a migration function for a specific version transition.
 * 
 * @param fromVersion - Source version
 * @param toVersion - Target version
 * @param migrationFn - Function to perform the migration
 */
export function registerMigration(
  fromVersion: ConfigVersion,
  toVersion: ConfigVersion,
  migrationFn: MigrationFunction
): void {
  const key = `${fromVersion}->${toVersion}`;
  migrationRegistry.set(key, migrationFn);
}

/**
 * Migrates a configuration from one version to another.
 * 
 * This function handles step-by-step migrations (e.g., 1->2->3)
 * by chaining individual migration functions.
 * 
 * @param config - Configuration object to migrate
 * @param fromVersion - Source configuration version
 * @param toVersion - Target configuration version
 * @returns Migrated StrategyConfig
 * @throws GenerationError if migration is not supported
 */
export function migrateConfig(
  config: any,
  fromVersion: ConfigVersion,
  toVersion: ConfigVersion
): StrategyConfig {
  // If versions are the same, return as-is (with type assertion)
  if (fromVersion === toVersion) {
    return config as StrategyConfig;
  }

  // If downgrading, that's not supported
  if (fromVersion > toVersion) {
    throw new GenerationError(
      `Cannot downgrade config from version ${fromVersion} to ${toVersion}. Downgrades are not supported.`,
      "migration"
    );
  }

  // Step-by-step migration: migrate fromVersion -> fromVersion+1 -> ... -> toVersion
  let currentConfig = config;
  let currentVersion = fromVersion;

  while (currentVersion < toVersion) {
    const nextVersion = currentVersion + 1;
    const migrationKey = `${currentVersion}->${nextVersion}`;
    const migrationFn = migrationRegistry.get(migrationKey);

    if (!migrationFn) {
      throw new GenerationError(
        `Migration from version ${currentVersion} to ${nextVersion} is not implemented. ` +
        `Please implement the migration function and register it using registerMigration().`,
        "migration"
      );
    }

    try {
      currentConfig = migrationFn(currentConfig);
      currentVersion = nextVersion;
    } catch (error) {
      throw new GenerationError(
        `Migration from version ${currentVersion} to ${nextVersion} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "migration"
      );
    }
  }

  // Ensure the final config has the correct version
  currentConfig.configVersion = toVersion;

  return currentConfig as StrategyConfig;
}

/**
 * Gets the list of registered migrations.
 * 
 * @returns Array of migration keys in format "fromVersion->toVersion"
 */
export function getRegisteredMigrations(): string[] {
  return Array.from(migrationRegistry.keys());
}
