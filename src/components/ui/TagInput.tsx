'use client';

import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface TagInputProps {
  id: string;
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  maxTags?: number;
  disabled?: boolean;
  fullWidth?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  id,
  label,
  tags,
  onChange,
  placeholder = 'Add a tag',
  error,
  helperText,
  maxTags,
  disabled = false,
  fullWidth = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) return;
    if (maxTags && tags.length >= maxTags) return;
    
    onChange([...tags, trimmedTag]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Focus input on tag removal
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [tags.length]);

  return (
    <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className={`
          flex flex-wrap items-center gap-2 p-2 border rounded-md
          ${error ? 'border-red-500 focus-within:ring-red-500 focus-within:border-red-500' : 'border-gray-300 focus-within:ring-indigo-500 focus-within:border-indigo-500'} 
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-text'}
          ${fullWidth ? 'w-full' : ''}
          focus-within:ring-2 focus-within:ring-offset-0
        `}
      >
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-sm"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 text-indigo-600 hover:text-indigo-800 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
        
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
          className="flex-grow min-w-[120px] bg-transparent border-0 p-1 focus:ring-0 focus:outline-none text-sm"
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {maxTags && (
        <p className="mt-1 text-xs text-gray-500">
          {tags.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
};

export default TagInput; 