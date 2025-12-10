/**
 * Test generator.
 * 
 * Generates minimal Hardhat test files for generated strategies.
 */

import { StrategyConfig } from "../config/model.js";

/**
 * Generates test files.
 * 
 * @param config - Strategy configuration
 * @param outputDir - Output directory for tests
 * @throws Error if generation fails
 */
export async function generateTests(
  config: StrategyConfig,
  outputDir: string
): Promise<void> {
  // TODO: Implement test generation
  // 1. Generate basicStrategy.test.ts from template
  // 2. Include basic smoke tests (deployment, want address, roles)
  
  throw new Error("Not implemented");
}
