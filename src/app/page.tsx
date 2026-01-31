// src/app/page.tsx
import Link from 'next/link';
import GlassButton from '@/components/ui/GlassButton'; // Assuming you created this; if not, I'll provide below

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated background particles (simple CSS-only for now) */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
      </div>

      <header className="relative z-10 container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
          SplitSheet Pro
        </h1>
        <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90">
          The cutting-edge platform for major labels, artists, and producers to manage publishing splits, e-signatures, and royalty agreements with unbreakable security.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <GlassButton asChild>
            <Link href="/auth/signup">
              Get Started
            </Link>
          </GlassButton>
          <GlassButton variant="outline" asChild className="border-white/20">
            <Link href="/auth/login">
              Log In
            </Link>
          </GlassButton>
        </div>
      </header>

      {/* Benefits Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 grid md:grid-cols-3 gap-8">
        {[
          { icon: '📝', title: 'Secure E-Signatures', desc: 'Legally binding digital signatures with full audit trail and tamper-proof logs.' },
          { icon: '🔐', title: 'Role-Based Access', desc: 'Artists create, labels approve, admins reverse — with ironclad permissions.' },
          { icon: '⚡', title: 'Immutable Records', desc: 'Version history and blockchain-ready logs for every change and reversal.' }
        ].map((feature, index) => (
          <div key={index} className="glass-card hover-glow text-center">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-3 gradient-text">{feature.title}</h3>
            <p className="text-gray-300">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-20 py-8 text-center text-sm text-gray-400">
        <p>&copy; 2026 SplitSheet Pro. Built for the future of music publishing.</p>
      </footer>
    </div>
  );
}