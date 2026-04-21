import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Radar, Briefcase, Calendar, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!user) return;
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const notifs = await dataService.getNotifications(user.uid);
        setNotifications(notifs);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await dataService.markAllNotificationsRead(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkRead = async (notifId: string) => {
    await dataService.markNotificationRead(notifId);
    setNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, isRead: true } : n
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NETWORKING_RADAR': return <Radar className="w-4 h-4 text-violet-500" />;
      case 'JOB': return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'EVENT': return <Calendar className="w-4 h-4 text-green-500" />;
      case 'CONNECTION': return <Users className="w-4 h-4 text-orange-500" />;
      default: return <Zap className="w-4 h-4 text-stone-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 hover:bg-stone-100 rounded-xl transition-colors"
      >
        <Bell className="w-5 h-5 text-stone-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-[9px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-stone-500" />
                <h4 className="font-bold text-sm text-on-surface">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                  <p className="text-stone-400 text-xs font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 15).map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkRead(notif.id)}
                    className={`px-4 py-3 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors ${
                      !notif.isRead ? 'bg-violet-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${!notif.isRead ? 'text-on-surface' : 'text-stone-500'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && <div className="w-1.5 h-1.5 bg-violet-500 rounded-full" />}
                        </div>
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">{notif.message}</p>
                        <p className="text-[9px] text-stone-300 mt-1 font-medium">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
