/**
 * Deployment scripts generator.
 * 
 * Generates TypeScript deployment scripts for Hardhat:
 * - deployStrategy.ts (for strategy-only mode)
 * - deployVaultAndStrategy.ts (for vault-and-strategy mode)
 */

import { StrategyConfig } from "../config/model.js";

/**
 * Generates deployment scripts.
 * 
 * @param config - Strategy configuration
 * @param outputDir - Output directory for scripts
 * @throws Error if generation fails
 */
export async function generateDeployScripts(
  config: StrategyConfig,
  outputDir: string
): Promise<void> {
  // TODO: Implement deployment script generation
  // 1. Always generate deployStrategy.ts
  // 2. Generate deployVaultAndStrategy.ts if vaultMode === 'vault-and-strategy'
  
  throw new Error("Not implemented");
}
