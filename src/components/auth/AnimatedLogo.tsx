// Animated logo component for auth pages
'use client';

import { motion } from 'framer-motion';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showLoadingElements?: boolean;
}

export default function AnimatedLogo({ size = 'md', showLoadingElements = false }: AnimatedLogoProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const innerSizeClasses = {
    sm: 'inset-2 rounded-lg',
    md: 'inset-4 rounded-xl',
    lg: 'inset-6 rounded-2xl'
  };

  const iconSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      {/* Outer rotating ring - only show when loading */}
      {showLoadingElements && (
        <motion.div 
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-blue-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {/* Middle pulse ring - only show when loading */}
      {showLoadingElements && (
        <motion.div 
          className="absolute inset-2 rounded-full border border-purple-500/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Inner core */}
      <motion.div 
        className={`absolute ${innerSizeClasses[size]} bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-2xl flex items-center justify-center`}
        whileHover={{ rotate: 180, scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className={`${iconSizes[size]} animate-pulse`}
          animate={showLoadingElements ? { 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ 
            duration: showLoadingElements ? 2 : 0,
            repeat: showLoadingElements ? Infinity : 0
          }}
        >
          🎵
        </motion.div>
      </motion.div>

      {/* Orbiting particles - only show when loading */}
      {showLoadingElements && (
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full -translate-x-1/2 -translate-y-1" />
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full -translate-x-1/2 translate-y-1" />
          <div className="absolute left-0 top-1/2 w-2 h-2 bg-indigo-400 rounded-full -translate-y-1/2 -translate-x-1" />
          <div className="absolute right-0 top-1/2 w-2 h-2 bg-pink-400 rounded-full -translate-y-1/2 translate-x-1" />
        </motion.div>
      )}
    </div>
  );
}