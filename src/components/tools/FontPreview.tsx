'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Sun, Moon, Type, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FontPreviewProps {
  fontData?: ArrayBuffer | null;
  fontFamily?: string;
  className?: string;
}

const PANGRAMS = [
  { lang: 'English', text: 'The quick brown fox jumps over the lazy dog' },
  { lang: 'English (All)', text: 'Sphinx of black quartz, judge my vow' },
  { lang: 'Uppercase', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { lang: 'Lowercase', text: 'abcdefghijklmnopqrstuvwxyz' },
  { lang: 'Numbers', text: '0123456789' },
  { lang: 'Punctuation', text: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`' },
];

const WATERFALL_SIZES = [12, 16, 20, 24, 32, 48, 64, 96];

export function FontPreview({ fontData, fontFamily = 'CustomFont', className = '' }: FontPreviewProps) {
  const [customText, setCustomText] = useState('The quick brown fox jumps over the lazy dog');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'waterfall' | 'pangrams'>('live');
  const [fontUrl, setFontUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load font when fontData changes
  useEffect(() => {
    if (!fontData) return;

    // Clean up previous font URL
    if (fontUrl) {
      URL.revokeObjectURL(fontUrl);
    }

    // Create blob URL from font data
    const blob = new Blob([fontData], { type: 'font/ttf' });
    const url = URL.createObjectURL(blob);
    setFontUrl(url);

    // Load the font
    const fontFace = new FontFace(fontFamily, `url(${url})`);
    fontFace.load().then((loadedFace) => {
      document.fonts.add(loadedFace);
    }).catch((error) => {
      console.error('Error loading font:', error);
    });

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fontData, fontFamily]);

  // Export preview as image
  const exportAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = 1200;
    const height = viewMode === 'waterfall' ? 800 : 400;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Text
    ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
    ctx.textBaseline = 'top';

    if (viewMode === 'waterfall') {
      let y = 40;
      WATERFALL_SIZES.forEach((size) => {
        ctx.font = `${size}px ${fontFamily}`;
        ctx.fillText(customText, 40, y);
        y += size + 20;
      });
    } else if (viewMode === 'pangrams') {
      let y = 40;
      PANGRAMS.forEach((pangram) => {
        ctx.font = `14px Arial`;
        ctx.fillStyle = isDarkMode ? '#888' : '#666';
        ctx.fillText(pangram.lang, 40, y);
        ctx.font = `24px ${fontFamily}`;
        ctx.fillStyle = isDarkMode ? '#ffffff' : '#000000';
        ctx.fillText(pangram.text, 40, y + 20);
        y += 70;
      });
    } else {
      ctx.font = `48px ${fontFamily}`;
      ctx.fillText(customText, 40, height / 2 - 24);
    }

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fontFamily}-preview.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (!fontData) {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center ${className}`}>
        <Type className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">
          Generate or select a font to see the preview
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'live' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('live')}
            size="sm"
          >
            <AlignLeft className="w-4 h-4 mr-2" />
            Live Preview
          </Button>
          <Button
            variant={viewMode === 'waterfall' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('waterfall')}
            size="sm"
          >
            <Type className="w-4 h-4 mr-2" />
            Waterfall
          </Button>
          <Button
            variant={viewMode === 'pangrams' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('pangrams')}
            size="sm"
          >
            Pangrams
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsDarkMode(!isDarkMode)}
            size="sm"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={exportAsImage}
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Preview
          </Button>
        </div>
      </div>

      {/* Custom text input for live mode */}
      {viewMode === 'live' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Custom Text
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            placeholder="Type to preview..."
          />
        </div>
      )}

      {/* Preview area */}
      <div
        className={`rounded-lg border overflow-hidden ${
          isDarkMode
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        {viewMode === 'live' && (
          <div className="p-8">
            <div
              className={`text-5xl leading-relaxed ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
              style={{ fontFamily }}
            >
              {customText}
            </div>
          </div>
        )}

        {viewMode === 'waterfall' && (
          <div className="p-8 space-y-4">
            {WATERFALL_SIZES.map((size) => (
              <div key={size}>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {size}px
                </div>
                <div
                  className={isDarkMode ? 'text-white' : 'text-gray-900'}
                  style={{ fontFamily, fontSize: `${size}px` }}
                >
                  {customText}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'pangrams' && (
          <div className="p-8 space-y-6">
            {PANGRAMS.map((pangram, idx) => (
              <div key={idx}>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {pangram.lang}
                </div>
                <div
                  className={`text-2xl ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{ fontFamily }}
                >
                  {pangram.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
