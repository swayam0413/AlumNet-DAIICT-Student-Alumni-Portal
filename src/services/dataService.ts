import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from './authService';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  posted_by: string;
  status: 'open' | 'closed';
  createdAt?: string;
}

export interface GlobalStats {
  totalAlumni: number;
  totalStudents: number;
  activeMentorships: number;
  totalJobs: number;
}

class DataService {
  // --- Alumni / Users ---

  async getAlumni(filters?: {
    role?: string;
    company?: string;
    batch?: string;
    includeUnapproved?: boolean;
  }): Promise<UserProfile[]> {
    try {
      let q;
      const constraints: any[] = [];

      if (!filters?.includeUnapproved) {
        constraints.push(where('isApproved', '==', true));
      }

      if (filters?.role) {
        constraints.push(where('role', '==', filters.role.toLowerCase()));
      }

      if (filters?.company) {
        constraints.push(where('company', '==', filters.company));
      }

      if (filters?.batch) {
        constraints.push(where('graduation_year', '==', parseInt(filters.batch)));
      }

      q = query(collection(db, 'users'), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
    } catch (error) {
      console.error('getAlumni error:', error);
      return [];
    }
  }

  async getAllStudents(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
    } catch (error) {
      console.error('getAllStudents error:', error);
      return [];
    }
  }

  // --- Stats ---

  async getGlobalStats(): Promise<GlobalStats> {
    try {
      const alumniQ = query(collection(db, 'users'), where('role', '==', 'alumni'));
      const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
      const jobsQ = query(collection(db, 'jobs'));
      const mentorshipsQ = query(collection(db, 'mentorships'), where('status', '==', 'active'));

      const [alumniSnap, studentsSnap, jobsSnap, mentorshipsSnap] = await Promise.all([
        getCountFromServer(alumniQ),
        getCountFromServer(studentsQ),
        getCountFromServer(jobsQ),
        getCountFromServer(mentorshipsQ).catch(() => ({ data: () => ({ count: 0 }) })),
      ]);

      return {
        totalAlumni: alumniSnap.data().count,
        totalStudents: studentsSnap.data().count,
        totalJobs: jobsSnap.data().count,
        activeMentorships: mentorshipsSnap.data().count,
      };
    } catch (error) {
      console.error('getGlobalStats error:', error);
      return { totalAlumni: 0, totalStudents: 0, totalJobs: 0, activeMentorships: 0 };
    }
  }

  // --- Jobs ---

  async getJobs(): Promise<Job[]> {
    try {
      const snap = await getDocs(collection(db, 'jobs'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
    } catch (error) {
      console.error('getJobs error:', error);
      return [];
    }
  }

  async postJob(job: Omit<Job, 'id'>): Promise<void> {
    await addDoc(collection(db, 'jobs'), {
      ...job,
      createdAt: new Date().toISOString(),
    });
  }

  async deleteJob(jobId: string): Promise<void> {
    await deleteDoc(doc(db, 'jobs', jobId));
  }

  // --- Events ---

  async getEvents(includeUnapproved = false): Promise<any[]> {
    try {
      let q;
      if (includeUnapproved) {
        q = query(collection(db, 'events'));
      } else {
        q = query(collection(db, 'events'), where('isApproved', '==', true));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('getEvents error:', error);
      return [];
    }
  }

  async createEvent(eventData: any): Promise<void> {
    await addDoc(collection(db, 'events'), {
      ...eventData,
      isApproved: false,
      createdAt: new Date().toISOString(),
    });
  }

  async updateEventStatus(eventId: string, isApproved: boolean): Promise<void> {
    await updateDoc(doc(db, 'events', eventId), { isApproved });
  }

  async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, 'events', eventId));
  }

  // --- Connections ---

  async sendConnectionRequest(senderId: string, receiverId: string): Promise<void> {
    await addDoc(collection(db, 'connections'), {
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  // --- User Approval ---

  async updateUserApproval(uid: string, isApproved: boolean): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { isApproved });
  }
}

export const dataService = new DataService();
