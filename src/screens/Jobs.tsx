import React, { useEffect, useState } from 'react';
import { Briefcase, MapPin, Send, Plus, ArrowRight, Loader2, X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { dataService, Job } from '../services/dataService';
import { toast } from 'react-hot-toast';
import ReferralModal from '../components/ReferralModal';

export default function Jobs() {
  const { profile, isAlumni, isAdmin } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', location: '', description: '' });
  const [selectedJobForReferral, setSelectedJobForReferral] = useState<Job | null>(null);

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
    if (!profile) return;
    try {
      await dataService.postJob({
        ...newJob,
        posted_by: profile.id,
        posted_by_name: profile.name,
        status: 'open',
      });
      toast.success("Job posted successfully! Visible to all users.");
      setShowPostModal(false);
      setNewJob({ title: '', company: '', location: '', description: '' });
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to post job");
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <h2 className="text-[3.5rem] font-extrabold tracking-tight text-on-surface leading-none mb-4 font-headline">
            The Talent <br/><span className="text-primary font-headline">Continuum.</span>
          </h2>
          <p className="text-lg text-on-surface-variant/80 max-w-2xl font-medium font-body">
            Bridging the gap between DA-IICT's historic legacy and the frontiers of global industry.
          </p>
        </div>
        {(isAlumni || isAdmin) && (
          <button 
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            Post a Job
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.length > 0 ? jobs.map((job) => (
            <div key={job.id} className="bg-surface-container-lowest rounded-[1.5rem] p-6 hover:shadow-[0_12px_40px_rgba(138,114,100,0.08)] transition-all duration-500 border border-outline-variant/5 flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center p-3">
                  <Briefcase className="w-6 h-6 text-stone-400 group-hover:text-primary transition-colors" />
                </div>
                {job.status === 'open' ? (
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Open</span>
                ) : (
                  <span className="px-3 py-1 bg-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-widest rounded-full">Closed</span>
                )}
              </div>
              
              <h4 className="text-xl font-headline font-bold text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">{job.title}</h4>
              <p className="text-on-surface-variant/60 text-sm font-medium mb-4 font-body">{job.company} • {job.location}</p>
              <p className="text-sm text-stone-500 line-clamp-2 mb-6 font-body">{job.description}</p>
              
              <div className="mt-auto pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                <button 
                  onClick={() => toast.success("Application feature coming soon!")}
                  className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                >
                  Apply Now <ArrowRight className="w-4 h-4" />
                </button>
                {!isAlumni && !isAdmin && job.posted_by && (
                  <button
                    onClick={() => setSelectedJobForReferral(job)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Request Referral
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full p-20 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
              <p className="text-stone-400 font-medium">No job postings found. Check back later!</p>
            </div>
          )}
        </div>
      )}

      {/* Post Job Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShowPostModal(false)}
                className="absolute right-6 top-6 p-2 hover:bg-stone-100 rounded-full transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
              
              <h3 className="text-2xl font-headline font-extrabold text-on-surface mb-6">Create Opportunity</h3>
              
              <form onSubmit={handlePostJob} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Role Title</label>
                  <input 
                    className="w-full bg-stone-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium"
                    placeholder="e.g. Senior Software Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Company</label>
                    <input 
                      className="w-full bg-stone-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium"
                      placeholder="e.g. Microsoft"
                      value={newJob.company}
                      onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Location</label>
                    <input 
                      className="w-full bg-stone-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium"
                      placeholder="e.g. Remote"
                      value={newJob.location}
                      onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 font-label">Description</label>
                  <textarea 
                    className="w-full bg-stone-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium min-h-[120px]"
                    placeholder="Short description of the role and team..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:bg-primary-container transition-all shadow-xl shadow-primary/10"
                >
                  Publish Role
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
    </div>
  );
}
