// Simple spinner component for loading states
'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div 
      className={`
        animate-spin rounded-full 
        border-solid border-transparent 
        border-t-purple-500 border-r-blue-500
        ${sizeClasses[size]}
        ${className}
      `}
    />
  );
}