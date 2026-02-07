import UniversalBackground from '@/components/ui/UniversalBackground';

// Shared background component for all auth pages - now using UniversalBackground
export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <UniversalBackground type="auth">
      {children}
    </UniversalBackground>
  );
}