import React, { useState, useEffect, useRef } from 'react';
import { Search, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import NotificationBell from './NotificationBell';

export default function TopBar() {
  const { profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await dataService.searchUsers(searchQuery.trim());
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(138,114,100,0.08)]">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="md:hidden flex items-center gap-2">
             <span className="text-xl font-black text-orange-900 dark:text-orange-500 tracking-tighter font-headline">AlumConnect</span>
          </NavLink>
        </div>

        <div className="flex items-center gap-6">
          {isAdmin && (
             <NavLink to="/admin" className="md:hidden p-2 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-tighter">
               Admin
             </NavLink>
          )}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <input 
              className="pl-10 pr-4 py-2 bg-surface-container-high border-none rounded-full text-sm focus:ring-2 focus:ring-primary w-64 transition-all" 
              placeholder="Search alumni..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            
            {showDropdown && (
              <div className="absolute top-full mt-2 w-80 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden z-50">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      navigate(`/profile/${user.id}`);
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-stone-100 shrink-0">
                      {user.profile_image ? (
                        <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-stone-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{user.name}</p>
                      <p className="text-xs text-stone-500 truncate">
                        {user.role} {user.company ? `@ ${user.company}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <NavLink to="/profile" className="flex items-center gap-3 group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface line-clamp-1">
                  {loading ? 'Loading...' : (profile?.name || 'Complete Profile')}
                </p>
                <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest leading-none">
                  {loading ? '---' : (profile?.role || 'Guest')}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20 scale-95 active:opacity-80 transition-transform cursor-pointer shadow-sm group-hover:scale-100 transition-all bg-surface">
                {profile?.profile_image ? (
                  <img 
                    alt="User profile" 
                    className="w-full h-full object-cover"
                    src={profile.profile_image} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="text-stone-400 w-5 h-5" />
                  </div>
                )}
              </div>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
}
