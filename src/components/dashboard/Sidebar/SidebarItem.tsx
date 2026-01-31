'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  href: string;
  isExpanded: boolean;
  isActive: boolean;
  onClick?: () => void;
}

export default function SidebarItem({
  label,
  icon: Icon,
  href,
  isExpanded,
  isActive,
  onClick
}: SidebarItemProps) {
  const isProfileLink = href === '#'; // Profile opens modal, not a navigation link

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isProfileLink) {
      // Dispatch custom event for profile modal
      const event = new CustomEvent('openProfileModal');
      window.dispatchEvent(event);
    }
  };

  const content = (
    <motion.div
      className={cn(
        "relative group flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
        "hover:bg-white/8 border border-transparent",
        isActive && "bg-white/12 border-white/20",
        !isActive && "hover:border-white/10"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      {/* Icon - no color changes on selection */}
      <motion.div
        className="flex-shrink-0 text-white/70 group-hover:text-white"
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="w-5 h-5" />
      </motion.div>
      
      {/* Label */}
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className={cn(
              "ml-3 text-sm font-medium whitespace-nowrap",
              isActive ? "text-violet-300" : "text-white/80 group-hover:text-white"
            )}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Hover effect glow */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-violet-500/10 opacity-0 group-hover:opacity-100"
        initial={false}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );

  if (isProfileLink) {
    return content;
  }
  
  if (onClick) {
    return content;
  }
  
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}