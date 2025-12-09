/**
 * Text normalization utilities
 *
 * Handles character normalization and card name processing.
 */

/**
 * Normalize text by replacing special characters with ASCII equivalents.
 *
 * This prevents duplicate database records caused by inconsistent character encoding
 * from different data sources. For example:
 * - "Thassa's Oracle" (straight apostrophe from one source)
 * - "Thassa's Oracle" (curly apostrophe from another source)
 */
export function normalizeText(text: string): string {
  return (
    text
      // Normalize apostrophes (curly to straight)
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      // Normalize quotes (curly to straight)
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      // Normalize dashes (em/en dash to hyphen)
      .replace(/[\u2013\u2014]/g, "-")
      // Normalize ellipsis
      .replace(/\u2026/g, "...")
      // Trim whitespace
      .trim()
  );
}

/**
 * Extract front face name from a card name (for DFC lookup).
 * Double-faced cards are formatted as "Front // Back".
 */
export function getFrontFaceName(name: string): string {
  if (name.includes(" // ")) {
    return name.split(" // ")[0].trim();
  }
  return name;
}

/**
 * Check if a card name is a double-faced card (contains " // ").
 */
export function isDFCName(name: string): boolean {
  return name.includes(" // ");
}

