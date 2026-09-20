import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Home, AlertTriangle } from 'lucide-react';
import { mockHabitations } from '../../data/habitations';
import { mockSafeHavens } from '../../data/safeHavens';
import { Habitation } from '../../types/habitation';
import { SafeHavenLocation } from '../../types/relocation';

export interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    } else {
      setQuery('');
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-amber-500';
  };

  const filteredHabitations = mockHabitations.filter((h: Habitation) => 
    h.name.toLowerCase().includes(query.toLowerCase()) || 
    h.district.toLowerCase().includes(query.toLowerCase()) ||
    h.state.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredSafeHavens = mockSafeHavens.filter((sh: SafeHavenLocation) => 
    sh.name.toLowerCase().includes(query.toLowerCase()) ||
    sh.district.toLowerCase().includes(query.toLowerCase()) ||
    sh.state.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const handleHabitationClick = (id: string) => {
    navigate(`/habitation/${id}`);
    onClose();
  };

  const handleSafeHavenClick = () => {
    navigate('/relocation');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/50 backdrop-blur-sm px-4 transition-opacity">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-label="Close search overlay"
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#151B2B] rounded-xl shadow-2xl border border-slate-200 dark:border-[#263246] overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-[#263246]">
          <Search className="w-6 h-6 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-lg bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400"
            placeholder="Search habitations, safe havens, districts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-2 ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#263246] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {query.length > 0 && (
          <div className="overflow-y-auto p-2">
            {filteredHabitations.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Habitations
                </div>
                {filteredHabitations.map(h => (
                  <button
                    key={h.id}
                    onClick={() => handleHabitationClick(h.id)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#263246] transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400">
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{h.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{h.district}, {h.state}</div>
                      </div>
                    </div>
                    <div className={`flex items-center text-xs font-semibold ${getRiskColor(h.hazardScore)}`}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Risk: {h.hazardScore}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {filteredSafeHavens.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Safe Havens
                </div>
                {filteredSafeHavens.map(sh => (
                  <button
                    key={sh.id}
                    onClick={handleSafeHavenClick}
                    className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#263246] transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3 text-emerald-600 dark:text-emerald-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{sh.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{sh.district}, {sh.state}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {filteredHabitations.length === 0 && filteredSafeHavens.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No results found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
