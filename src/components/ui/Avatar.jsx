'use client';

import { motion } from 'framer-motion';
import { UserIcon } from '@heroicons/react/24/solid';

/**
 * Modern Avatar Component with status indicator and gradients
 */
export default function Avatar({ 
  src, 
  alt = 'User',
  size = 'md',
  status,
  showStatus = false,
  fallback,
  className = '',
  onClick
}) {
  
  const sizes = {
    xs: 'h-8 w-8 text-xs',
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-20 w-20 text-xl',
    '2xl': 'h-24 w-24 text-2xl',
  };
  
  const statusSizes = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
    xl: 'h-5 w-5',
    '2xl': 'h-6 w-6',
  };
  
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <motion.div 
      className={`relative inline-block ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
    >
      <div className={`${sizes[size]} rounded-full overflow-hidden ring-2 ring-white shadow-lg ${className}`}>
        {src ? (
          <img 
            src={src} 
            alt={alt}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback */}
        <div 
          className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold"
          style={{ display: src ? 'none' : 'flex' }}
        >
          {fallback || getInitials(alt)}
        </div>
      </div>
      
      {/* Status Indicator */}
      {showStatus && status && (
        <span 
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} rounded-full border-2 border-white`}
        />
      )}
    </motion.div>
  );
}

/**
 * Avatar Group Component
 */
export function AvatarGroup({ 
  avatars = [], 
  max = 3, 
  size = 'md',
  className = '' 
}) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;
  
  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      
      {remaining > 0 && (
        <div className={`${size === 'xs' ? 'h-8 w-8 text-xs' : size === 'sm' ? 'h-10 w-10 text-sm' : size === 'md' ? 'h-12 w-12 text-base' : size === 'lg' ? 'h-16 w-16 text-lg' : 'h-20 w-20 text-xl'} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold ring-2 ring-white`}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
