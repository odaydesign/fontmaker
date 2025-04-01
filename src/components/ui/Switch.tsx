'use client';

import React from 'react';

interface SwitchProps {
  id: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  id,
  label,
  checked,
  onChange,
  helperText,
  disabled = false,
  className = '',
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center">
        {label && (
          <label 
            htmlFor={id}
            className="mr-3 text-sm font-medium text-gray-700 cursor-pointer"
          >
            {label}
          </label>
        )}
        
        <button
          id={id}
          type="button"
          onClick={handleToggle}
          className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
            ${checked ? 'bg-indigo-600' : 'bg-gray-200'}
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
          disabled={disabled}
          aria-checked={checked}
          aria-labelledby={label ? id : undefined}
          role="switch"
        >
          <span 
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
      
      {helperText && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Switch; 