import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Send, User, Briefcase, Building2, MapPin, Loader2, MessageSquareText, CheckCircle2 } from 'lucide-react';
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
  const [companyAlumni, setCompanyAlumni] = useState<UserProfile[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<UserProfile | null>(null);
  const [tone, setTone] = useState('Professional');
  const [customNote, setCustomNote] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingAlumni, setLoadingAlumni] = useState(true);

  // Fetch all alumni at the job's company
  useEffect(() => {
    if (isOpen && job.company) {
      setLoadingAlumni(true);
      setSelectedAlumni(null);
      setGeneratedMessage('');
      setCustomNote('');
      setTone('Professional');
      
      dataService.getAlumniByCompany(job.company).then((alumni) => {
        setCompanyAlumni(alumni);
        // Auto-select if only one alumni
        if (alumni.length === 1) {
          setSelectedAlumni(alumni[0]);
        }
        setLoadingAlumni(false);
      }).catch(() => {
        setCompanyAlumni([]);
        setLoadingAlumni(false);
      });
    }
  }, [isOpen, job.company]);

  const handleGenerate = async () => {
    if (!profile || !selectedAlumni) {
      toast.error('Please select an alumni first');
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
          name: selectedAlumni.name,
          role: selectedAlumni.role,
          job_role: selectedAlumni.job_role,
          company: selectedAlumni.company,
          department: selectedAlumni.department,
          skills: selectedAlumni.skills || [],
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
    if (!user || !profile || !selectedAlumni) return;

    setSending(true);
    try {
      // 1. Create/get conversation with the selected alumni
      const convId = await dataService.getOrCreateConversation(
        user.uid,
        selectedAlumni.id,
        profile.name,
        selectedAlumni.name
      );

      // 2. Send the referral message in the conversation
      const referralHeader = `📋 **Referral Request** — ${job.title} at ${job.company}\n\n`;
      await dataService.sendMessage(convId, user.uid, referralHeader + generatedMessage);

      // 3. Notify the selected alumni via web bell notification
      try {
        await dataService.createNotification({
          userId: selectedAlumni.id,
          title: '🤝 Referral Request Received!',
          message: `${profile.name} sent you a referral request for ${job.title} at ${job.company}`,
          type: 'REFERRAL',
          actionUrl: '/messages',
          icon: '🤝',
        });
        // Send email notification to the alumni (fire-and-forget)
        if (selectedAlumni.email) {
          dataService.sendEmailNotification(
            [selectedAlumni.email],
            `Referral Request from ${profile.name} — ${job.title}`,
            `<h2>You received a referral request!</h2>
             <p><strong>${profile.name}</strong> is requesting a referral for:</p>
             <p><strong>${job.title}</strong> at <strong>${job.company}</strong></p>
             <p>Check your messages on AlumConnect to view the full request.</p>
             <a href="http://localhost:5173/messages">View Messages →</a>`
          ).catch(() => {});
        }
      } catch (notifErr) {
        console.error('Referral notification error:', notifErr);
      }

      toast.success(`Referral sent to ${selectedAlumni.name}'s inbox!`);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const alumniFirstName = selectedAlumni?.name?.split(' ')[0] || 'Alumni';

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
                  <p className="text-stone-500 font-medium text-sm">Select an alumni & generate a personalized request</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>

            <div className="p-8 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Side — Alumni Selection + Context */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Alumni Selection */}
                  <div className="bg-stone-50 rounded-2xl p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                      Select Alumni at {job.company}
                    </p>
                    {loadingAlumni ? (
                      <div className="flex items-center gap-2 text-stone-400 py-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Finding alumni...</span>
                      </div>
                    ) : companyAlumni.length > 0 ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {companyAlumni.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => {
                              setSelectedAlumni(a);
                              setGeneratedMessage(''); // Reset message when alumni changes
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                              selectedAlumni?.id === a.id
                                ? 'bg-primary/10 border-2 border-primary ring-2 ring-primary/20'
                                : 'bg-white border-2 border-transparent hover:bg-stone-100'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                              {a.profile_image ? (
                                <img src={a.profile_image} alt={a.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-on-surface truncate">{a.name}</p>
                              <p className="text-xs text-stone-500 truncate">{a.job_role || a.role}</p>
                            </div>
                            {selectedAlumni?.id === a.id && (
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-400 font-medium py-2">No alumni found at {job.company}</p>
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
                    disabled={generating || loadingAlumni || !selectedAlumni}
                    className="w-full py-4 bg-gradient-to-r from-primary to-orange-500 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Crafting Your Message...
                      </>
                    ) : !selectedAlumni ? (
                      <>
                        <User className="w-5 h-5" />
                        Select an Alumni First
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {generatedMessage ? 'Regenerate Message' : `Generate Referral for ${alumniFirstName}`}
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
                          Generated Message for {alumniFirstName}
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
