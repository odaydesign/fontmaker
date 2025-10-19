/**
 * Font Metrics and Typography Constants
 * Ported from Python FontForge script for consistent typography
 */

// Comprehensive typographic metrics (in font units)
export const TYPEFACE_METRICS = {
  // Core metrics
  unitsPerEm: 1000,
  ascender: 800,        // 80% of em square
  descender: -200,      // 20% of em square
  xHeight: 500,         // 50% of em square
  capHeight: 700,       // 70% of em square
  lineGap: 200,         // 20% of em square

  // Width metrics
  defaultWidth: 512,    // Slightly wider than half em square
  defaultSpacing: 50,   // 5% of em square
  wordSpacing: 250,     // 25% of em square
  sentenceSpacing: 500, // 50% of em square

  // Character width ratios
  narrowWidth: 0.45,    // For i, l, I, J
  mediumWidth: 0.55,    // For a, e, n, o
  wideWidth: 0.85,      // For m, w

  // Optical size
  opticalSize: 12,      // Default for body text

  // Side bearings
  leftSideBearing: 0.05,   // 5% of character width
  rightSideBearing: 0.05,  // 5% of character width

  // Overshoot for round characters
  overshoot: 20,        // 2% of em square
};

// Character width classifications
export const CHAR_WIDTH_CLASSES = {
  narrow: ['i', 'l', 'I', 'J', 'f', 't', '1'],
  medium: [
    'a', 'b', 'c', 'd', 'e', 'g', 'h', 'j', 'k', 'n', 'o', 'p', 'q', 'r', 's', 'u', 'v', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z',
    '2', '3', '4', '5', '6', '7', '8', '9', '0'
  ],
  wide: ['m', 'w', 'M', 'W']
};

// Round characters that need overshoot
export const ROUND_CHARS = ['o', 'O', 'e', 'E', 'c', 'C', 'g', 'G', 'p', 'P', 'q', 'Q', 'b', 'B', 'd', 'D'];

// List of straight-sided glyphs (prone to collision)
export const STRAIGHT_GLYPHS = ['F', 'I', 'T', 'L', 'E', 'H', 'K', 'Z'];

// Minimum and maximum side bearing (in font units)
export const MIN_SIDE_BEARING = 5;
export const MAX_SIDE_BEARING = 40;

// Comprehensive kerning pairs with optimized values
export const DEFAULT_KERNING_PAIRS: Record<string, number> = {
  // Uppercase combinations
  'AV': -50, 'AW': -50, 'AY': -50, 'Ta': -30, 'Te': -30, 'To': -30, 'Tr': -30, 'Tu': -30,
  'Ty': -30, 'Va': -40, 'Ve': -40, 'Vo': -40, 'Wa': -40, 'We': -40, 'Wo': -40, 'Ya': -40,
  'Ye': -40, 'Yo': -40, 'FA': -30, 'FE': -30, 'FO': -30, 'Fr': -30, 'FT': -30,

  // Lowercase combinations
  'av': -20, 'aw': -20, 'ay': -20, 'fa': -20, 'fe': -20, 'fo': -20, 'fr': -20, 'ft': -20,
  'ta': -20, 'te': -20, 'to': -20, 'tr': -20, 'tt': -20, 'tu': -20, 'ty': -20, 'va': -20,
  've': -20, 'vo': -20, 'wa': -20, 'we': -20, 'wo': -20, 'ya': -20, 'ye': -20, 'yo': -20,

  // Number combinations
  '1a': -20, '1e': -20, '1o': -20, '1u': -20, '1y': -20,
  '2a': -15, '2e': -15, '2o': -15, '2u': -15, '2y': -15,
  '3a': -15, '3e': -15, '3o': -15, '3u': -15, '3y': -15,
  '4a': -15, '4e': -15, '4o': -15, '4u': -15, '4y': -15,
  '5a': -15, '5e': -15, '5o': -15, '5u': -15, '5y': -15,
  '6a': -15, '6e': -15, '6o': -15, '6u': -15, '6y': -15,
  '7a': -15, '7e': -15, '7o': -15, '7u': -15, '7y': -15,
  '8a': -15, '8e': -15, '8o': -15, '8u': -15, '8y': -15,
  '9a': -15, '9e': -15, '9o': -15, '9u': -15, '9y': -15,
  '0a': -15, '0e': -15, '0o': -15, '0u': -15, '0y': -15,

  // Positive kerning for problematic pairs
  'FT': 20, 'TF': 20, 'FI': 10, 'IF': 10, 'TI': 10, 'IT': 10,
  'TT': 15, 'FF': 15, 'II': 10
};

/**
 * Get character width classification
 */
export function getCharacterWidthClass(char: string): 'narrow' | 'medium' | 'wide' {
  if (CHAR_WIDTH_CLASSES.narrow.includes(char)) return 'narrow';
  if (CHAR_WIDTH_CLASSES.wide.includes(char)) return 'wide';
  return 'medium';
}

/**
 * Calculate side bearings for a character
 */
export function calculateSideBearings(
  char: string,
  glyphWidth: number
): { left: number; right: number } {

  // Special case for F and I: moderate right side bearing
  if (char === 'F' || char === 'I') {
    const left = Math.max(20, Math.min(Math.floor(glyphWidth * 0.12), 40));
    const right = Math.max(25, Math.min(Math.floor(glyphWidth * 0.10), 50));
    return { left, right };
  }

  // Special case for T
  if (char === 'T') {
    const left = Math.max(20, Math.min(Math.floor(glyphWidth * 0.10), 40));
    const right = Math.max(20, Math.min(Math.floor(glyphWidth * 0.10), 40));
    return { left, right };
  }

  // Narrow characters
  if (CHAR_WIDTH_CLASSES.narrow.includes(char)) {
    const bearing = Math.max(MIN_SIDE_BEARING, Math.min(Math.floor(glyphWidth * 0.02), MAX_SIDE_BEARING));
    return { left: bearing, right: bearing };
  }

  // Round characters
  if (ROUND_CHARS.includes(char)) {
    const bearing = Math.max(MIN_SIDE_BEARING, Math.min(Math.floor(glyphWidth * 0.07), MAX_SIDE_BEARING));
    return { left: bearing, right: bearing };
  }

  // Default characters
  const bearing = Math.max(MIN_SIDE_BEARING, Math.min(Math.floor(glyphWidth * 0.05), MAX_SIDE_BEARING));
  return { left: bearing, right: bearing };
}
