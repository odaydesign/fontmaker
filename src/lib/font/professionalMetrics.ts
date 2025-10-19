/**
 * Professional Font Metrics Calculator
 * Based on industry standards and best practices from professional type designers
 *
 * References:
 * - Font Development Best Practices (SIL)
 * - Glyphs App Documentation
 * - Tracy Method (Walter Tracy's spacing methodology)
 * - OpenType specification
 */

export interface GlyphMetrics {
  char: string;
  width: number;
  height: number;
  boundingBox: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
}

export interface FontMetricsResult {
  // UPM (Units Per Em) - standard is 1000 or 2048
  unitsPerEm: number;

  // Vertical Metrics (relative to baseline at 0)
  ascender: number;        // Highest point for lowercase (e.g., 'h', 'd', 'l')
  descender: number;       // Lowest point for lowercase (e.g., 'g', 'p', 'q')
  capHeight: number;       // Height of uppercase letters (e.g., 'H')
  xHeight: number;         // Height of lowercase 'x'

  // Line spacing
  lineGap: number;         // Space between lines
  typoAscender: number;    // Typography ascender
  typoDescender: number;   // Typography descender
  typoLineGap: number;     // Typography line gap

  // Spacing recommendations
  defaultSideBearing: number;
  letterSpacing: number;
  wordSpacing: number;

  // Optical adjustments
  overshoot: number;       // Amount round glyphs extend beyond baseline/x-height
}

export interface KerningPair {
  left: string;
  right: string;
  adjustment: number;
}

/**
 * Calculate professional font metrics based on glyph measurements
 */
export function calculateFontMetrics(glyphs: GlyphMetrics[]): FontMetricsResult {
  if (glyphs.length === 0) {
    return getDefaultMetrics();
  }

  // Standard UPM for modern fonts
  const unitsPerEm = 1000;

  // Find key measurements
  const measurements = analyzeGlyphs(glyphs);

  // Cap Height: Use uppercase letters (H, O, I) - typically 70% of UPM
  const capHeight = measurements.capHeight || Math.round(unitsPerEm * 0.70);

  // X-Height: Use lowercase 'x' or 'o' - typically 50% of UPM (about 70% of cap height)
  const xHeight = measurements.xHeight || Math.round(capHeight * 0.70);

  // Ascender: Highest point in lowercase (h, d, l, b, k) - typically same as cap height or slightly higher
  const ascender = measurements.ascender || Math.round(capHeight * 1.05);

  // Descender: Lowest point in lowercase (g, p, q, y, j)
  // Standard: 20-30% of UPM below baseline
  // Descenders should be smaller than ascenders
  const descender = measurements.descender || Math.round(unitsPerEm * -0.25);

  // Overshoot: Round glyphs (O, o) should extend 1-2% beyond flat edges
  // This prevents optical illusion of appearing smaller
  const overshoot = Math.round(unitsPerEm * 0.015);

  // Line Gap: Space between lines
  // Standard: 20% of UPM
  const lineGap = Math.round(unitsPerEm * 0.20);

  // Typography metrics (for consistent cross-platform rendering)
  const typoAscender = ascender;
  const typoDescender = descender;
  const typoLineGap = lineGap;

  // Sidebearing: Starting point is 1/3 of counter width
  // For body text, slightly more; for display, slightly less
  const avgCharWidth = measurements.avgWidth || (unitsPerEm * 0.6);
  const counterWidth = avgCharWidth * 0.4; // Approximate inner white space
  const defaultSideBearing = Math.round(counterWidth / 3);

  // Letter spacing: Additional space between letters
  // Default should be 0 (sidebearings handle it), but can be adjusted
  const letterSpacing = 0;

  // Word spacing: Space character width
  // Standard: 1/4 to 1/3 of 'n' width
  const wordSpacing = Math.round(avgCharWidth * 0.28);

  return {
    unitsPerEm,
    ascender,
    descender,
    capHeight,
    xHeight,
    lineGap,
    typoAscender,
    typoDescender,
    typoLineGap,
    defaultSideBearing,
    letterSpacing,
    wordSpacing,
    overshoot,
  };
}

