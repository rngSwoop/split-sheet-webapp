// src/app/page.tsx (simplified landing page without animations)
'use client';

import Link from 'next/link';
import GlassButton from '@/components/ui/GlassButton';
import AuthBackground from '@/components/auth/AuthBackground';
import StaticLogo from '@/components/ui/StaticLogo';

export default function Home() {
  return (
    <AuthBackground>
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation Header */}
        <header className="w-full max-w-7xl mx-auto px-6 py-8">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <StaticLogo size="sm" />
              <span className="text-xl font-bold gradient-text">SplitSheet</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">
                Log In
              </Link>
              <GlassButton asChild className="text-sm px-4 py-2">
                <Link href="/auth/signup">
                  Get Started
                </Link>
              </GlassButton>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-4xl">
            <div className="mb-12">
              <StaticLogo size="lg" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text leading-tight">
              Split Sheet
              <br />
              <span className="text-4xl md:text-6xl font-light opacity-80">Revolution</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90 leading-relaxed">
              The cutting-edge platform for major labels, artists, and producers to manage publishing splits, 
              e-signatures, and royalty agreements with unbreakable security.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <GlassButton asChild className="text-lg px-8 py-4 text-lg">
                <Link href="/auth/signup">
                  Start Creating
                </Link>
              </GlassButton>
              <GlassButton 
                variant="outline" 
                asChild 
                className="border-white/20 text-lg px-8 py-4 hover:bg-white/10"
              >
                <Link href="/auth/login">
                  Log In
                </Link>
              </GlassButton>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="w-full max-w-7xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { 
                icon: '📝', 
                title: 'Secure E-Signatures', 
                desc: 'Legally binding digital signatures with full audit trail and tamper-proof logs.',
                gradient: 'from-purple-500 to-pink-500'
              },
              { 
                icon: '🔐', 
                title: 'Role-Based Access', 
                desc: 'Artists create, labels approve, admins reverse — with ironclad permissions.',
                gradient: 'from-blue-500 to-indigo-500'
              },
              { 
                icon: '⚡', 
                title: 'Immutable Records', 
                desc: 'Version history and blockchain-ready logs for every change and reversal.',
                gradient: 'from-indigo-500 to-purple-500'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card hover-glow text-center group"
              >
                <div className={`text-5xl mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 gradient-text">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: '99.9%', label: 'Uptime' },
                { number: '0ms', label: 'Latency' },
                { number: '256-bit', label: 'Encryption' },
                { number: '∞', label: 'Scalability' }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-400">
          <p>&copy; 2026 SplitSheet Pro. Built for the future of music publishing.</p>
        </footer>
      </div>
    </AuthBackground>
  );
}