import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
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
  posted_by_name?: string;
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
  // --- Individual Lookups ---

  async getUserById(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('getUserById error:', error);
      return null;
    }
  }

  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const snap = await getDoc(doc(db, 'jobs', jobId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Job;
      }
      return null;
    } catch (error) {
      console.error('getJobById error:', error);
      return null;
    }
  }

  // --- Alumni / Users ---

  async getAlumni(filters?: {
    role?: string;
    company?: string;
    batch?: string;
    includeUnapproved?: boolean;
  }): Promise<UserProfile[]> {
    try {
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

      const q = query(collection(db, 'users'), ...constraints);
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

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      // Get alumni and students separately to avoid complex queries
      const [alumni, students] = await Promise.all([
        this.getAlumni({ includeUnapproved: true }),
        this.getAllStudents(),
      ]);
      return [...alumni, ...students];
    } catch (error) {
      console.error('getAllUsers error:', error);
      return [];
    }
  }

  // --- Stats ---

  async getGlobalStats(): Promise<GlobalStats> {
    try {
      // Use getDocs instead of getCountFromServer for broader compatibility
      const alumniQ = query(collection(db, 'users'), where('role', '==', 'alumni'));
      const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));

      const [alumniSnap, studentsSnap, jobsSnap] = await Promise.all([
        getDocs(alumniQ),
        getDocs(studentsQ),
        getDocs(collection(db, 'jobs')),
      ]);

      // Mentorships may not exist yet, so catch gracefully
      let mentorshipCount = 0;
      try {
        const mentorshipsQ = query(collection(db, 'mentorships'), where('status', '==', 'active'));
        const mentorshipsSnap = await getDocs(mentorshipsQ);
        mentorshipCount = mentorshipsSnap.size;
      } catch {
        mentorshipCount = 0;
      }

      return {
        totalAlumni: alumniSnap.size,
        totalStudents: studentsSnap.size,
        totalJobs: jobsSnap.size,
        activeMentorships: mentorshipCount,
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
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
    } catch (error: any) {
      console.error('deleteJob error:', error);
      throw new Error(error?.message || 'Failed to delete job. You may not have admin permissions.');
    }
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
    try {
      await updateDoc(doc(db, 'events', eventId), { isApproved });
    } catch (error: any) {
      console.error('updateEventStatus error:', error);
      throw new Error(error?.message || 'Failed to update event. You may not have admin permissions.');
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error: any) {
      console.error('deleteEvent error:', error);
      throw new Error(error?.message || 'Failed to delete event. You may not have admin permissions.');
    }
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
    try {
      await updateDoc(doc(db, 'users', uid), { isApproved });
    } catch (error: any) {
      console.error('updateUserApproval error:', error);
      throw new Error(error?.message || 'Failed to update user approval. You may not have admin permissions.');
    }
  }
}

export const dataService = new DataService();
