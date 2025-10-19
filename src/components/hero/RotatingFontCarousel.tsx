'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import FontCard from './FontCard';
import { SHOWCASE_FONTS } from '@/lib/fonts';

const BASE_SPEED = 12; // degrees per second (clockwise rotation)
const MAX_CARDS = SHOWCASE_FONTS.length;

function useResponsiveMetrics() {
  const [metrics, setMetrics] = useState(() => ({
    cardSize: 150,
    radius: 320,
  }));

  useEffect(() => {
    const computeMetrics = () => {
      if (typeof window === 'undefined') {
        return { cardSize: 150, radius: 320 };
      }

      const width = window.innerWidth;

      if (width < 480) {
        return { cardSize: 100, radius: 220 };
      }
      if (width < 768) {
        return { cardSize: 120, radius: 260 };
      }
      if (width < 1024) {
        return { cardSize: 140, radius: 300 };
      }
      return { cardSize: 160, radius: 340 };
    };

    const update = () => {
      const next = computeMetrics();
      setMetrics(next);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return metrics;
}

export default function RotatingFontCarousel() {
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const speedRef = useRef(BASE_SPEED);
  const rotationRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const { cardSize, radius } = useResponsiveMetrics();
  const diameter = radius * 2 + cardSize;
  const visibleHeight = radius + cardSize * 0.6;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = timestamp;
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const targetSpeed = isPaused ? 0 : BASE_SPEED;
      const currentSpeed = speedRef.current;
      const smoothing = 3;
      const newSpeed = currentSpeed + (targetSpeed - currentSpeed) * Math.min(delta * smoothing, 1);
      speedRef.current = newSpeed;

      rotationRef.current = (rotationRef.current + newSpeed * delta) % 360;
      setRotation(rotationRef.current);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      lastTimeRef.current = null;
    };
  }, [mounted, isPaused]);

  const angleStep = useMemo(() => 360 / MAX_CARDS, []);

  if (!mounted) {
    return (
      <div className="relative flex w-full justify-center" style={{ height: visibleHeight }}>
        <div
          className="w-[320px] h-[320px] rounded-full bg-pink-100/40 blur-3xl"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex w-full justify-center"
      style={{ height: visibleHeight }}
    >
      <div
        className="relative"
        style={{
          width: diameter,
          height: diameter,
          clipPath: 'inset(0 0 50% 0)',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[60%] h-[60%] rounded-full bg-gradient-to-b from-pink-200/25 to-transparent blur-2xl" />
        </div>

        {SHOWCASE_FONTS.map((font, index) => {
          const baseAngle = angleStep * index;
          const theta = (baseAngle + rotation - 90) * (Math.PI / 180);
          const y = Math.sin(theta) * radius;
          const isVisible = y <= 0;

          return (
            <FontCard
              key={font.id}
              font={font}
              angle={baseAngle}
              radius={radius}
              size={cardSize}
              isHovered={hoveredIndex === index}
              onHover={() => {
                setHoveredIndex(index);
                setIsPaused(true);
              }}
              onLeave={() => {
                setHoveredIndex(null);
                setIsPaused(false);
              }}
              rotationOffset={rotation}
              isVisible={isVisible}
            />
          );
        })}
      </div>
    </div>
  );
}
