import React from 'react';
import { Search, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function TopBar() {
  const { profile, isAdmin, loading } = useAuth();

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
          <div className="relative hidden sm:block">
            <input 
              className="pl-10 pr-4 py-2 bg-surface-container-high border-none rounded-full text-sm focus:ring-2 focus:ring-primary w-64 transition-all" 
              placeholder="Search alumni..." 
              type="text" 
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
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
