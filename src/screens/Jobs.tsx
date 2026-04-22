import React, { useEffect, useState } from 'react';
import { Briefcase, MapPin, Send, Plus, ArrowRight, Loader2, X, UserPlus, ExternalLink, Users, Globe, Tag, FileText, Link2, Building2, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { dataService, Job } from '../services/dataService';
import { UserProfile } from '../services/authService';
import { toast } from 'react-hot-toast';
import ReferralModal from '../components/ReferralModal';
import ChatModal from '../components/ChatModal';
import { useNavigate } from 'react-router-dom';

export default function Jobs() {
  const { user, profile, isAlumni, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const [chatTarget, setChatTarget] = useState<{ id: string; name: string } | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    domain: '',
    apply_url: '',
    requirements: '',
  });
  const [selectedJobForReferral, setSelectedJobForReferral] = useState<Job | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [companyAlumni, setCompanyAlumni] = useState<Record<string, UserProfile[]>>({});
  const [loadingAlumni, setLoadingAlumni] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const data = await dataService.getJobs();
      if (data) setJobs(data);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    try {
      await dataService.postJob({
        title: newJob.title,
        company: newJob.company,
        location: newJob.location,
        description: newJob.description,
        domain: newJob.domain || undefined,
        apply_url: newJob.apply_url || undefined,
        requirements: newJob.requirements || undefined,
        posted_by: user.uid,
        posted_by_name: profile.name,
        posted_by_role: profile.role,
        status: 'open',
      });
      toast.success("Job posted successfully! Visible to all users.");
      setShowPostModal(false);
      setNewJob({ title: '', company: '', location: '', description: '', domain: '', apply_url: '', requirements: '' });
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to post job");
    }
  };

  const handleApply = (job: Job) => {
    if (job.apply_url) {
      // Open external link
      let url = job.apply_url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.success("No external link provided. Try requesting a referral instead!");
    }
  };

  const handleToggleExpand = async (job: Job) => {
    const jobId = job.id;
    if (expandedJob === jobId) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobId);

    // Fetch alumni at same company if not already loaded
    if (!companyAlumni[job.company]) {
      setLoadingAlumni(jobId);
      try {
        const alumni = await dataService.getAlumniByCompany(job.company);
        setCompanyAlumni(prev => ({ ...prev, [job.company]: alumni }));
      } catch (error) {
        console.error('Failed to fetch company alumni:', error);
      } finally {
        setLoadingAlumni(null);
      }
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <h2 className="text-[3.5rem] font-extrabold tracking-tight text-stone-900 dark:text-white leading-none mb-4 font-headline">
            The Talent <br/><span className="text-primary font-headline">Continuum.</span>
          </h2>
          <p className="text-lg text-on-surface-variant/80 max-w-2xl font-medium font-body">
            Bridging the gap between DA-IICT's historic legacy and the frontiers of global industry.
          </p>
        </div>
        <button 
          onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Post a Job
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.length > 0 ? jobs.map((job) => (
            <motion.div 
              key={job.id} 
              layout
              className="bg-white dark:bg-stone-800 rounded-[1.5rem] p-6 hover:shadow-[0_12px_40px_rgba(138,114,100,0.08)] transition-all duration-500 border border-stone-200 dark:border-stone-700 flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center p-3">
                  <Briefcase className="w-6 h-6 text-stone-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  {job.domain && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full">{job.domain}</span>
                  )}
                  {job.status === 'open' ? (
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Open</span>
                  ) : (
                    <span className="px-3 py-1 bg-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-widest rounded-full">Closed</span>
                  )}
                </div>
              </div>
              
              <h4 className="text-xl font-headline font-bold text-stone-900 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">{job.title}</h4>
              <p className="text-on-surface-variant/60 text-sm font-medium mb-2 font-body flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {job.company} 
                {job.location && <><span className="mx-1">•</span><MapPin className="w-3.5 h-3.5" /> {job.location}</>}
              </p>
              <p className="text-sm text-stone-500 line-clamp-2 mb-2 font-body">{job.description}</p>
              
              {/* Posted by */}
              {job.posted_by_name && (
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-4">
                  Posted by {job.posted_by_name} {job.posted_by_role && `• ${job.posted_by_role}`}
                </p>
              )}

              {/* Action Buttons */}
              <div className="mt-auto pt-4 border-t border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => handleApply(job)}
                    className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                  >
                    {job.apply_url ? (
                      <><ExternalLink className="w-4 h-4" /> Apply Now</>
                    ) : (
                      <><ArrowRight className="w-4 h-4" /> Apply Now</>
                    )}
                  </button>
                  {isStudent && job.posted_by && (
                    <button
                      onClick={() => setSelectedJobForReferral(job)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Request Referral
                    </button>
                  )}
                </div>

                {/* Show Alumni at Company Button */}
                <button
                  onClick={() => handleToggleExpand(job)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-stone-50 hover:bg-stone-100 rounded-xl text-xs font-bold text-stone-500 transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  Alumni at {job.company}
                  {expandedJob === job.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded: Alumni at same company */}
              <AnimatePresence>
                {expandedJob === job.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                        DA-IICT Alumni at {job.company}
                      </p>
                      {loadingAlumni === job.id ? (
                        <div className="flex items-center gap-2 text-stone-400 py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Finding alumni...</span>
                        </div>
                      ) : (companyAlumni[job.company] || []).length > 0 ? (
                        <div className="space-y-2">
                          {(companyAlumni[job.company] || []).map((a) => (
                            <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 hover:bg-stone-100 transition-all">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                                {a.profile_image ? (
                                  <img src={a.profile_image} alt={a.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
                                    {a.name?.charAt(0) || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/profile/${a.id}`)}>
                                <p className="text-sm font-bold text-stone-900 dark:text-white truncate hover:text-primary transition-colors">{a.name}</p>
                                <p className="text-[10px] text-stone-400 font-medium truncate">{a.job_role || a.role}</p>
                              </div>
                              <button
                                onClick={() => setChatTarget({ id: a.id, name: a.name })}
                                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all flex-shrink-0"
                                title="Send Message"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-stone-400 font-medium py-2">No alumni found at {job.company} yet.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )) : (
            <div className="col-span-full p-20 text-center bg-surface-container-low rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
              <Briefcase className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-400 font-medium">No job postings found. Be the first to post one!</p>
            </div>
          )}
        </div>
      )}

      {/* Post Job Modal — Enhanced */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowPostModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowPostModal(false)}
                className="absolute right-6 top-6 p-2 hover:bg-stone-100 rounded-full transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
              
              <div className="mb-6">
                <h3 className="text-2xl font-headline font-extrabold text-stone-900 dark:text-white">Share an Opportunity</h3>
                <p className="text-stone-500 text-sm font-medium mt-1">Post a job for the DA-IICT community</p>
              </div>
              
              <form onSubmit={handlePostJob} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Role Title *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input 
                      className="w-full bg-stone-50 border-none rounded-xl py-4 pl-11 pr-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-medium"
                      placeholder="e.g. Senior Software Engineer"
                      value={newJob.title}
                      onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Company *</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        className="w-full bg-stone-50 border-none rounded-xl py-4 pl-11 pr-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-medium"
                        placeholder="e.g. Amazon"
                        value={newJob.company}
                        onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Location *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        className="w-full bg-stone-50 border-none rounded-xl py-4 pl-11 pr-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-medium"
                        placeholder="e.g. Bangalore / Remote"
                        value={newJob.location}
                        onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Domain</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <select
                        className="w-full bg-stone-50 border-none rounded-xl py-4 pl-11 pr-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-bold appearance-none"
                        value={newJob.domain}
                        onChange={(e) => setNewJob({...newJob, domain: e.target.value})}
                      >
                        <option value="">Select Domain</option>
                        <option>Software Engineering</option>
                        <option>Data Science</option>
                        <option>Product Management</option>
                        <option>Design</option>
                        <option>DevOps</option>
                        <option>Cybersecurity</option>
                        <option>AI / ML</option>
                        <option>Finance</option>
                        <option>Marketing</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Apply Link</label>
                    <div className="relative">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        className="w-full bg-stone-50 border-none rounded-xl py-4 pl-11 pr-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-medium"
                        placeholder="LinkedIn / Company URL"
                        value={newJob.apply_url}
                        onChange={(e) => setNewJob({...newJob, apply_url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Requirements</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-4 h-4 text-stone-400" />
                    <textarea 
                      className="w-full bg-stone-50 border-none rounded-xl py-4 pl-11 pr-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-medium min-h-[80px] resize-none"
                      placeholder="e.g. 3+ years experience in React, TypeScript, Node.js..."
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({...newJob, requirements: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Job Description *</label>
                  <textarea 
                    className="w-full bg-stone-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-white font-medium min-h-[120px] resize-none"
                    placeholder="Describe the role, team, growth opportunities..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:bg-primary-container transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Publish Opportunity
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Referral Modal */}
      {selectedJobForReferral && (
        <ReferralModal
          isOpen={!!selectedJobForReferral}
          onClose={() => setSelectedJobForReferral(null)}
          job={selectedJobForReferral}
        />
      )}

      {/* Chat Modal */}
      {chatTarget && (
        <ChatModal
          isOpen={!!chatTarget}
          onClose={() => setChatTarget(null)}
          recipientId={chatTarget.id}
          recipientName={chatTarget.name}
        />
      )}
    </div>
  );
}
