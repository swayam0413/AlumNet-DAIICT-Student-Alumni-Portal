import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        <TopBar />
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
        
        <footer className="mt-auto w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-stone-50 dark:bg-stone-950 border-t border-outline-variant/10">
          <p className="font-body text-xs tracking-wide uppercase text-stone-400 dark:text-stone-500">
            © 2024 DA-IICT AlumConnect. Built for Legacy.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {['Privacy Policy', 'Terms of Service', 'Campus Map', 'Contact Us'].map((item) => (
              <a 
                key={item} 
                href="#" 
                className="font-body text-xs tracking-wide uppercase text-stone-400 dark:text-stone-500 hover:text-orange-600 underline transition-all opacity-80 hover:opacity-100"
              >
                {item}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
