'use client';

import { motion } from 'framer-motion';

/**
 * Modern Badge Component with variants and animations
 */
export default function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
  ...props 
}) {
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
    info: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white',
    outline: 'border-2 border-gray-300 text-gray-700 bg-transparent',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full';
  
  return (
    <motion.span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {dot && (
        <span className={`h-2 w-2 rounded-full bg-current ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </motion.span>
  );
}

/**
 * Notification Badge (for counts)
 */
export function NotificationBadge({ 
  count, 
  max = 99,
  showZero = false,
  className = '' 
}) {
  if (!showZero && (!count || count === 0)) return null;
  
  const displayCount = count > max ? `${max}+` : count;
  
  return (
    <motion.span
      className={`absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {displayCount}
    </motion.span>
  );
}
