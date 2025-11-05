'use client';

import { forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

/**
 * Modern Input Component with floating labels and icons
 */
const Input = forwardRef(({ 
  label,
  type = 'text',
  error,
  helperText,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const baseStyles = 'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white';
  const normalStyles = 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
  const errorStyles = 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10';
  const iconPaddingLeft = icon && iconPosition === 'left' ? 'pl-12' : '';
  const iconPaddingRight = icon && iconPosition === 'right' || type === 'password' ? 'pr-12' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          className={`
            ${baseStyles}
            ${error ? errorStyles : normalStyles}
            ${iconPaddingLeft}
            ${iconPaddingRight}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {/* Right Icon or Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
        
        {icon && iconPosition === 'right' && type !== 'password' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>
      
      {/* Helper Text or Error */}
      {(error || helperText) && (
        <p className={`mt-2 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
