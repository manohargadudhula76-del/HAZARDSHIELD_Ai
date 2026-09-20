import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Check, X } from 'lucide-react';
import { authService } from '../../services/authService';

export interface UserProfile {
  fullName: string;
  email: string;
  role: string;
  organization: string;
}

export interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!isOpen) return null;

  const handleProfileClick = () => {
    navigate('/settings');
    onClose();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    onClose();
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => {
          setShowConfirmLogout(false);
          onClose();
        }}
        aria-label="Close profile dropdown"
      />
      <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#151B2B] rounded-xl shadow-xl border border-slate-200 dark:border-[#263246] z-50 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-[#263246] flex items-center bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mr-3 flex-shrink-0">
            {getInitials(user.fullName)}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{user.fullName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-slate-200 dark:bg-[#263246] text-slate-700 dark:text-slate-300 rounded">
                {user.role}
              </span>
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded truncate max-w-full">
                {user.organization}
              </span>
            </div>
          </div>
        </div>
        
        {!showConfirmLogout ? (
          <div className="py-2">
            <button 
              onClick={handleProfileClick}
              className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263246]/50 transition-colors"
            >
              <User className="w-4 h-4 mr-3 text-slate-400" />
              Your Profile
            </button>
            <button 
              onClick={handleSettingsClick}
              className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263246]/50 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3 text-slate-400" />
              Settings
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-[#263246]" />
            <button 
              onClick={() => setShowConfirmLogout(true)}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="p-4 bg-red-50/50 dark:bg-red-900/10">
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-3 text-center">
              Are you sure you want to sign out?
            </p>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowConfirmLogout(false)}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#151B2B] border border-slate-300 dark:border-[#263246] rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#263246]/50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
