import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Send, User, Briefcase, Building2, MapPin, Loader2, MessageSquareText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { dataService, Job } from '../services/dataService';
import { UserProfile } from '../services/authService';
import { toast } from 'react-hot-toast';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

const TONES = [
  { value: 'Professional', label: 'Professional', emoji: '💼' },
  { value: 'Friendly', label: 'Friendly', emoji: '😊' },
  { value: 'Concise', label: 'Concise', emoji: '⚡' },
  { value: 'Formal', label: 'Formal', emoji: '🎓' },
];

export default function ReferralModal({ isOpen, onClose, job }: ReferralModalProps) {
  const { user, profile } = useAuth();
  const [alumni, setAlumni] = useState<UserProfile | null>(null);
  const [tone, setTone] = useState('Professional');
  const [customNote, setCustomNote] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingAlumni, setLoadingAlumni] = useState(true);

  // Fetch the alumni who posted the job
  useEffect(() => {
    if (isOpen && job.posted_by) {
      setLoadingAlumni(true);
      dataService.getUserById(job.posted_by).then((data) => {
        setAlumni(data);
        setLoadingAlumni(false);
      });
    }
    if (!isOpen) {
      setGeneratedMessage('');
      setCustomNote('');
      setTone('Professional');
    }
  }, [isOpen, job.posted_by]);

  const handleGenerate = async () => {
    if (!profile || !alumni) {
      toast.error('Missing profile or alumni data');
      return;
    }

    setGenerating(true);
    try {
      const result = await aiService.generateReferral({
        student: {
          name: profile.name,
          department: profile.department,
          graduation_year: profile.graduation_year,
          skills: profile.skills || [],
          resume_summary: profile.resume_summary,
        },
        alumni: {
          name: alumni.name,
          role: alumni.role,
          job_role: alumni.job_role,
          company: alumni.company,
          department: alumni.department,
          skills: alumni.skills || [],
        },
        job: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
        },
        tone,
        customNote: customNote || undefined,
      });

      if (result) {
        setGeneratedMessage(result);
        toast.success('Referral message generated!');
      } else {
        toast.error('Failed to generate. Check if GEMINI_API_KEY is set.');
      }
    } catch (error) {
      toast.error('Generation failed. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!generatedMessage.trim()) {
      toast.error('Generate a message first');
      return;
    }
    if (!user || !alumni) return;

    setSending(true);
    try {
      // Send as a connection request with the referral message
      await dataService.sendConnectionRequest(user.uid, alumni.id);
      toast.success(`Referral request sent to ${alumni.name}!`);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const alumniFirstName = alumni?.name?.split(' ')[0] || 'Alumni';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 pb-6 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <MessageSquareText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-black text-on-surface tracking-tight">Smart Referral</h2>
                  <p className="text-stone-500 font-medium text-sm">AI-crafted, personalized referral request</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>

            <div className="p-8 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Side — Context Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Alumni Info */}
                  <div className="bg-stone-50 rounded-2xl p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Referring Alumni</p>
                    {loadingAlumni ? (
                      <div className="flex items-center gap-2 text-stone-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Loading...</span>
                      </div>
                    ) : alumni ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                            {alumni.profile_image ? (
                              <img src={alumni.profile_image} alt={alumni.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{alumni.name}</p>
                            <p className="text-xs text-stone-500">{alumni.role}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {alumni.job_role && (
                            <div className="flex items-center gap-2 text-stone-600">
                              <Briefcase className="w-4 h-4 text-stone-400" />
                              <span className="font-medium">{alumni.job_role}</span>
                            </div>
                          )}
                          {alumni.company && (
                            <div className="flex items-center gap-2 text-stone-600">
                              <Building2 className="w-4 h-4 text-stone-400" />
                              <span className="font-medium">{alumni.company}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-stone-400 font-medium">Alumni info not available</p>
                    )}
                  </div>

                  {/* Job Info */}
                  <div className="bg-stone-50 rounded-2xl p-5 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Target Role</p>
                    <h3 className="font-bold text-on-surface text-lg leading-tight">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{job.location}</span>
                      </div>
                    )}
                    {job.description && (
                      <p className="text-xs text-stone-400 leading-relaxed line-clamp-3 mt-2">{job.description}</p>
                    )}
                  </div>

                  {/* Tone Selector */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Message Tone</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setTone(t.value)}
                          className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                            tone === t.value
                              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                        >
                          <span>{t.emoji}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side — Message Area */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Custom Note */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">
                      Additional Context <span className="text-stone-300">(Optional)</span>
                    </label>
                    <textarea
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="E.g., I recently completed a project on distributed systems..."
                      rows={2}
                      className="w-full bg-stone-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium placeholder:text-stone-300 resize-none text-sm"
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating || loadingAlumni}
                    className="w-full py-4 bg-gradient-to-r from-primary to-orange-500 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Crafting Your Message...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {generatedMessage ? 'Regenerate Message' : 'Generate Smart Referral'}
                      </>
                    )}
                  </button>

                  {/* Generated Message */}
                  {generatedMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                          Generated Message
                        </label>
                        <button
                          onClick={handleGenerate}
                          disabled={generating}
                          className="text-xs text-primary font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                          Regenerate
                        </button>
                      </div>
                      <textarea
                        value={generatedMessage}
                        onChange={(e) => setGeneratedMessage(e.target.value)}
                        rows={8}
                        className="w-full bg-white border-2 border-primary/20 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-primary/30 focus:border-primary text-on-surface font-medium resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-stone-400 font-medium text-right">
                        {generatedMessage.split(/\s+/).length} words • Editable before sending
                      </p>
                    </motion.div>
                  )}

                  {/* Send Button */}
                  {generatedMessage && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleSend}
                      disabled={sending}
                      className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black shadow-xl shadow-stone-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Referral Request to {alumniFirstName}
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
