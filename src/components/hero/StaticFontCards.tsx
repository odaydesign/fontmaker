'use client';

import React from 'react';
import { SHOWCASE_FONTS } from '@/lib/fonts';

export default function StaticFontCards() {
  // Show first 8 cards
  const displayFonts = SHOWCASE_FONTS.slice(0, 8);

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 justify-center min-w-max px-4">
        {displayFonts.map((font) => (
          <div
            key={font.id}
            className="flex-shrink-0 w-[140px] h-[160px] bg-pink-50 rounded-3xl flex flex-col items-center justify-center gap-2 border border-pink-100/50"
          >
            <div
              className="text-5xl font-bold leading-none"
              style={{ fontFamily: font.fontFamily, color: '#2d2d2d' }}
            >
              {font.uppercase}
              <span className="text-4xl font-semibold">{font.lowercase}</span>
            </div>
            <span className="text-sm text-gray-700">{font.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
