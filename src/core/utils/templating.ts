/**
 * EJS template rendering utilities.
 * 
 * Provides template rendering functionality using the EJS engine.
 */

import ejs from "ejs";
import { TemplateError } from "./errors.js";

/**
 * Renders an EJS template with the provided context.
 * 
 * @param templatePath - Path to the EJS template file
 * @param context - Template context (variables to interpolate)
 * @returns Rendered template string
 * @throws TemplateError if rendering fails
 */
export async function renderTemplate(
  templatePath: string,
  context: Record<string, any>
): Promise<string> {
  try {
    // TODO: Implement template rendering
    // - Read template file
    // - Render with EJS
    // - Return rendered string
    throw new Error("Not implemented");
  } catch (error) {
    throw new TemplateError(
      `Failed to render template ${templatePath}: ${error}`,
      templatePath
    );
  }
}

/**
 * Renders a template string directly (for inline templates).
 * 
 * @param templateString - EJS template string
 * @param context - Template context
 * @returns Rendered string
 * @throws TemplateError if rendering fails
 */
export function renderTemplateString(
  templateString: string,
  context: Record<string, any>
): string {
  try {
    return ejs.render(templateString, context);
  } catch (error) {
    throw new TemplateError(
      `Failed to render template string: ${error}`,
      "<inline>"
    );
  }
}
