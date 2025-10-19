/**
 * Character Templates for Font Creation
 * Pre-defined character sets for different languages and use cases
 */

export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'extended' | 'symbols' | 'language';
  characters: string;
  icon?: string;
}

export const characterTemplates: CharacterTemplate[] = [
  // Basic Templates
  {
    id: 'basic-english',
    name: 'Basic English',
    description: 'Uppercase, lowercase, and numbers',
    category: 'basic',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    icon: '🔤'
  },
  {
    id: 'uppercase-only',
    name: 'Uppercase Only',
    description: 'Capital letters A-Z and numbers',
    category: 'basic',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    icon: '🔠'
  },
  {
    id: 'lowercase-only',
    name: 'Lowercase Only',
    description: 'Small letters a-z and numbers',
    category: 'basic',
    characters: 'abcdefghijklmnopqrstuvwxyz0123456789',
    icon: '🔡'
  },
  {
    id: 'numbers-only',
    name: 'Numbers Only',
    description: 'Digits 0-9',
    category: 'basic',
    characters: '0123456789',
    icon: '🔢'
  },

  // Extended Latin
  {
    id: 'french-accents',
    name: 'French Accents',
    description: 'French accented characters',
    category: 'language',
    characters: 'àâæçéèêëïîôùûüÿœÀÂÆÇÉÈÊËÏÎÔÙÛÜŸŒ',
    icon: '🇫🇷'
  },
  {
    id: 'spanish-accents',
    name: 'Spanish Accents',
    description: 'Spanish accented characters',
    category: 'language',
    characters: 'áéíóúüñÁÉÍÓÚÜÑ¿¡',
    icon: '🇪🇸'
  },
  {
    id: 'german-accents',
    name: 'German Accents',
    description: 'German umlauts and eszett',
    category: 'language',
    characters: 'äöüßÄÖÜ',
    icon: '🇩🇪'
  },
  {
    id: 'italian-accents',
    name: 'Italian Accents',
    description: 'Italian accented characters',
    category: 'language',
    characters: 'àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ',
    icon: '🇮🇹'
  },
  {
    id: 'portuguese-accents',
    name: 'Portuguese Accents',
    description: 'Portuguese accented characters',
    category: 'language',
    characters: 'ãáàâçéêíóôõúüÃÁÀÂÇÉÊÍÓÔÕÚÜ',
    icon: '🇵🇹'
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Nordic letters (å, ø, æ, etc.)',
    category: 'language',
    characters: 'åäöæøÅÄÖÆØ',
    icon: '🇸🇪'
  },
  {
    id: 'eastern-european',
    name: 'Eastern European',
    description: 'Czech, Polish, Hungarian accents',
    category: 'language',
    characters: 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻčďěňřšťůýžČĎĚŇŘŠŤŮÝŽőűŐŰ',
    icon: '🇵🇱'
  },
  {
    id: 'all-latin-extended',
    name: 'All Latin Extended',
    description: 'Complete Western European character set',
    category: 'extended',
    characters: 'àâæçéèêëïîôùûüÿœÀÂÆÇÉÈÊËÏÎÔÙÛÜŸŒáéíóúüñÁÉÍÓÚÜÑ¿¡äöüßÄÖÜåäöæøÅÄÖÆØąćęłńóśźżĄĆĘŁŃÓŚŹŻčďěňřšťůýžČĎĚŇŘŠŤŮÝŽőűŐŰ',
    icon: '🌍'
  },

  // Punctuation and Basic Symbols
  {
    id: 'basic-punctuation',
    name: 'Basic Punctuation',
    description: 'Common punctuation marks',
    category: 'symbols',
    characters: '.,;:!?\'"-',
    icon: '❓'
  },
  {
    id: 'extended-punctuation',
    name: 'Extended Punctuation',
    description: 'All punctuation and brackets',
    category: 'symbols',
    characters: '.,;:!?\'"`-–—()[]{}/<>\\|@#',
    icon: '‼️'
  },
  {
    id: 'math-symbols',
    name: 'Math Symbols',
    description: 'Basic mathematical operators',
    category: 'symbols',
    characters: '+-=×÷±≠<>≤≥%‰°′″√∞∑∏∫',
    icon: '➗'
  },
  {
    id: 'currency-symbols',
    name: 'Currency Symbols',
    description: 'Common currency symbols',
    category: 'symbols',
    characters: '$€£¥₹₽¢₩₪₦₨₱฿₴₸',
    icon: '💰'
  },
  {
    id: 'special-characters',
    name: 'Special Characters',
    description: 'Ampersand, at sign, asterisk, etc.',
    category: 'symbols',
    characters: '&@*#%§¶†‡©®™',
    icon: '✨'
  },
  {
    id: 'arrows',
    name: 'Arrows',
    description: 'Directional arrows',
    category: 'symbols',
    characters: '←→↑↓↔↕⇐⇒⇑⇓⇔⇕',
    icon: '➡️'
  },
  {
    id: 'quotation-marks',
    name: 'Quotation Marks',
    description: 'Various quote styles',
    category: 'symbols',
    characters: '\'"`' + String.fromCharCode(8220, 8221, 8216, 8217, 171, 187, 8249, 8250),
    icon: '💬'
  },
  {
    id: 'bullets-lists',
    name: 'Bullets & Lists',
    description: 'List markers and bullets',
    category: 'symbols',
    characters: '•·◦▪▫■□○●★☆',
    icon: '•'
  },

  // Complete Sets
  {
    id: 'complete-basic',
    name: 'Complete Basic Set',
    description: 'English alphabet + numbers + basic punctuation',
    category: 'extended',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?\'"()-',
    icon: '📝'
  },
  {
    id: 'complete-professional',
    name: 'Complete Professional',
    description: 'Full English + extended punctuation + common symbols',
    category: 'extended',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?\'""`-–—()[]{}/<>\\|@#&*%$€£¥©®™',
    icon: '💼'
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: CharacterTemplate['category']): CharacterTemplate[] {
  return characterTemplates.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): CharacterTemplate | undefined {
  return characterTemplates.find(t => t.id === id);
}

/**
 * Get unique characters from a template
 */
export function getUniqueCharacters(template: CharacterTemplate): string[] {
  return Array.from(new Set(template.characters.split('')));
}

/**
 * Combine multiple templates
 */
export function combineTemplates(...templates: CharacterTemplate[]): string {
  const allChars = templates.map(t => t.characters).join('');
  return Array.from(new Set(allChars.split(''))).join('');
}

/**
 * Get template statistics
 */
export function getTemplateStats(template: CharacterTemplate) {
  const chars = getUniqueCharacters(template);
  return {
    total: chars.length,
    uppercase: chars.filter(c => c >= 'A' && c <= 'Z').length,
    lowercase: chars.filter(c => c >= 'a' && c <= 'z').length,
    numbers: chars.filter(c => c >= '0' && c <= '9').length,
    symbols: chars.filter(c => !((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))).length,
  };
}
