'use client';

interface UniversalBackgroundProps {
  children: React.ReactNode;
  type?: 'auth' | 'dashboard';
}

export default function UniversalBackground({ children, type = 'auth' }: UniversalBackgroundProps) {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* Full viewport background with gradient and subtle texture */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-purple-900/10" />
        
        {/* Subtle texture pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content container based on type */}
      {type === 'auth' ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          {children}
        </div>
      ) : (
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      )}
    </div>
  );
}