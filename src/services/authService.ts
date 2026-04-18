import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'student' | 'alumni' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  graduation_year?: number;
  department?: string;
  company?: string;
  job_role?: string;
  skills?: string[];
  profile_image?: string;
  isApproved?: boolean;
  resume_summary?: string;
  resume_parsed_at?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

class AuthService {
  async signup(email: string, password: string, name: string, role: UserRole): Promise<User | null> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      name,
      email,
      role,
      isApproved: role === 'student', // Students auto-approved, alumni need admin approval
      profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      skills: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  }

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(ref, {
        id: uid,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

export const authService = new AuthService();
