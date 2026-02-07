// Simple static logo component for branding
interface StaticLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StaticLogo({ size = 'md', className = '' }: StaticLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const innerSizeClasses = {
    sm: 'inset-1 rounded-lg',
    md: 'inset-2 rounded-xl',
    lg: 'inset-3 rounded-2xl'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className={`absolute ${innerSizeClasses[size]} bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-xl flex items-center justify-center`}>
        <span className={`${iconSizes[size]}`}>🎵</span>
      </div>
    </div>
  );
}