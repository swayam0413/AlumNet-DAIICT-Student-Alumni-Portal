import React, { useEffect, useState } from 'react';
import { ArrowRight, Network, Eye, BookOpen, Briefcase, Send, MapPin, Video, Loader2, Calendar, ShieldCheck, Mail, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { toast } from 'react-hot-toast';
import CreateEventModal from '../components/CreateEventModal';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Home() {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState([
    { label: 'Total Alumni', value: '0', icon: Network, id: 'alumni' },
    { label: 'Total Students', value: '0', icon: Eye, id: 'students' },
    { label: 'Active Mentorships', value: '0', icon: BookOpen, id: 'mentorships' },
    { label: 'Job Opportunities', value: '0', icon: Briefcase, id: 'jobs' },
  ]);
  const [recommendedAlumni, setRecommendedAlumni] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    // Real-time events listener
    const q = query(
      collection(db, 'events'), 
      where('isApproved', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      // Client-side sort to avoid index errors
      const sortedEvents = eventsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(sortedEvents);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [globalStats, alumni] = await Promise.all([
          dataService.getGlobalStats(),
          dataService.getAlumni(),
        ]);
        if (globalStats) {
          setStats([
            { label: 'Total Alumni', value: globalStats.totalAlumni.toString(), icon: Network, id: 'alumni' },
            { label: 'Total Students', value: globalStats.totalStudents.toString(), icon: Eye, id: 'students' },
            { label: 'Active Mentorships', value: globalStats.activeMentorships.toString(), icon: BookOpen, id: 'mentorships' },
            { label: 'Job Opportunities', value: globalStats.totalJobs.toString(), icon: Briefcase, id: 'jobs' },
          ]);
        }

        if (alumni) {
          setRecommendedAlumni(alumni.slice(0, 2));
        }
      } catch (error) {
        console.error("Home Data Fetch Error", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleConnect = async (alumniId: string) => {
    if (!profile) return;
    try {
      await dataService.sendConnectionRequest(profile.id, alumniId);
      toast.success("Connection request sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-headline font-black text-primary tracking-tight">Administrator Control Panel</h3>
              <p className="text-stone-600 font-medium">You have platform-wide moderation privileges.</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/admin'}
            className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm uppercase tracking-widest active:scale-95"
          >
            Launch Console
          </button>
        </motion.div>
      )}

      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-[2rem] bg-stone-900 text-white p-12 min-h-[320px] flex flex-col justify-center">
        <div className="absolute inset-0 opacity-40">
          <img 
            alt="Alumni background" 
            className="w-full h-full object-cover"
            src="https://picsum.photos/seed/arch/1200/400?blur=2" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold uppercase tracking-widest mb-6">
            {profile?.graduation_year ? `Class of ${profile.graduation_year}` : profile?.role.toUpperCase()}
          </span>
          <h2 className="text-5xl font-headline font-black mb-4 tracking-tighter leading-tight">
            Welcome home, <span className="text-primary-container">{profile?.name?.split(' ')[0] || 'Friend'}.</span>
          </h2>
          <p className="text-stone-300 text-lg font-medium leading-relaxed max-w-xl">
            Your legacy continues here. Explore new opportunities, mentor upcoming talent, and reconnect with your fellow DA-IICT pioneers.
          </p>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_12px_40px_rgba(138,114,100,0.08)] group hover:translate-y-[-4px] transition-transform duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-orange-50 text-primary">
                <stat.icon />
              </div>
            </div>
            <h3 className="text-3xl font-headline font-extrabold text-on-surface">{stat.value}</h3>
            <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recommended Alumni */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-headline font-black tracking-tight text-orange-900">Recommended Alumni</h2>
              <p className="text-stone-500 font-medium font-body">Curated based on your interests and industry.</p>
            </div>
            <button 
              onClick={() => window.location.href = '/directory'}
              className="text-primary font-bold text-sm hover:underline flex items-center gap-1 font-headline"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedAlumni.length > 0 ? recommendedAlumni.map((alumnus) => (
              <div key={alumnus.id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_12px_40px_rgba(138,114,100,0.08)] border border-outline-variant/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner">
                    <img alt={alumnus.name} src={alumnus.profile_image} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-lg text-on-surface">{alumnus.name}</h4>
                    <p className="text-xs text-primary font-bold tracking-tight uppercase">{alumnus.job_role || 'Alumnus'}</p>
                    <p className="text-[11px] text-stone-400 font-semibold uppercase">{alumnus.company || 'DA-IICT'} • Batch of {alumnus.graduation_year || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  {alumnus.skills?.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-surface-container rounded text-[10px] font-bold text-stone-600 uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => window.location.href = `/profile/${alumnus.id}`}
                    className="w-full py-2 text-stone-400 font-bold text-[10px] uppercase tracking-widest hover:text-primary transition-all border border-transparent hover:border-primary/20 rounded-lg text-center"
                  >
                    View Biography
                  </button>
                  <button 
                    onClick={() => handleConnect(alumnus.id)}
                    className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-primary transition-all flex items-center justify-center gap-2 group"
                  >
                    Connect <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full p-12 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
                <p className="text-stone-400 font-medium">No alumni joined yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-headline font-black tracking-tight text-orange-900">Events</h2>
            <p className="text-stone-500 font-medium font-body">Mark your academic calendar.</p>
          </div>
          
          <div className="space-y-4">
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} className="bg-surface-container-low p-4 rounded-2xl border-l-4 border-primary hover:bg-white transition-colors cursor-pointer group">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center bg-white px-3 py-2 rounded-xl shadow-sm min-w-[60px]">
                    <span className="text-[10px] font-black text-stone-400 uppercase">{event.month || 'TBD'}</span>
                    <span className="text-xl font-headline font-black text-on-surface leading-none">{event.day || '--'}</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-on-surface group-hover:text-primary transition-colors leading-tight mb-1">{event.title}</h5>
                    <p className="text-[11px] font-semibold text-stone-400 uppercase flex items-center gap-1">
                      {event.location?.includes('Virtual') ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {event.location}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
                <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-400 font-medium">No upcoming events scheduled yet.</p>
              </div>
            )}
          </div>

          <div className="pt-4">
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 text-center">
              <h4 className="font-headline font-bold text-orange-900 mb-2">Host an Event?</h4>
              <p className="text-xs font-body text-stone-600 mb-4">Want to organize a chapter meet or a webinar for students?</p>
              <button 
                onClick={() => setIsEventModalOpen(true)}
                className="text-xs font-black text-primary uppercase tracking-widest hover:tracking-[0.15em] transition-all flex items-center justify-center w-full"
              >
                Get Started <ArrowRight className="w-3 h-3 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <CreateEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
