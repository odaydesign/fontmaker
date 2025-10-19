'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { FontCardData } from '@/lib/fonts';

interface FontCardProps {
  font: FontCardData;
  angle: number;
  radius: number;
  size: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  rotationOffset: number;
  isVisible: boolean;
}

const DEG_TO_RAD = Math.PI / 180;

export default function FontCard({
  font,
  angle,
  radius,
  size,
  isHovered,
  onHover,
  onLeave,
  rotationOffset,
  isVisible,
}: FontCardProps) {
  const theta = (angle + rotationOffset - 90) * DEG_TO_RAD;
  const x = Math.cos(theta) * radius;
  const y = Math.sin(theta) * radius;

  // Calculate elevation for depth effects
  const elevation = Math.max(0, -y / radius);

  // Subtle tilt effect for depth perception
  const tiltX = elevation * 3;
  const tiltY = (x / radius) * 2;

  // Base scale remains 1, hover scales to 1.03
  const baseScale = 1;
  const zIndex = 100 + Math.round(elevation * 60);

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        // Keep cards upright - no rotation relative to screen
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        zIndex,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      animate={{
        scale: isHovered ? 1.03 : baseScale,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        scale: { duration: 0.3, ease: 'easeOut' },
        opacity: { duration: 0.4, ease: 'easeInOut' },
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className="relative rounded-2xl bg-pink-50 shadow-lg hover:shadow-2xl transition-shadow cursor-pointer overflow-hidden border border-pink-100/50"
        style={{
          width: size,
          height: size,
          // Subtle perspective tilt for depth
          transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        }}
      >
        {/* Light overlay for depth */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,230,241,0.3) 100%)',
            opacity: 0.5,
          }}
        />

        {/* Card content */}
        <div className="relative h-full flex flex-col items-center justify-center gap-2 p-4 select-none">
          <div
            className="text-5xl sm:text-6xl font-bold leading-none tracking-tight"
            style={{ fontFamily: font.fontFamily, color: '#2d2d2d' }}
          >
            {font.uppercase}
            <span className="text-4xl sm:text-5xl font-semibold">
              {font.lowercase}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-600">{font.name}</span>
        </div>
      </div>
    </motion.div>
  );
}
