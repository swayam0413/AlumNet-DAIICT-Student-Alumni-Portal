import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Bot, Settings, GraduationCap, LogOut, ShieldCheck, UserCircle, MessageCircle, FileSearch } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function Sidebar() {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Briefcase, label: 'Jobs', path: '/jobs' },
    { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: FileSearch, label: 'Resume Analyzer', path: '/resume-analyzer' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: UserCircle, label: 'My Profile', path: '/profile' },
    { icon: ShieldCheck, label: 'Admin Console', path: '/admin', hidden: !isAdmin },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logged out successfully");
      navigate('/login');
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const filteredNavItems = navItems.filter(item => !item.hidden);

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-stone-100 dark:bg-stone-900 py-8 px-4 space-y-2 sticky top-0 left-0 z-40 border-r border-outline-variant/10">
      <div className="px-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-lg relative">
            <GraduationCap className="text-white w-6 h-6" />
            {isAdmin && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
          </div>
          <div>
            <h1 className="font-headline font-black text-xl text-orange-900 tracking-tighter">AlumConnect</h1>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">  Daiict Networking</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-headline text-base
              ${isActive
                ? 'text-orange-900 dark:text-orange-400 font-bold bg-white dark:bg-stone-800 shadow-sm translate-x-1'
                : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 hover:pl-5 font-semibold'}
            `}
          >
            <item.icon className={`w-5 h-5 ${item.label === 'Admin Console' ? 'text-primary' : ''}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 space-y-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout Account
        </button>
      </div>
    </aside>
  );
}
