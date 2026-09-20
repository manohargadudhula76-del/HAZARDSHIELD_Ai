import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Shield,
} from 'lucide-react';
import { authService, DEMO_USER } from '../../services/authService';
import { UserProfile } from '../../types/auth';
import { useTheme } from '../../context/ThemeContext';
import { SearchOverlay } from '../common/SearchOverlay';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { ProfileDropdown } from '../common/ProfileDropdown';

interface TopNavbarProps {
  onToggleSidebar: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Disaster Risk Intelligence Dashboard',
  '/hazard-analysis': 'Hazard Risk Assessment Engine',
  '/red-zone-map': 'Hazard-Based Red Zone Identification Map',
  '/carrying-capacity': 'Habitation Carrying Capacity Assessment',
  '/vulnerable-habitations': 'Vulnerable Habitation Priority List',
  '/relocation': 'AI-Powered Safe Relocation Recommendation',
  '/analytics': 'Disaster Risk Analytics & Executive Intelligence',
  '/alerts': 'Disaster Emergency Alerts & Notifications',
  '/settings': 'System Settings & Decision Thresholds'
};

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USER);

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (u) setCurrentUser(u);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/habitation/') ? 'Habitation Risk Detail Report' : 'HazardShield AI');

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-[#263246] bg-white/95 dark:bg-[#151B2B]/95 px-4 md:px-6 backdrop-blur-md transition-colors">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 lg:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {currentTitle}
            </h2>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400">
              HazardShield AI Intelligence Platform • {currentUser.authorityLevel} Command Center
            </p>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-[#263246] px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
            title="Search habitations, districts, zones (⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Search habitations, zones...</span>
            <kbd className="hidden sm:inline rounded bg-slate-200 dark:bg-slate-700 px-1.5 text-[10px] text-slate-600 dark:text-slate-300">⌘K</kbd>
          </button>

          {/* Notifications Dropdown Icon */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(prev => !prev);
                setIsUserMenuOpen(false);
              }}
              className="relative rounded-xl bg-slate-100 dark:bg-slate-800/80 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-[#263246] cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </button>

            <NotificationDropdown
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </div>

          {/* Clean Icon-Only Theme Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all duration-200 border border-slate-200 dark:border-[#263246] cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-800 transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserMenuOpen(prev => !prev);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-90 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:block text-left">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none truncate max-w-[130px]">{currentUser.fullName}</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-0.5 mt-0.5 truncate max-w-[130px]">
                  <Shield className="h-2.5 w-2.5 text-slate-600 dark:text-slate-300 shrink-0" /> {currentUser.role}
                </span>
              </div>
            </button>

            <ProfileDropdown
              isOpen={isUserMenuOpen}
              onClose={() => setIsUserMenuOpen(false)}
              user={currentUser}
            />
          </div>
        </div>
      </header>

      {/* Global Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
