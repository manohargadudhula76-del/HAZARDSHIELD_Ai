import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Activity,
  MapPin,
  Scale,
  Users,
  Compass,
  BarChart3,
  Bell,
  Settings,
  CheckCircle2,
  X,
  LogOut,
  User,
  Brain,
  Sparkles,
  Navigation,
  GitFork
} from 'lucide-react';
import { authService, DEMO_USER } from '../../services/authService';
import { UserProfile } from '../../types/auth';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: any;
  badge?: string;
  isIntelligence?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'RISK & ASSESSMENT',
    items: [
      { name: 'Hazard Risk Analysis', path: '/hazard-analysis', icon: Activity },
      { name: 'Red Zone Map', path: '/red-zone-map', icon: MapPin },
      { name: 'Carrying Capacity', path: '/carrying-capacity', icon: Scale },
      { name: 'Vulnerable Habitations', path: '/vulnerable-habitations', icon: Users },
    ],
  },
  {
    title: 'RELOCATION',
    items: [
      { name: 'Relocation Recommendations', path: '/relocation', icon: Compass },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
      { name: 'Alerts & Notifications', path: '/alerts', icon: Bell, badge: '3' },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Explainable Risk', path: '/explainable-risk', icon: Brain, isIntelligence: true },
      { name: 'Scenario Simulator', path: '/scenario-simulator', icon: Sparkles, isIntelligence: true },
      { name: 'Evacuation Impact', path: '/evacuation-impact', icon: Navigation, isIntelligence: true },
      { name: 'Cascading Impact', path: '/cascading-impact', icon: GitFork, isIntelligence: true },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USER);

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (u) setCurrentUser(u);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-200 dark:border-[#263246] bg-white dark:bg-[#151B2B] px-4 py-5 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-200 dark:border-[#263246]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-md">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  HAZARD<span className="text-slate-500 dark:text-slate-400">SHIELD</span> <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">AI</span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Command Center</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-16rem)] pr-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {section.title}
                  </p>
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${item.isIntelligence ? 'text-purple-600 dark:text-purple-400' : ''}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
                          {item.badge}
                        </span>
                      )}
                      {item.isIntelligence && !item.badge && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#263246]">
          <div className="rounded-xl border border-slate-200 dark:border-[#263246] bg-slate-50 dark:bg-[#0B0F14] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                System Operational <CheckCircle2 className="h-3 w-3" />
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-[#263246] text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-900 dark:text-white text-[11px] truncate">{currentUser.fullName}</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{currentUser.authorityLevel} Level</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
