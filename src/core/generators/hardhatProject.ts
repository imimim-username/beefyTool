/**
 * Hardhat project layout generator.
 * 
 * Generates the base Hardhat project structure:
 * - contracts/ directory
 * - scripts/ directory
 * - test/ directory
 * - hardhat.config.ts
 * - package.json
 * - README.generated.md
 * - .env.example
 */

import { StrategyConfig } from "../config/model.js";

/**
 * Generates Hardhat project base files.
 * 
 * @param config - Strategy configuration
 * @param outputDir - Output directory for the project
 * @throws Error if generation fails
 */
export async function generateHardhatProject(
  config: StrategyConfig,
  outputDir: string
): Promise<void> {
  // TODO: Implement Hardhat project generation
  // 1. Create directory structure (contracts/, scripts/, test/)
  // 2. Generate hardhat.config.ts
  // 3. Generate package.json with dependencies
  // 4. Generate README.generated.md
  // 5. Generate .env.example
  
  throw new Error("Not implemented");
}
