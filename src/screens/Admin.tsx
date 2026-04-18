import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, ShieldCheck, Search, Loader2, Calendar, Briefcase, Trash2, Clock, MapPin, Mail, User, Info, Tag, Video, Quote, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { dataService } from '../services/dataService';
import { UserProfile } from '../services/authService';
import { toast } from 'react-hot-toast';

export default function Admin() {
  const [pendingAlumni, setPendingAlumni] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalAlumni: 0,
    totalStudents: 0,
    totalJobs: 0,
    activeMentorships: 0
  });
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'jobs' | 'events' | 'users'>('dashboard');
  const [userSearch, setUserSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alumni, jobs, events, globalStats, students] = await Promise.all([
        dataService.getAlumni({ includeUnapproved: true }),
        dataService.getJobs(),
        dataService.getEvents(true),
        dataService.getGlobalStats(),
        dataService.getAllStudents()
      ]);
      
      if (alumni) {
        setPendingAlumni((alumni as UserProfile[]).filter(a => !a.isApproved));
        const alumniList = (alumni as UserProfile[]) || [];
        const studentList = (students as UserProfile[]) || [];
        setAllUsers([...alumniList, ...studentList]);
      }
      
      if (jobs) setAllJobs(jobs);
      if (events) setAllEvents(events);
      if (globalStats) setStats(globalStats);
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (uid: string) => {
    try {
      await dataService.updateUserApproval(uid, true);
      toast.success("Alumnus approved!");
      setPendingAlumni(prev => prev.filter(a => a.id !== uid));
      setAllUsers(prev => prev.map(u => u.id === uid ? { ...u, isApproved: true } : u));
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (uid: string) => {
    try {
      // In this system, "reject" currently just means leaving unapproved
      // but we could also mark them as rejected or delete
      await dataService.updateUserApproval(uid, false);
      toast.success("Registration status updated");
      setPendingAlumni(prev => prev.filter(a => a.id !== uid));
      setAllUsers(prev => prev.map(u => u.id === uid ? { ...u, isApproved: false } : u));
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Action failed");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await dataService.deleteJob(jobId);
      toast.success("Job removed");
      setAllJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await dataService.updateEventStatus(eventId, true);
      toast.success("Event approved!");
      setAllEvents(prev => prev.map(e => e.id === eventId ? { ...e, isApproved: true } : e));
    } catch (error) {
      toast.error("Failed to approve event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await dataService.deleteEvent(eventId);
      toast.success("Event removed");
      setAllEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleToggleUserApproval = async (uid: string, approved: boolean) => {
    try {
      await dataService.updateUserApproval(uid, approved);
      toast.success(`User ${approved ? "approved" : "revoked"} successfully`);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, isApproved: approved } : u))
      );
      if (!approved) {
        setPendingAlumni((prev) => {
          const user = allUsers.find((u) => u.id === uid);
          if (user && !prev.find((p) => p.id === uid)) {
            return [...prev, { ...user, isApproved: false }];
          }
          return prev;
        });
      } else {
        setPendingAlumni((prev) => prev.filter((a) => a.id !== uid));
      }
    } catch (error) {
      toast.error("Failed to update user status");
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight">Admin Console</h1>
          <p className="text-stone-500 font-medium">Manage the DA-IICT ecosystem.</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'approvals' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Approvals
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            User Directory
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'jobs' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Job Moderation
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'events' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Event Requests
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'dashboard' && (
          <section className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Alumni', value: stats.totalAlumni, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Students', value: stats.totalStudents, icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Job Postings', value: stats.totalJobs, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Events Pending', value: allEvents.filter(e => !e.isApproved).length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                  ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.label}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <h3 className="text-3xl font-headline font-black text-on-surface">{item.value}</h3>
                  </div>
                  <div className={`p-4 rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-stone-100 shadow-sm">
                <h3 className="text-xl font-headline font-black text-on-surface mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Pending Approvals
                </h3>
                <div className="space-y-4">
                  {pendingAlumni.slice(0, 3).map(alumnus => (
                    <div key={alumnus.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img src={alumnus.profile_image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div>
                          <p className="font-bold text-sm text-on-surface">{alumnus.name}</p>
                          <p className="text-xs text-stone-500">{alumnus.job_role}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('approvals')}
                        className="p-2 text-primary hover:bg-white rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {pendingAlumni.length === 0 && (
                    <p className="text-center py-8 text-stone-400 text-sm font-medium">All caught up!</p>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-stone-100 shadow-sm">
                <h3 className="text-xl font-headline font-black text-on-surface mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Recent Event Requests
                </h3>
                <div className="space-y-4">
                  {allEvents.filter(e => !e.isApproved).slice(0, 3).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-headline font-black text-primary border border-stone-100">
                          {event.day || '??'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface">{event.title}</p>
                          <p className="text-xs text-stone-500">{event.type}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('events')}
                        className="p-2 text-primary hover:bg-white rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {allEvents.filter(e => !e.isApproved).length === 0 && (
                    <p className="text-center py-8 text-stone-400 text-sm font-medium">No pending events.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Users className="text-primary w-6 h-6" />
                <h2 className="text-2xl font-headline font-bold text-on-surface">User Directory</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text"
                  placeholder="Search by name, role or batch..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64 md:w-80"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50">
                    <tr className="text-[10px] uppercase tracking-widest font-black text-stone-400">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Industry/Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {allUsers
                      .filter(u => 
                        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                        u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.graduation_year?.toString().includes(userSearch)
                      )
                      .map((user) => (
                      <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={user.profile_image} className="w-8 h-8 rounded-lg object-cover bg-stone-100" />
                            <div>
                                <p className="font-bold text-sm text-on-surface">{user.name}</p>
                                <p className="text-[10px] text-stone-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${user.role === 'alumni' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'alumni' ? (
                            <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-1 text-[10px] font-bold ${user.isApproved ? 'text-green-600' : 'text-orange-500'}`}>
                                {user.isApproved ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {user.isApproved ? 'Verified' : 'Pending'}
                                </span>
                                <button 
                                    onClick={() => handleToggleUserApproval(user.id, !user.isApproved)}
                                    className={`p-1 rounded-md transition-colors ${user.isApproved ? 'text-red-400 hover:bg-red-50' : 'text-green-400 hover:bg-green-50'}`}
                                    title={user.isApproved ? "Revoke Approval" : "Approve Now"}
                                >
                                    {user.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Permanent</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-stone-500">
                            {user.role === 'alumni' 
                              ? `${user.company || 'DA-IICT'} • ${user.graduation_year || 'N/A'}` 
                              : `${user.department || 'Student'} • ${user.graduation_year || 'N/A'}`}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'approvals' && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-primary w-6 h-6" />
              <h2 className="text-2xl font-headline font-bold text-on-surface">Pending Verification</h2>
            </div>

            {pendingAlumni.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingAlumni.map((alumnus) => (
                  <motion.div 
                    layout
                    key={alumnus.id}
                    className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img src={alumnus.profile_image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      <div>
                        <h4 className="font-bold text-on-surface leading-tight">{alumnus.name}</h4>
                        <p className="text-xs text-stone-500">{alumnus.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                        <Briefcase className="w-3 h-3" /> {alumnus.job_role || 'No role'} @ {alumnus.company || 'DA-IICT'}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                        <Users className="w-3 h-3" /> Batch of {alumnus.graduation_year || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                        <Info className="w-3 h-3" /> {alumnus.department || 'No department'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(alumnus.id)}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(alumnus.id)}
                        className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-stone-200 transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Ignore
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant">
                <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 font-medium font-body">No pending verification requests.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'jobs' && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="text-primary w-6 h-6" />
              <h2 className="text-2xl font-headline font-bold text-on-surface">Job Moderation</h2>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/10">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low">
                  <tr className="text-[10px] uppercase tracking-widest font-black text-stone-400">
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {allJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-on-surface text-sm">{job.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-stone-500">{job.company}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'events' && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-primary w-6 h-6" />
              <h2 className="text-2xl font-headline font-bold text-on-surface">Event Requests</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {allEvents.map((event) => (
                <div key={event.id} className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${event.isApproved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {event.isApproved ? 'Approved' : 'Pending Review'}
                        </span>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {event.type}
                        </span>
                      </div>
                      <h3 className="text-3xl font-headline font-black text-on-surface tracking-tight leading-tight">{event.title}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded-xl text-primary">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Date</p>
                          <p className="font-bold text-on-surface">{event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded-xl text-primary">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Time</p>
                          <p className="font-bold text-on-surface">{event.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded-xl text-primary">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Audience</p>
                          <p className="font-bold text-on-surface">{event.targetAudience || 'All'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-stone-50 rounded-2xl relative">
                      <Quote className="absolute top-2 right-4 w-12 h-12 text-stone-200" />
                      <p className="text-stone-600 text-sm font-medium leading-relaxed italic pr-8">
                        {event.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-8 items-center border-t border-outline-variant/10 pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-stone-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Requested by</p>
                          <p className="text-sm font-bold text-on-surface">{event.organizerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-stone-100 rounded-lg">
                          <Mail className="w-4 h-4 text-stone-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Contact</p>
                          <p className="text-sm font-bold text-on-surface">{event.organizerEmail}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-48 flex lg:flex-col gap-3">
                    {!event.isApproved && (
                      <button 
                        onClick={() => handleApproveEvent(event.id)}
                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {allEvents.length === 0 && (
                <div className="p-20 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant">
                  <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500 font-medium font-body">No event requests recorded.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
