export interface PresetFont {
  id: string;
  name: string;
  displayName: string;
  fontFamily: string;
  previewText: string;
}

export const PRESET_FONTS: PresetFont[] = [
  {
    id: 'playfair',
    name: 'Playfair Display',
    displayName: 'Elegant',
    fontFamily: 'Playfair Display, serif',
    previewText: 'HappyFont'
  },
  {
    id: 'inter',
    name: 'Inter',
    displayName: 'Modern',
    fontFamily: 'Inter, sans-serif',
    previewText: 'HappyFont'
  },
  {
    id: 'dancing',
    name: 'Dancing Script',
    displayName: 'Playful',
    fontFamily: 'Dancing Script, cursive',
    previewText: 'HappyFont'
  },
  {
    id: 'raleway',
    name: 'Raleway',
    displayName: 'Clean',
    fontFamily: 'Raleway, sans-serif',
    previewText: 'HappyFont'
  },
  {
    id: 'righteous',
    name: 'Righteous',
    displayName: 'Bold',
    fontFamily: 'Righteous, cursive',
    previewText: 'HappyFont'
  }
];

export interface FontCardData {
  id: string;
  name: string;
  fontFamily: string;
  uppercase: string;
  lowercase: string;
}

export const SHOWCASE_FONTS: FontCardData[] = [
  {
    id: 'spooky-1',
    name: 'Spooky',
    fontFamily: 'Creepster, cursive',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'spooky-2',
    name: 'Spooky',
    fontFamily: 'Nosifer, cursive',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'spooky-3',
    name: 'Spooky',
    fontFamily: 'Rubik Wet Paint, cursive',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'spooky-4',
    name: 'Spooky',
    fontFamily: 'Fredericka the Great, cursive',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'round',
    name: 'Round',
    fontFamily: 'Righteous, cursive',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    fontFamily: 'Playfair Display, serif',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'modern',
    name: 'Modern',
    fontFamily: 'Poppins, sans-serif',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'playful',
    name: 'Playful',
    fontFamily: 'Pacifico, cursive',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'bold',
    name: 'Bold',
    fontFamily: 'Black Ops One, cursive',
    uppercase: 'A',
    lowercase: 'a'
  },
  {
    id: 'cursive',
    name: 'Cursive',
    fontFamily: 'Satisfy, cursive',
    uppercase: 'A',
    lowercase: 'a'
  }
];
