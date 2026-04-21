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
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from './authService';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  domain?: string;
  apply_url?: string;
  requirements?: string;
  posted_by: string;
  posted_by_name?: string;
  posted_by_role?: string;
  status: 'open' | 'closed';
  createdAt?: string;
}

export interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  targetAudience: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  organizerRole: string;
  isApproved: boolean;
  isVirtual: boolean;
  month: string;
  day: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: any;
  participantNames: Record<string, string>;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
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

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
    } catch (error) {
      console.error('getAllUsers error:', error);
      return [];
    }
  }

  async getAlumniByCompany(company: string): Promise<UserProfile[]> {
    try {
      // Try exact match first
      const q = query(
        collection(db, 'users'),
        where('isApproved', '==', true)
      );
      const snap = await getDocs(q);
      const companyLower = company.toLowerCase().trim();
      // Client-side case-insensitive matching for better results
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as UserProfile))
        .filter(u => u.company && u.company.toLowerCase().trim() === companyLower);
    } catch (error) {
      console.error('getAlumniByCompany error:', error);
      return [];
    }
  }

  async getRecommendedAlumni(currentUser: UserProfile): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'alumni'),
        where('isApproved', '==', true)
      );
      const snap = await getDocs(q);
      const allAlumni = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as UserProfile))
        .filter(a => a.id !== currentUser.id);

      // Score alumni by relevance
      const scored = allAlumni.map(alumni => {
        let score = 0;
        if (currentUser.department && alumni.department === currentUser.department) score += 3;
        if (currentUser.graduation_year && alumni.graduation_year) {
          const diff = Math.abs(currentUser.graduation_year - alumni.graduation_year);
          if (diff <= 2) score += 2;
          else if (diff <= 5) score += 1;
        }
        if (currentUser.skills && alumni.skills) {
          const shared = currentUser.skills.filter(s =>
            alumni.skills!.some(as => as.toLowerCase() === s.toLowerCase())
          );
          score += shared.length;
        }
        return { alumni, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 5).map(s => s.alumni);
    } catch (error) {
      console.error('getRecommendedAlumni error:', error);
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

      const [alumniSnap, studentsSnap, jobsSnap] = await Promise.all([
        getDocs(alumniQ),
        getDocs(studentsQ),
        getDocs(collection(db, 'jobs')),
      ]);

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

  async updateJob(jobId: string, data: Partial<Job>): Promise<void> {
    try {
      await updateDoc(doc(db, 'jobs', jobId), data);
    } catch (error: any) {
      console.error('updateJob error:', error);
      throw new Error(error?.message || 'Failed to update job.');
    }
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

  async getEvents(includeUnapproved = false): Promise<EventData[]> {
    try {
      let q;
      if (includeUnapproved) {
        q = query(collection(db, 'events'));
      } else {
        q = query(collection(db, 'events'), where('isApproved', '==', true));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as EventData));
    } catch (error) {
      console.error('getEvents error:', error);
      return [];
    }
  }

  async getUpcomingEvents(): Promise<EventData[]> {
    try {
      const q = query(
        collection(db, 'events'),
        where('isApproved', '==', true)
      );
      const snap = await getDocs(q);
      const today = new Date().toISOString().split('T')[0];
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as EventData))
        .filter(e => e.date >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('getUpcomingEvents error:', error);
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

  async updateEvent(eventId: string, data: Partial<EventData>): Promise<void> {
    try {
      await updateDoc(doc(db, 'events', eventId), data);
    } catch (error: any) {
      console.error('updateEvent error:', error);
      throw new Error(error?.message || 'Failed to update event.');
    }
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

  // --- Messaging ---

  async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    userName: string,
    otherUserName: string
  ): Promise<string> {
    try {
      // Check if conversation already exists
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => {
        const data = d.data();
        return data.participants.includes(otherUserId);
      });

      if (existing) return existing.id;

      // Create new conversation
      const convRef = await addDoc(collection(db, 'conversations'), {
        participants: [userId, otherUserId],
        participantNames: { [userId]: userName, [otherUserId]: otherUserName },
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      return convRef.id;
    } catch (error: any) {
      console.error('getOrCreateConversation error:', error);
      throw new Error('Failed to create conversation');
    }
  }

  async sendMessage(conversationId: string, senderId: string, text: string): Promise<void> {
    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId,
        text,
        createdAt: new Date().toISOString(),
      });
      // Update conversation with last message
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: text,
        lastMessageAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('sendMessage error:', error);
      throw new Error('Failed to send message');
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const q = query(collection(db, 'conversations', conversationId, 'messages'));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Message))
        .sort((a, b) => {
          const ta = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
          const tb = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        });
    } catch (error) {
      console.error('getMessages error:', error);
      return [];
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Conversation))
        .sort((a, b) => {
          const ta = typeof a.lastMessageAt === 'string' ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = typeof b.lastMessageAt === 'string' ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        });
    } catch (error) {
      console.error('getConversations error:', error);
      return [];
    }
  }

  // --- Networking Events ---

  async trackNetworkingEvent(event: {
    type: 'JOB_CHANGE' | 'PROMOTION' | 'NEW_JOB_POST' | 'SKILL_UPDATE' | 'NEW_MEMBER';
    alumniId: string;
    alumniName: string;
    companyName?: string;
    previousCompany?: string;
    roleName?: string;
    previousRole?: string;
    industry?: string;
    skills?: string[];
    department?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await addDoc(collection(db, 'networking_events'), {
        ...event,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('trackNetworkingEvent error:', error);
    }
  }

  async getRecentNetworkingEvents(days: number = 14): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'networking_events'));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString();

      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((e: any) => e.timestamp >= cutoffStr)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('getRecentNetworkingEvents error:', error);
      return [];
    }
  }

  // Build activity summary from actual alumni data for radar
  async buildRadarActivitySummary(): Promise<any[]> {
    try {
      // Get recent networking events
      const recentEvents = await this.getRecentNetworkingEvents(14);

      if (recentEvents.length > 0) return recentEvents;

      // If no events tracked yet, generate activity from alumni profiles
      const alumni = await this.getAlumni();
      const jobs = await this.getJobs();

      const activities: any[] = [];

      // Group alumni by company to find clusters
      const companyGroups: Record<string, any[]> = {};
      alumni.forEach(a => {
        if (a.company) {
          if (!companyGroups[a.company]) companyGroups[a.company] = [];
          companyGroups[a.company].push(a);
        }
      });

      // Create synthetic events from existing data
      Object.entries(companyGroups).forEach(([company, members]) => {
        if (members.length >= 2) {
          activities.push({
            type: 'COMPANY_CLUSTER',
            companyName: company,
            count: members.length,
            alumni: members.map(m => ({ name: m.name, role: m.job_role, department: m.department })),
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Add job posting activity
      jobs.slice(0, 5).forEach(job => {
        activities.push({
          type: 'NEW_JOB_POST',
          companyName: job.company,
          roleName: job.title,
          location: job.location,
          timestamp: job.createdAt || new Date().toISOString(),
        });
      });

      // Add skill trends from alumni
      const skillCounts: Record<string, number> = {};
      alumni.forEach(a => {
        a.skills?.forEach(s => {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        });
      });

      const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (topSkills.length > 0) {
        activities.push({
          type: 'SKILL_TREND',
          skills: topSkills.map(([skill, count]) => ({ skill, count })),
          timestamp: new Date().toISOString(),
        });
      }

      return activities;
    } catch (error) {
      console.error('buildRadarActivitySummary error:', error);
      return [];
    }
  }

  // --- Notifications ---

  async createNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type: 'NETWORKING_RADAR' | 'CONNECTION' | 'EVENT' | 'JOB' | 'SYSTEM';
    actionUrl?: string;
    icon?: string;
  }): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('createNotification error:', error);
    }
  }

  async getNotifications(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('getNotifications error:', error);
      return [];
    }
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    } catch (error) {
      console.error('markNotificationRead error:', error);
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    try {
      const notifs = await this.getNotifications(userId);
      const unread = notifs.filter((n: any) => !n.isRead);
      await Promise.all(unread.map((n: any) =>
        updateDoc(doc(db, 'notifications', n.id), { isRead: true })
      ));
    } catch (error) {
      console.error('markAllNotificationsRead error:', error);
    }
  }
}

export const dataService = new DataService();
