'use client';

import { motion } from 'framer-motion';

/**
 * Modern Card Component with gradient borders and animations
 */
export default function Card({ 
  children, 
  variant = 'default',
  hover = true,
  className = '',
  onClick,
  ...props 
}) {
  
  const variants = {
    default: 'bg-white border border-gray-200',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200',
    glass: 'bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl',
    elevated: 'bg-white shadow-lg border-0',
  };
  
  const hoverClass = hover ? 'hover:shadow-xl hover:scale-[1.01]' : '';
  const cursorClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <motion.div
      className={`rounded-2xl transition-all duration-300 ${variants[variant]} ${hoverClass} ${cursorClass} ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
}
