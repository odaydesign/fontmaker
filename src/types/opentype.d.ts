// Custom type definitions for opentype.js

declare module 'opentype.js' {
  export class Font {
    constructor(options: {
      familyName: string;
      styleName: string;
      unitsPerEm: number;
      ascender: number;
      descender: number;
      glyphs: Glyph[];
    });
    glyphs: Glyph[];
    toArrayBuffer(): ArrayBuffer;
  }

  export class Glyph {
    constructor(options: {
      name: string;
      unicode?: number;
      unicodes?: number[];
      advanceWidth?: number;
      path?: Path;
    });
    name: string;
    unicode?: number;
    advanceWidth: number;
    path: Path;
  }

  export class Path {
    constructor();
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
    quadraticCurveTo(x1: number, y1: number, x: number, y: number): void;
    close(): void;
  }

  export function parse(buffer: ArrayBuffer): Font;
} 