/**
 * Error types and utilities.
 * 
 * Defines typed error classes for different error scenarios:
 * - ConfigValidationError
 * - GenerationError
 * - TemplateError
 * - FileSystemError
 */

/**
 * Base error class for beefyTool errors.
 */
export class BeefyToolError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration validation error.
 */
export class ConfigValidationError extends BeefyToolError {
  constructor(message: string, public readonly field?: string) {
    super(message, "CONFIG_VALIDATION_ERROR");
  }
}

/**
 * Generation error.
 */
export class GenerationError extends BeefyToolError {
  constructor(message: string, public readonly step?: string) {
    super(message, "GENERATION_ERROR");
  }
}

/**
 * Template rendering error.
 */
export class TemplateError extends BeefyToolError {
  constructor(message: string, public readonly templatePath?: string) {
    super(message, "TEMPLATE_ERROR");
  }
}

/**
 * Filesystem operation error.
 */
export class FileSystemError extends BeefyToolError {
  constructor(message: string, public readonly path?: string) {
    super(message, "FILESYSTEM_ERROR");
  }
}