/**
 * Analyze glyphs to find key measurements
 */
function analyzeGlyphs(glyphs: GlyphMetrics[]) {
  const measurements: {
    capHeight?: number;
    xHeight?: number;
    ascender?: number;
    descender?: number;
    avgWidth?: number;
  } = {};

  // Find cap height from uppercase letters
  const capChars = ['H', 'I', 'L', 'E', 'F'];
  const capHeights = glyphs
    .filter(g => capChars.includes(g.char))
    .map(g => g.boundingBox.yMax);

  if (capHeights.length > 0) {
    measurements.capHeight = Math.round(
      capHeights.reduce((a, b) => a + b, 0) / capHeights.length
    );
  }

  // Find x-height from lowercase letters (flat tops)
  const xHeightChars = ['x', 'z', 'v', 'w', 'r', 's'];
  const xHeights = glyphs
    .filter(g => xHeightChars.includes(g.char))
    .map(g => g.boundingBox.yMax);

  if (xHeights.length > 0) {
    measurements.xHeight = Math.round(
      xHeights.reduce((a, b) => a + b, 0) / xHeights.length
    );
  }

  // Find ascender from tall lowercase letters
  const ascenderChars = ['h', 'd', 'l', 'b', 'k', 't', 'f'];
  const ascenderHeights = glyphs
    .filter(g => ascenderChars.includes(g.char))
    .map(g => g.boundingBox.yMax);

  if (ascenderHeights.length > 0) {
    measurements.ascender = Math.max(...ascenderHeights);
  }

  // Find descender from lowercase letters with descenders
  const descenderChars = ['g', 'p', 'q', 'y', 'j'];
  const descenderDepths = glyphs
    .filter(g => descenderChars.includes(g.char))
    .map(g => g.boundingBox.yMin);

  if (descenderDepths.length > 0) {
    measurements.descender = Math.min(...descenderDepths);
  }

  // Calculate average character width
  const widths = glyphs.map(g => g.width);
  if (widths.length > 0) {
    measurements.avgWidth = Math.round(
      widths.reduce((a, b) => a + b, 0) / widths.length
    );
  }

  return measurements;
}

/**
 * Get default metrics when no glyphs available
 */
function getDefaultMetrics(): FontMetricsResult {
  const unitsPerEm = 1000;

  return {
    unitsPerEm,
    ascender: 750,
    descender: -250,
    capHeight: 700,
    xHeight: 500,
    lineGap: 200,
    typoAscender: 750,
    typoDescender: -250,
    typoLineGap: 200,
    defaultSideBearing: 50,
    letterSpacing: 0,
    wordSpacing: 150,
    overshoot: 15,
  };
}

/**
 * Generate intelligent kerning pairs based on character shapes
 * Based on professional typography standards
 */
