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
  // Student-specific fields
  current_year?: string;          // 1st Year, 2nd Year, etc.
  enrollment_year?: number;       // Year entered college
  course?: string;                // B.Tech, M.Tech, PhD, etc.
  specialization?: string;        // ICT, CS, MnC, etc.
  cgpa?: number;                  // Current CGPA
  internship_company?: string;    // Internship completed at
  internship_role?: string;       // Internship role
  // Alumni-specific fields
  experience_years?: number;      // Years of experience
  linkedin_url?: string;          // LinkedIn profile URL
  passout_year?: number;          // Year graduated (alias for graduation_year)
  location?: string;              // Current city
  // AI-extracted resume fields
  ai_introduction?: string;       // LLM-generated professional intro
  ai_projects?: { title: string; description: string }[]; // Projects from resume
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

class AuthService {
  async signup(email: string, password: string, name: string, role: UserRole, extraData?: Partial<UserProfile>): Promise<User | null> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      name,
      email,
      role,
      isApproved: true,
      profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      skills: [],
      ...extraData,
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

    if (!snap.exists()) {
      // Doc doesn't exist — create it (e.g. after Firestore data wipe)
      await setDoc(ref, {
        id: uid,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // Doc exists — update it
    const existing = snap.data() as UserProfile;
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    // Track networking events for radar
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const { db: fireDb } = await import('../lib/firebase');
      
      // Company change = JOB_CHANGE event
      if (data.company && existing.company && data.company !== existing.company) {
        await addDoc(collection(fireDb, 'networking_events'), {
          type: 'JOB_CHANGE',
          alumniId: uid,
          alumniName: data.name || existing.name,
          companyName: data.company,
          previousCompany: existing.company,
          roleName: data.job_role || existing.job_role,
          department: data.department || existing.department,
          timestamp: new Date().toISOString(),
        });
      }

      // Role change to senior-level = PROMOTION event
      if (data.job_role && existing.job_role && data.job_role !== existing.job_role) {
        const seniorKeywords = ['senior', 'lead', 'principal', 'director', 'vp', 'head', 'chief', 'manager'];
        const isPromotion = seniorKeywords.some(k => 
          data.job_role!.toLowerCase().includes(k) && !existing.job_role!.toLowerCase().includes(k)
        );
        
        if (isPromotion) {
          await addDoc(collection(fireDb, 'networking_events'), {
            type: 'PROMOTION',
            alumniId: uid,
            alumniName: data.name || existing.name,
            companyName: data.company || existing.company,
            roleName: data.job_role,
            previousRole: existing.job_role,
            department: data.department || existing.department,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Skill update
      if (data.skills && existing.skills && JSON.stringify(data.skills) !== JSON.stringify(existing.skills)) {
        const newSkills = data.skills.filter(s => !existing.skills!.includes(s));
        if (newSkills.length > 0) {
          await addDoc(collection(fireDb, 'networking_events'), {
            type: 'SKILL_UPDATE',
            alumniId: uid,
            alumniName: data.name || existing.name,
            skills: newSkills,
            companyName: data.company || existing.company,
            department: data.department || existing.department,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('Event tracking error (non-critical):', err);
    }
  }
}

export const authService = new AuthService();
