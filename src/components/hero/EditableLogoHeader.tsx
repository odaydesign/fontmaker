'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PRESET_FONTS, type PresetFont } from '@/lib/fonts';

const MAX_LENGTH = 9; // Same as "HappyFont"

export default function EditableLogoHeader() {
  const [text, setText] = useState('HappyFont');
  const [selectedFont, setSelectedFont] = useState<PresetFont>(PRESET_FONTS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle text changes
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    if (newText.length <= MAX_LENGTH) {
      setText(newText);
    } else {
      // Restore to previous valid state
      if (editableRef.current) {
        editableRef.current.textContent = text;
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  // Handle paste to enforce max length
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const currentText = editableRef.current?.textContent || '';
    const availableSpace = MAX_LENGTH - currentText.length;
    const textToInsert = pastedText.slice(0, availableSpace);

    document.execCommand('insertText', false, textToInsert);
  };

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

  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {/* Editable Logo Text */}
      <div className="relative">
        <motion.div
          contentEditable
          suppressContentEditableWarning
          ref={editableRef}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="text-5xl md:text-6xl font-bold outline-none cursor-text px-2"
          style={{
            fontFamily: selectedFont.fontFamily,
            transition: 'font-family 0.3s ease',
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {text}
        </motion.div>

        {/* Blinking Cursor */}
        {isFocused && (
          <motion.span
            className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 bg-black"
            style={{
              height: '1.2em',
              fontFamily: selectedFont.fontFamily,
            }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Character Counter */}
        <div className="absolute -bottom-6 right-0 text-xs text-gray-400">
          {text.length}/{MAX_LENGTH}
        </div>
      </div>

      {/* Font Style Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <motion.button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm font-medium">{selectedFont.displayName}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 min-w-[200px]"
            >
              {PRESET_FONTS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    setSelectedFont(font);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex flex-col gap-1 ${
                    selectedFont.id === font.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-gray-700">
                    {font.displayName}
                  </span>
                  <span
                    className="text-lg"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.previewText}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