export function generateKerningPairs(glyphs: GlyphMetrics[]): KerningPair[] {
  const pairs: KerningPair[] = [];
  const availableChars = new Set(glyphs.map(g => g.char));

  // Professional kerning pair patterns with standard adjustments
  // Values are in units (will be scaled based on UPM)
  const kerningPatterns: Record<string, number> = {
    // Slanted capitals with vowels
    'AV': -80, 'AW': -60, 'AY': -80, 'AT': -60,
    'VA': -80, 'WA': -60, 'YA': -80, 'TA': -60,

    // L combinations
    'LT': -60, 'LY': -60, 'LV': -80, 'LW': -60,
    'LA': -40,

    // T combinations
    'To': -40, 'Ta': -60, 'Te': -40, 'Ti': -20,
    'Ty': -60, 'Tr': -20, 'Tu': -40,

    // F combinations
    'Fa': -40, 'Fe': -20, 'Fi': -20, 'Fo': -20,
    'FA': -60,

    // P combinations
    'Pa': -40, 'Pe': -20, 'Po': -20,
    'PA': -80,

    // V combinations
    'Ve': -40, 'Vo': -40, 'Va': -60,

    // W combinations
    'We': -20, 'Wo': -20, 'Wa': -40,

    // Y combinations
    'Yo': -40, 'Ya': -60, 'Ye': -40, 'Yu': -40,

    // Quotation marks
    '\'A': -60, '\'a': -20, '"A': -60, '"a': -20,
    'A\'': -60, 'a\'': -20, 'A"': -60, 'a"': -20,

    // Punctuation
    '.\'': -80, ',\'': -80, '."': -80, ',"': -80,
    'A,': -40, 'A.': -40,

    // Lowercase combinations (less aggressive)
    'av': -20, 'aw': -15, 'ay': -20,
    'va': -20, 'wa': -15, 'ya': -20,
    'vo': -15, 'we': -10, 'ye': -15,

    // Number combinations
    '17': -20, '70': -20, '71': -20,
  };

  // Generate pairs that exist in the font
  for (const [pair, adjustment] of Object.entries(kerningPatterns)) {
    const left = pair[0];
    const right = pair[1];

    if (availableChars.has(left) && availableChars.has(right)) {
      pairs.push({ left, right, adjustment });
    }
  }

  return pairs;
}

/**
 * Calculate optical spacing adjustment for round vs straight characters
 * Based on Tracy Method
 */
export function calculateOpticalSpacing(
  leftChar: string,
  rightChar: string,
  baseSpacing: number
): number {
  const roundChars = new Set(['O', 'o', 'C', 'c', 'G', 'g', 'Q', 'q', 'D', 'd', '0', '6', '8', '9']);
  const straightChars = new Set(['H', 'h', 'I', 'i', 'l', 'L', 'E', 'F', 'T', 'n', 'm', '1']);

  const leftIsRound = roundChars.has(leftChar);
  const rightIsRound = roundChars.has(rightChar);
  const leftIsStraight = straightChars.has(leftChar);
  const rightIsStraight = straightChars.has(rightChar);

  // Tracy Method spacing rules:
  // 1. Straight + Straight = largest space (base spacing)
  // 2. Straight + Round = medium space (reduce by 10%)
  // 3. Round + Round = smallest space (reduce by 20%)

  if (leftIsStraight && rightIsStraight) {
    return baseSpacing; // Largest space
  } else if ((leftIsStraight && rightIsRound) || (leftIsRound && rightIsStraight)) {
    return baseSpacing * 0.90; // Medium space
  } else if (leftIsRound && rightIsRound) {
    return baseSpacing * 0.80; // Smallest space
  }

  return baseSpacing; // Default
}

/**
 * Apply optical overshoot for round characters
 * Round glyphs should extend slightly beyond flat edges
 */
export function applyOpticalOvershoot(
  char: string,
  yPosition: number,
  targetHeight: number,
  overshoot: number
): number {
  const roundChars = new Set(['O', 'o', 'C', 'c', 'G', 'g', 'Q', 'q', 'D', 'd', 'S', 's', '0', '6', '8', '9']);

  if (roundChars.has(char)) {
    // Extend round characters slightly beyond the target
    return yPosition + overshoot;
  }

  return yPosition;
}

/**
 * Calculate recommended line height (leading)
 * Based on character width and intended use
 */
export function calculateLineHeight(
  fontSize: number,
  usage: 'body' | 'heading' | 'display' = 'body'
): number {
  // Body text: 120-145% of font size
  // Headings: 110-130% of font size
  // Display: 100-120% of font size

  const multipliers = {
    body: 1.4,      // 140% for comfortable reading
    heading: 1.25,  // 125% for visual hierarchy
    display: 1.15,  // 115% for tight, impactful text
  };

  return Math.round(fontSize * multipliers[usage]);
}
