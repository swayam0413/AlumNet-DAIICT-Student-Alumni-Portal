import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, BellOff, Shield, Mail, Lock, Loader2, LogOut, Trash2, Eye, EyeOff, Save, User, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Settings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Theme
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Privacy
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'alumni-only' | 'private'>('public');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load saved preferences
  useEffect(() => {
    if (profile) {
      setEmailNotifications(profile.emailNotifications ?? true);
      setPushNotifications(profile.pushNotifications ?? true);
      setProfileVisibility(profile.profileVisibility ?? 'public');
    }
  }, [profile]);

  const handleSavePreferences = async () => {
    if (!user) return;
    try {
      await authService.updateProfile(user.uid, {
        emailNotifications,
        pushNotifications,
        profileVisibility,
      });
      toast.success('Preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully!');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error(error.message || 'Failed to update password');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;
    toast.error('Account deletion is handled by administrators. Please contact support.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight">Settings</h1>
        <p className="text-stone-500 font-medium font-body">Manage your account preferences and security.</p>
      </div>

      {/* Account Info */}
      <section className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Account Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1 block">Name</label>
            <p className="text-on-surface font-bold text-lg">{profile?.name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1 block">Email</label>
            <p className="text-on-surface font-bold text-lg">{user?.email || 'Not set'}</p>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1 block">Role</label>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-lg capitalize">{profile?.role || 'Member'}</span>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1 block">Status</label>
            <span className={`px-3 py-1 text-sm font-bold rounded-lg ${profile?.isApproved ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
              {profile?.isApproved ? 'Verified' : 'Pending Approval'}
            </span>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl">
            {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Appearance</h2>
        </div>
        <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
          <div>
            <p className="font-bold text-on-surface">Dark Mode</p>
            <p className="text-sm text-stone-500">Switch between light and dark themes</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${darkMode ? 'bg-primary' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-7' : ''}`} />
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-stone-400" />
              <div>
                <p className="font-bold text-on-surface">Email Notifications</p>
                <p className="text-sm text-stone-500">Receive updates via email</p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${emailNotifications ? 'bg-primary' : 'bg-stone-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${emailNotifications ? 'translate-x-7' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl">
            <div className="flex items-center gap-3">
              {pushNotifications ? <Bell className="w-5 h-5 text-stone-400" /> : <BellOff className="w-5 h-5 text-stone-400" />}
              <div>
                <p className="font-bold text-on-surface">Push Notifications</p>
                <p className="text-sm text-stone-500">Browser push notifications</p>
              </div>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${pushNotifications ? 'bg-primary' : 'bg-stone-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${pushNotifications ? 'translate-x-7' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Security</h2>
        </div>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full py-4 bg-stone-50 dark:bg-stone-800 text-on-surface rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-100 transition-all"
          >
            <Lock className="w-5 h-5" />
            Change Password
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPasswords(!showPasswords)} className="text-sm text-stone-500 hover:text-primary flex items-center gap-1">
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPasswords ? 'Hide' : 'Show'} passwords
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordForm(false)}
                className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                Update Password
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl p-8 border border-red-200/50">
        <h2 className="text-xl font-headline font-bold text-red-700 dark:text-red-400 mb-6">Danger Zone</h2>
        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-white dark:bg-stone-800 border border-stone-200 text-stone-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout from Account
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
