'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { FontCardData } from '@/lib/fonts';

interface HorizontalFontCardProps {
  font: FontCardData;
  index: number;
  isVisible: boolean;
}

export default function HorizontalFontCard({ font, index, isVisible }: HorizontalFontCardProps) {
  return (
    <motion.div
      className="flex-shrink-0 mx-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isVisible ? 1 : 0.3,
        y: isVisible ? 0 : 10,
        scale: isVisible ? 1 : 0.95
      }}
      transition={{ 
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.05,
        y: -5,
        transition: { duration: 0.2 }
      }}
    >
      <div className="relative rounded-2xl bg-pink-50 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-pink-100 w-44 h-28 sm:w-48 sm:h-32">
        {/* Card content */}
        <div className="relative h-full flex flex-col items-center justify-center gap-2 p-4 select-none">
          <div
            className="text-3xl sm:text-4xl font-bold leading-none tracking-tight"
            style={{ fontFamily: font.fontFamily, color: '#2d2d2d' }}
          >
            Aa
          </div>
          <span className="text-xs font-medium text-gray-600">
            {font.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
