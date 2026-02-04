// Shared Loading Screen Component - used by login and dashboard
'use client';

import { motion } from 'framer-motion';
import AnimatedLogo from '@/components/auth/AnimatedLogo';
import AuthBackground from '@/components/auth/AuthBackground';

interface SharedLoadingScreenProps {
  message?: string;
  disableBackground?: boolean; // New prop to disable background for overlay usage
}

export default function SharedLoadingScreen({ 
  message = 'Loading Split Sheet', 
  disableBackground = false 
}: SharedLoadingScreenProps) {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {disableBackground ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative z-10 flex items-center justify-center min-h-screen"
        >
          <div className="text-center">
            <AnimatedLogo size="lg" showLoadingElements={true} />
            
            {/* Loading text with gradient */}
            <div className="space-y-4 mt-8">
              <h1 className="text-2xl font-light tracking-wide">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
                  {message}
                </span>
              </h1>
              
              <div className="text-gray-400 text-sm tracking-widest uppercase">
                <span className="inline-block animate-pulse">Processing</span>
                <span className="inline-block animate-pulse animation-delay-200">.</span>
                <span className="inline-block animate-pulse animation-delay-400">.</span>
                <span className="inline-block animate-pulse animation-delay-600">.</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-8 w-64 h-1 mx-auto bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-progress" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-float" />
              <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-float animation-delay-2000" />
              <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-indigo-400 rounded-full animate-float animation-delay-4000" />
              <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-pink-400 rounded-full animate-float animation-delay-6000" />
            </div>
          </div>
        </motion.div>
      ) : (
        <AuthBackground>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative z-10 flex items-center justify-center min-h-screen"
          >
            <div className="text-center">
              <AnimatedLogo size="lg" showLoadingElements={true} />
              
              {/* Loading text with gradient */}
              <div className="space-y-4 mt-8">
                <h1 className="text-2xl font-light tracking-wide">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
                    {message}
                  </span>
                </h1>
                
                <div className="text-gray-400 text-sm tracking-widest uppercase">
                  <span className="inline-block animate-pulse">Processing</span>
                  <span className="inline-block animate-pulse animation-delay-200">.</span>
                  <span className="inline-block animate-pulse animation-delay-400">.</span>
                  <span className="inline-block animate-pulse animation-delay-600">.</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-8 w-64 h-1 mx-auto bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-progress" />
              </div>

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-float" />
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-float animation-delay-2000" />
                <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-indigo-400 rounded-full animate-float animation-delay-4000" />
                <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-pink-400 rounded-full animate-float animation-delay-6000" />
              </div>
            </div>
          </motion.div>
        </AuthBackground>
      )}
    </div>
  );
}