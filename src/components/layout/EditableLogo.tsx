'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { SHOWCASE_FONTS } from '@/lib/fonts';

const MAX_CHARS = 10;

export default function EditableLogo() {
  const [logoText, setLogoText] = useState('HappyFont');
  const [selectedFontIndex, setSelectedFontIndex] = useState(6); // Modern font by default
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleFontSelect = (index: number) => {
    setSelectedFontIndex(index);
    setIsDropdownOpen(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARS) {
      setLogoText(newText);
    }
  };

  const handleTextClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (logoText.trim() === '') {
      setLogoText('HappyFont');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const selectedFont = SHOWCASE_FONTS[selectedFontIndex];

  return (
    <div className="flex items-center gap-1 relative" ref={dropdownRef}>
      {/* Editable Logo Text */}
      <div
        className="relative cursor-text group"
        onClick={handleTextClick}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={logoText}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="text-2xl font-bold bg-transparent border-none outline-none"
            style={{
              fontFamily: selectedFont.fontFamily,
              width: `${Math.max(logoText.length, 4)}ch`
            }}
            maxLength={MAX_CHARS}
          />
        ) : (
          <span
            className="text-2xl font-bold relative"
            style={{ fontFamily: selectedFont.fontFamily }}
          >
            {logoText}
            {/* Blinking Cursor */}
            <span className="inline-block w-0.5 h-6 bg-foreground ml-0.5 animate-blink align-middle" />
          </span>
        )}
      </div>

      {/* Font Selector Dropdown */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="p-1.5 hover:bg-muted rounded-md transition-colors"
        aria-label="Select font"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg py-2 min-w-[200px] z-50">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
            Select Font Style
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {SHOWCASE_FONTS.map((font, index) => (
              <button
                key={font.id}
                onClick={() => handleFontSelect(index)}
                className={`w-full px-4 py-2.5 text-left hover:bg-muted transition-colors flex items-center justify-between ${
                  selectedFontIndex === index ? 'bg-muted' : ''
                }`}
              >
                <span
                  className="text-lg font-medium"
                  style={{ fontFamily: font.fontFamily }}
                >
                  {font.name}
                </span>
                {selectedFontIndex === index && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
