/**
 * Professional Prompt Templates for Font Character Generation
 * These templates ensure optimal character layout and quality for font creation
 */

export type CharacterType = 'uppercase' | 'lowercase' | 'numbers' | 'mixed';

export interface PromptTemplateOptions {
  style: string;
  characterType: CharacterType;
  language?: string;
  characters?: string;
}

/**
 * Get the character set description based on type
 */
function getCharacterSetDescription(type: CharacterType): string {
  switch (type) {
    case 'uppercase':
      return 'uppercase letters A-Z';
    case 'lowercase':
      return 'lowercase letters a-z';
    case 'numbers':
      return 'numbers 0-9';
    case 'mixed':
      return 'uppercase letters A-Z, lowercase letters a-z, and numbers 0-9';
    default:
      return 'alphabet characters';
  }
}

/**
 * Get the actual characters to display based on type and language
 */
function getCharacterSet(type: CharacterType, characters?: string): string {
  if (characters) {
    return characters;
  }

  switch (type) {
    case 'uppercase':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    case 'lowercase':
      return 'abcdefghijklmnopqrstuvwxyz';
    case 'numbers':
      return '0123456789';
    case 'mixed':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    default:
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
}

/**
 * Build a professional prompt for font character generation
 * This template is optimized for creating clean, traceable character sheets
 */
export function buildFontGenerationPrompt(options: PromptTemplateOptions): string {
  const { style, characterType, characters } = options;

  const charSetDescription = getCharacterSetDescription(characterType);
  const charSet = getCharacterSet(characterType, characters);

  // Professional template that ensures optimal character layout
  const prompt = `Create a clean, high-contrast character reference sheet featuring ${charSetDescription} in ${style} style.

LAYOUT REQUIREMENTS:
- Display all characters: ${charSet}
- Arrange characters in a clear grid layout with consistent spacing
- Each character should be clearly separated from others
- Use a white or light neutral background
- Characters should be black or very dark for high contrast
- Uniform character size and baseline alignment
- Professional typography reference sheet style

STYLE: ${style}

CHARACTER SET: ${charSet}

TECHNICAL REQUIREMENTS:
- High contrast (black characters on white/light background)
- Clean edges for optimal character tracing
- Consistent stroke width within each character
- Clear separation between characters for auto-detection
- Professional font specimen sheet presentation`;

  return prompt;
}

/**
 * Build a simplified prompt for quick generation
 */
export function buildSimplifiedPrompt(styleDescription: string, characterType: CharacterType, characters?: string): string {
  return buildFontGenerationPrompt({
    style: styleDescription,
    characterType,
    characters,
  });
}

/**
 * Validate user style input
 */
export function validateStyleInput(style: string): { valid: boolean; message?: string } {
  const trimmed = style.trim();

  if (!trimmed) {
    return { valid: false, message: 'Please describe the font style you want' };
  }

  if (trimmed.length < 3) {
    return { valid: false, message: 'Please provide a more detailed style description' };
  }

  if (trimmed.length > 200) {
    return { valid: false, message: 'Style description is too long (max 200 characters)' };
  }

  return { valid: true };
}

/**
 * Example style suggestions for users
 */
export const STYLE_EXAMPLES = [
  'Halloween spooky',
  'Christmas festive',
  'Elegant script',
  'Bold modern',
  'Vintage retro',
  'Handwritten casual',
  'Brush lettering',
  'Gothic medieval',
  'Futuristic sci-fi',
  'Playful cartoon',
  'Minimalist geometric',
  'Graffiti street art',
] as const;

/**
 * Character type options for the UI
 */
export const CHARACTER_TYPE_OPTIONS: Array<{ value: CharacterType; label: string; description: string }> = [
  {
    value: 'uppercase',
    label: 'Uppercase Only',
    description: 'A-Z (26 characters)',
  },
  {
    value: 'lowercase',
    label: 'Lowercase Only',
    description: 'a-z (26 characters)',
  },
  {
    value: 'numbers',
    label: 'Numbers Only',
    description: '0-9 (10 characters)',
  },
  {
    value: 'mixed',
    label: 'Mixed (All)',
    description: 'A-Z, a-z, 0-9 (62 characters)',
  },
];
