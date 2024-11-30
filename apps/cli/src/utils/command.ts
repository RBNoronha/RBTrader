import { logger } from "@opentrader/logger";
import type { CommandResult } from "../types.js";

/**
 * Return a wrapper what will process an async function and log the result
 * @param asyncFunc - async function to process
 */
export function handle<T extends any[], U>(
  asyncFunc: (...args: T) => Promise<CommandResult<U>> | CommandResult<U>,
) {
  return async (...args: T): Promise<void> => {
    try {
      const { result } = await asyncFunc(...args);

      if (result) {
        logger.info(result);
      }
    } catch (error) {
      console.error(error);
    }
  };
}

/**
 * Switch language between "pt" and "en"
 * @param language - The language to switch to
 */
export function switchLanguage(language: "pt" | "en"): void {
  if (language !== "pt" && language !== "en") {
    throw new Error(`Invalid language: ${language}. Valid values are: pt, en`);
  }

  // Logic to switch language
  logger.info(`Language switched to: ${language}`);
}
