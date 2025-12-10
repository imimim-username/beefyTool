/**
 * Tests for configuration validation.
 * 
 * Tests the validation logic in src/core/config/validation.ts
 */

import { describe, it, expect } from "vitest";
import { validateConfig } from "../../src/core/config/validation.js";
import { StrategyConfig } from "../../src/core/config/model.js";
import { ConfigValidationError } from "../../src/core/utils/errors.js";

/**
 * Creates a valid base config for testing.
 */
function createValidConfig(): StrategyConfig {
  return {
    configVersion: 1,
    name: "Test Strategy",
    network: "optimism",
    strategyFamily: "solidly_lp",
    dex: "velodrome",
    lpTokenAddress: "0x1234567890123456789012345678901234567890",
    gaugeAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    rewardToken: "0x9876543210987654321098765432109876543210",
    routes: {
      rewardToNative: {
        from: "0x9876543210987654321098765432109876543210",
        to: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        path: [
          "0x9876543210987654321098765432109876543210",
          "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        ],
      },
      rewardToLp0: {
        from: "0x9876543210987654321098765432109876543210",
        to: "0x1111111111111111111111111111111111111111",
        path: [
          "0x9876543210987654321098765432109876543210",
          "0x1111111111111111111111111111111111111111",
        ],
      },
      rewardToLp1: {
        from: "0x9876543210987654321098765432109876543210",
        to: "0x2222222222222222222222222222222222222222",
        path: [
          "0x9876543210987654321098765432109876543210",
          "0x2222222222222222222222222222222222222222",
        ],
      },
    },
    vaultMode: "strategy-only",
    beefyCore: {
      keeper: "0x3333333333333333333333333333333333333333",
      vaultFactory: "0x4444444444444444444444444444444444444444",
      feeConfig: "0x5555555555555555555555555555555555555555",
      feeRecipient: "0x6666666666666666666666666666666666666666",
    },
    complexity: "basic",
  };
}

describe("validateConfig", () => {
  describe("valid config", () => {
    it("should pass validation for a valid config", () => {
      const config = createValidConfig();
      expect(() => validateConfig(config)).not.toThrow();
    });

    it("should pass validation with stakingAddress instead of gaugeAddress", () => {
      const config = createValidConfig();
      delete config.gaugeAddress;
      config.stakingAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe("invalid network", () => {
    it("should fail validation for unsupported network", () => {
      const config = createValidConfig();
      config.network = "polygon" as any;
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("network");
        expect((error as ConfigValidationError).code).toBe("CONFIG_VALIDATION_ERROR");
        expect((error as ConfigValidationError).message).toContain("Unsupported network");
      }
    });
  });

  describe("missing LP token", () => {
    it("should fail validation when lpTokenAddress is missing", () => {
      const config = createValidConfig();
      delete (config as any).lpTokenAddress;
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("lpTokenAddress");
      }
    });

    it("should fail validation when lpTokenAddress is invalid format", () => {
      const config = createValidConfig();
      config.lpTokenAddress = "invalid-address";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("lpTokenAddress");
        expect((error as ConfigValidationError).message).toContain("Invalid LP token address");
      }
    });

    it("should fail validation when lpTokenAddress is too short", () => {
      const config = createValidConfig();
      config.lpTokenAddress = "0x1234";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    it("should fail validation when lpTokenAddress is not hex", () => {
      const config = createValidConfig();
      config.lpTokenAddress = "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });
  });

  describe("invalid address format", () => {
    it("should fail validation for invalid rewardToken address", () => {
      const config = createValidConfig();
      config.rewardToken = "not-an-address";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("rewardToken");
        expect((error as ConfigValidationError).message).toContain("Invalid reward token address");
      }
    });

    it("should fail validation for invalid gaugeAddress", () => {
      const config = createValidConfig();
      config.gaugeAddress = "0xinvalid";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("gaugeAddress");
      }
    });

    it("should fail validation for invalid Beefy core addresses", () => {
      const config = createValidConfig();
      config.beefyCore.keeper = "invalid";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("beefyCore.keeper");
      }
    });
  });

  describe("routes with incorrect endpoints", () => {
    it("should fail when rewardToNative.from does not match rewardToken", () => {
      const config = createValidConfig();
      config.routes.rewardToNative.from = "0x0000000000000000000000000000000000000000";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("routes.rewardToNative.from");
        expect((error as ConfigValidationError).message).toContain("must match rewardToken");
      }
    });

    it("should fail when rewardToNative.to is not native token address", () => {
      const config = createValidConfig();
      config.routes.rewardToNative.to = "0x0000000000000000000000000000000000000000";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("routes.rewardToNative.to");
        expect((error as ConfigValidationError).message).toContain("native token address");
      }
    });

    it("should fail when rewardToLp0.from does not match rewardToken", () => {
      const config = createValidConfig();
      config.routes.rewardToLp0.from = "0x0000000000000000000000000000000000000000";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("routes.rewardToLp0.from");
        expect((error as ConfigValidationError).message).toContain("must match rewardToken");
      }
    });

    it("should fail when rewardToLp1.from does not match rewardToken", () => {
      const config = createValidConfig();
      config.routes.rewardToLp1.from = "0x0000000000000000000000000000000000000000";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("routes.rewardToLp1.from");
        expect((error as ConfigValidationError).message).toContain("must match rewardToken");
      }
    });

    it("should fail when rewardToNative.path does not start with from address", () => {
      const config = createValidConfig();
      config.routes.rewardToNative.path = [
        "0x0000000000000000000000000000000000000000",
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      ];
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("routes.rewardToNative.path");
        expect((error as ConfigValidationError).message).toContain("must start with from address");
      }
    });

    it("should fail when rewardToNative.path does not end with to address", () => {
      const config = createValidConfig();
      config.routes.rewardToNative.path = [
        "0x9876543210987654321098765432109876543210",
        "0x0000000000000000000000000000000000000000",
      ];
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("routes.rewardToNative.path");
        expect((error as ConfigValidationError).message).toContain("must end with to address");
      }
    });

    it("should fail when rewardToLp0.path is empty", () => {
      const config = createValidConfig();
      config.routes.rewardToLp0.path = [];
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("routes.rewardToLp0.path");
        expect((error as ConfigValidationError).message).toContain("must be a non-empty array");
      }
    });

    it("should fail when rewardToLp1.path contains invalid address", () => {
      const config = createValidConfig();
      // Put invalid address in the middle to test address validation
      // Note: validation checks path endpoints first, so we need to keep valid endpoints
      config.routes.rewardToLp1.path = [
        "0x9876543210987654321098765432109876543210",
        "invalid-address",
        "0x2222222222222222222222222222222222222222",
      ];
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("routes.rewardToLp1.path");
        expect((error as ConfigValidationError).message).toContain("Invalid token address");
      }
    });
  });

  describe("strategy name validation", () => {
    it("should fail when name contains path traversal", () => {
      const config = createValidConfig();
      config.name = "../../etc/passwd";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("name");
      }
    });

    it("should fail when name contains slashes", () => {
      const config = createValidConfig();
      config.name = "test/strategy";
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    it("should pass when name contains valid characters", () => {
      const config = createValidConfig();
      config.name = "Test-Strategy_123";
      
      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe("strategy family validation", () => {
    it("should fail for unsupported strategy family", () => {
      const config = createValidConfig();
      config.strategyFamily = "unsupported" as any;
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("strategyFamily");
      }
    });
  });

  describe("DEX validation", () => {
    it("should fail for unsupported DEX", () => {
      const config = createValidConfig();
      config.dex = "uniswap" as any;
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("dex");
      }
    });
  });

  describe("solidly_lp required fields", () => {
    it("should fail when both gaugeAddress and stakingAddress are missing", () => {
      const config = createValidConfig();
      delete config.gaugeAddress;
      delete (config as any).stakingAddress;
      
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      try {
        validateConfig(config);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).field).toBe("gaugeAddress");
        expect((error as ConfigValidationError).message).toContain("Either gaugeAddress or stakingAddress");
      }
    });
  });
});
