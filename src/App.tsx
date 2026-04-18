import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './screens/Home';
import Directory from './screens/Directory';
import AIAssistant from './screens/AIAssistant';
import Jobs from './screens/Jobs';
import Profile from './screens/Profile';
import Admin from './screens/Admin';
import Login from './screens/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;

  // Force onboarding if profile is missing (except on profile page itself)
  // We allow /profile and its sub-routes for onboarding
  const isProfilePage = pathname.startsWith('/profile');
  if (!profile && !isProfilePage) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/networking" element={<Home />} />
            <Route path="/settings" element={<Home />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
