import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { authService, UserProfile } from '../services/authService';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAlumni: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up existing profile listener if switching users
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        // Listen for profile changes in real-time
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              // No profile doc yet — don't sign out, just set null
              // The login flow will create the profile
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Profile Listener Error:", error);
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' ||
      profile?.email?.toLowerCase() === 'dhruvpanchasara389@gmail.com' ||
      user?.email?.toLowerCase() === 'dhruvpanchasara389@gmail.com',
    isAlumni: profile?.role === 'alumni',
    isStudent: profile?.role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
