/**
 * Strategy family definitions.
 * 
 * Describes strategy families (e.g., Solidly LP) with:
 * - Required config fields
 * - Default values
 * - Template references
 */

import { StrategyFamily } from "../config/model.js";

/**
 * Strategy family definition.
 */
export interface StrategyFamilyDefinition {
  /** Required config fields for this family */
  requiredFields: string[];
  /** Default values for optional fields */
  defaults: Record<string, any>;
  /** Solidity template to use */
  template: string;
  /** Description of the strategy family */
  description: string;
}

/**
 * Strategy family definitions map.
 */
const STRATEGY_FAMILIES: Record<StrategyFamily, StrategyFamilyDefinition> = {
  solidly_lp: {
    requiredFields: [
      "lpTokenAddress",
      "gaugeAddress",
      "rewardToken",
      "routes",
    ],
    defaults: {
      complexity: "basic",
    },
    template: "StrategySolidlyLP.sol.ejs",
    description: "Solidly-style LP strategies (Velodrome, Aerodrome, etc.)",
  },
};

/**
 * Gets definition for a strategy family.
 * 
 * @param family - Strategy family identifier
 * @returns StrategyFamilyDefinition
 * @throws Error if family is not supported
 */
export function getStrategyFamily(family: StrategyFamily): StrategyFamilyDefinition {
  const definition = STRATEGY_FAMILIES[family];
  if (!definition) {
    throw new Error(`Unsupported strategy family: ${family}`);
  }
  return definition;
}

/**
 * Checks if a strategy family is supported.
 * 
 * @param family - Strategy family identifier to check
 * @returns true if family is supported
 */
export function isSupportedStrategyFamily(family: string): family is StrategyFamily {
  return family in STRATEGY_FAMILIES;
}
