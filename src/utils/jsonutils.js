// src/utils/jsonUtils.js

/**
 * Removes // and /* *\/ style comments from JSON-like text
 * so that JSON.parse() can work safely.
 */
export function stripJsonComments(text) {
  return text
    // remove /* block comments */
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // remove // line comments
    .replace(/\/\/.*$/gm, "");
}
