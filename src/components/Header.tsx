import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export type NavTab =
  | 'dashboard'
  | 'analyze'
  | 'camera'
  | 'history'
  | 'model'
  | 'how_it_works'
  | 'health'
  | 'docs'
  | 'about';

interface HeaderProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenContact?: () => void;
  databaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenContact,
  databaseConnected = true,
}) => {
  const navItems: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analyze', label: 'Analyze Screenshot' },
    { id: 'camera', label: 'Live Camera' },
    { id: 'history', label: 'Audit History' },
    { id: 'model', label: 'CNN Model' },
    { id: 'how_it_works', label: 'Pipeline Flow' },
    { id: 'health', label: 'System Status' },
    { id: 'docs', label: 'Windows & Docs' },
    { id: 'about', label: 'About Team' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark with subtle motion hover */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/25 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">
            <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white group-hover:text-amber-300 transition-colors">
            Fake UPI Shield
          </span>
        </motion.div>

        {/* Zone 2: Navigation Links with Animated layoutId Indicator */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-400 overflow-x-auto py-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-slate-800/80 border border-slate-700/60 rounded-lg -z-10 shadow-sm"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Contact button matching reference image + Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenContact && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenContact}
              className="px-3.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Contact
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('analyze')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Upload Screenshot
          </motion.button>
        </div>
      </div>
    </header>
  );
};
