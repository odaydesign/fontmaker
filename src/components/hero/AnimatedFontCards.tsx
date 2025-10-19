'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SHOWCASE_FONTS } from '@/lib/fonts';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AnimatedFontCards() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedFont, setSelectedFont] = useState<typeof SHOWCASE_FONTS[0] | null>(null);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const scrollRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  // Double the fonts for seamless loop
  const displayFonts = [...SHOWCASE_FONTS, ...SHOWCASE_FONTS];

  useEffect(() => {
    const animate = () => {
      if (!isPaused) {
        scrollRef.current += 0.5; // Speed of scrolling
        setScrollPosition(scrollRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused]);

  // Reset position when it reaches the middle (creates infinite loop)
  useEffect(() => {
    const cardWidth = 240; // card width + gap
    const resetPoint = SHOWCASE_FONTS.length * cardWidth;

    if (scrollPosition >= resetPoint) {
      scrollRef.current = 0;
      setScrollPosition(0);
    }
  }, [scrollPosition]);

  const handleCardClick = (font: typeof SHOWCASE_FONTS[0]) => {
    setSelectedFont(font);
    setPreviewText('The quick brown fox jumps over the lazy dog');
  };

  const closePreview = () => {
    setSelectedFont(null);
  };

  return (
    <>
      <div className="w-full overflow-hidden pb-8">
        <div className="relative">
          <div
            className="flex gap-6"
            style={{
              transform: `translateX(-${scrollPosition}px)`,
              transition: isPaused ? 'transform 0.3s ease-out' : 'none',
            }}
          >
            {displayFonts.map((font, index) => (
              <Card
                key={`${font.id}-${index}`}
                className="flex-shrink-0 w-[220px] h-[280px] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300"
                style={{
                  transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  setIsPaused(true);
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  setIsPaused(false);
                }}
                onClick={() => handleCardClick(font)}
              >
                <div
                  className="text-7xl font-bold leading-none text-foreground"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {font.uppercase}
                  <span className="text-6xl font-semibold">{font.lowercase}</span>
                </div>
                <span className="text-base text-muted-foreground font-medium">{font.name}</span>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Font Preview Modal */}
      {selectedFont && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closePreview}
        >
          <Card
            className="max-w-3xl w-full mx-4 p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreview}
              className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>

            <h2 className="text-2xl font-bold mb-2">{selectedFont.name}</h2>
            <p className="text-sm text-muted-foreground mb-8">Try typing to preview this font</p>

            <div className="space-y-6">
              <div className="bg-muted rounded-xl p-8 min-h-[200px]">
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full h-full bg-transparent border-none outline-none resize-none text-4xl leading-relaxed"
                  style={{
                    fontFamily: selectedFont.fontFamily,
                  }}
                  placeholder="Type something..."
                />
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold mb-4">Character Set</h3>
                <div
                  className="text-2xl break-all"
                  style={{ fontFamily: selectedFont.fontFamily }}
                >
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  <br />
                  abcdefghijklmnopqrstuvwxyz
                  <br />
                  0123456789 !@#$%^&*()
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold mb-4">Size Examples</h3>
                <div className="space-y-3">
                  <div style={{ fontFamily: selectedFont.fontFamily }} className="text-sm">
                    14px: The quick brown fox jumps over the lazy dog
                  </div>
                  <div style={{ fontFamily: selectedFont.fontFamily }} className="text-base">
                    16px: The quick brown fox jumps over the lazy dog
                  </div>
                  <div style={{ fontFamily: selectedFont.fontFamily }} className="text-xl">
                    20px: The quick brown fox jumps over the lazy dog
                  </div>
                  <div style={{ fontFamily: selectedFont.fontFamily }} className="text-3xl">
                    30px: The quick brown fox
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
