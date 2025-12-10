/**
 * Generation orchestrator.
 * 
 * Orchestrates the full project generation process:
 * 1. Validates StrategyConfig
 * 2. Creates output directory structure
 * 3. Calls sub-generators (hardhatProject, contracts, deployScripts, tests)
 */

import { StrategyConfig } from "../config/model.js";
import { validateConfig } from "../config/validation.js";

/**
 * Generates a complete strategy project from a StrategyConfig.
 * 
 * @param config - Strategy configuration
 * @param outDir - Output directory for the generated project
 * @throws Error if generation fails
 */
export async function generateStrategyProject(
  config: StrategyConfig,
  outDir: string
): Promise<void> {
  // Validate config
  validateConfig(config);
  
  // TODO: Implement generation logic
  // 1. Create output directory structure
  // 2. Call hardhatProject generator
  // 3. Call contracts generator
  // 4. Call deployScripts generator
  // 5. Call tests generator
  
  throw new Error("Not implemented");
}
