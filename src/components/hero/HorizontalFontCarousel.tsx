'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import HorizontalFontCard from './HorizontalFontCard';
import { SHOWCASE_FONTS } from '@/lib/fonts';

export default function HorizontalFontCarousel() {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create extended array for seamless infinite scrolling
  const extendedFonts = [...SHOWCASE_FONTS, ...SHOWCASE_FONTS, ...SHOWCASE_FONTS];

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div 
      className="w-full overflow-hidden relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Continuous scrolling animation */}
      <motion.div
        ref={containerRef}
        className="flex"
        animate={{
          x: isPaused ? undefined : [0, -SHOWCASE_FONTS.length * 192], // 192px per card (176px width + 16px margin)
        }}
        transition={{
          duration: SHOWCASE_FONTS.length * 4, // 4 seconds per font for smoother scrolling
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop"
        }}
      >
        {extendedFonts.map((font, index) => (
          <HorizontalFontCard
            key={`${font.id}-${index}`}
            font={font}
            index={index}
            isVisible={true}
          />
        ))}
      </motion.div>

      {/* Gradient overlays for smooth edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-pink-50 via-pink-50/90 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-pink-50 via-pink-50/90 to-transparent pointer-events-none z-10" />
    </div>
  );
}
