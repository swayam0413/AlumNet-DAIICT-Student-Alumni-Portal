import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, CheckCircle, GraduationCap, Briefcase, GraduationCap as SchoolIcon, BrainCircuit, Loader2, Save, X, Edit2, Upload, FileCheck, User, Quote, Mail, ShieldCheck, Calendar, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService, UserProfile } from '../services/authService';
import { aiService } from '../services/aiService';
import { dataService } from '../services/dataService';
import { toast } from 'react-hot-toast';
import ChatModal from '../components/ChatModal';

export default function Profile() {
  const { id } = useParams();
  const { profile: loggedInProfile, user: authUser } = useAuth();
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [loadingView, setLoadingView] = useState(!!id);
  const [chatOpen, setChatOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    job_role: '',
    company: '',
    department: '',
    graduation_year: 2024,
    skills: [],
    profile_image: '',
    resume_summary: '',
    course: '',
    specialization: '',
    enrollment_year: undefined,
    current_year: '',
    cgpa: undefined,
    internship_company: '',
    internship_role: '',
    experience_years: undefined,
    linkedin_url: '',
    location: '',
    passout_year: undefined,
  });

  // Determine if this is the current user's profile
  const isOwnProfile = !id || id === authUser?.uid;
  const effectiveProfile = isOwnProfile ? loggedInProfile : viewedProfile;

  // Fetch profile if viewing someone else
  useEffect(() => {
    async function fetchViewedProfile() {
      if (id && id !== authUser?.uid) {
        setLoadingView(true);
        try {
          const profileData = await authService.getProfile(id);
          setViewedProfile(profileData);
        } catch (err) {
          toast.error("Failed to load profile");
        } finally {
          setLoadingView(viewedProfile !== null);
          setLoadingView(false);
        }
      } else {
        setLoadingView(false);
      }
    }
    fetchViewedProfile();
  }, [id, authUser]);

  // Effect to update formData when profile loads
  useEffect(() => {
    if (isOwnProfile && loggedInProfile) {
      setFormData({
        name: loggedInProfile.name || '',
        job_role: loggedInProfile.job_role || '',
        company: loggedInProfile.company || '',
        department: loggedInProfile.department || '',
        graduation_year: loggedInProfile.graduation_year || 2024,
        skills: loggedInProfile.skills || [],
        profile_image: loggedInProfile.profile_image || authUser?.photoURL || '',
        resume_summary: loggedInProfile.resume_summary || '',
        course: loggedInProfile.course || '',
        specialization: loggedInProfile.specialization || '',
        enrollment_year: loggedInProfile.enrollment_year,
        current_year: loggedInProfile.current_year || '',
        cgpa: loggedInProfile.cgpa,
        internship_company: loggedInProfile.internship_company || '',
        internship_role: loggedInProfile.internship_role || '',
        experience_years: loggedInProfile.experience_years,
        linkedin_url: loggedInProfile.linkedin_url || '',
        location: loggedInProfile.location || '',
        passout_year: loggedInProfile.passout_year,
      });
    }
  }, [loggedInProfile, authUser, isOwnProfile]);

  if (!authUser || loadingView) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-stone-500 font-medium font-body">
        {loadingView ? 'Loading profile...' : 'Authenticating...'}
      </p>
    </div>
  );

  // If profile is missing and it's our own, we show setup
  if (isOwnProfile && !loggedInProfile && !isEditing) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-12 bg-white dark:bg-stone-800 rounded-[40px] shadow-2xl shadow-primary/5 border border-stone-200 dark:border-stone-700 text-center space-y-8">
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
          <BrainCircuit className="text-primary w-12 h-12" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-headline font-extrabold tracking-tight text-stone-900 dark:text-white">Welcome to AlumConnect</h1>
          <p className="text-on-surface-variant font-medium font-body leading-relaxed">
            Let's build your professional legacy. Upload your resume and our AI will automatically construct your profile for you.
          </p>
        </div>
        
        <div className="space-y-4">
          <label className="block w-full cursor-pointer p-8 bg-primary/5 border-2 border-dashed border-primary/20 rounded-3xl hover:bg-primary/10 transition-all group">
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,image/*" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setParsing(true);
                toast.loading("AI Building your profile...", { id: 'resume-parse' });
                try {
                  const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                  const data = await aiService.parseResume(base64, file.type);
                  if (data) {
                    const initialProfile = {
                      name: data.name || authUser?.displayName || 'Alumnus',
                      email: authUser?.email || '',
                      role: 'alumni' as const,
                      job_role: data.job_role || '',
                      company: data.company || '',
                      skills: data.skills || [],
                      graduation_year: data.graduation_year || 2024,
                      department: data.department || '',
                      resume_summary: data.summary || '',
                      isApproved: false
                    };
                    await authService.updateProfile(authUser!.uid, initialProfile);
                    toast.success("Profile created successfully!", { id: 'resume-parse' });
                    window.location.reload(); // Refresh to load new profile
                  } else {
                    toast.error("AI couldn't extract data.", { id: 'resume-parse' });
                  }
                } catch (err) {
                  toast.error("Failed to parse resume.", { id: 'resume-parse' });
                } finally {
                  setParsing(false);
                }
              }} 
            />
            <Upload className="w-10 h-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-primary font-black uppercase tracking-widest text-sm">Upload Resume (PDF/Image)</p>
            <p className="text-[10px] text-stone-400 font-bold mt-2">AI WILL AUTO-FILL EVERYTHING</p>
          </label>

          <div className="flex items-center gap-4 py-4">
            <div className="h-px bg-stone-100 flex-1"></div>
            <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">OR</span>
            <div className="h-px bg-stone-100 flex-1"></div>
          </div>

          <button 
            onClick={() => setIsEditing(true)}
            className="w-full py-4 bg-white border border-stone-200 text-stone-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
          >
            <Edit2 className="w-5 h-5" />
            Setup Manually
          </button>
        </div>
      </div>
    );
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    toast.loading("AI is analyzing your resume...", { id: 'resume-parse' });

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const data = await aiService.parseResume(base64, file.type);
      
      if (data) {
        // Build the update payload with AI-extracted fields
        const updatePayload: any = {
          name: data.name || formData.name,
          job_role: data.job_role || formData.job_role,
          company: data.company || formData.company,
          skills: data.skills || formData.skills,
          graduation_year: data.graduation_year || formData.graduation_year,
          department: data.department || formData.department,
          resume_summary: data.summary || formData.resume_summary,
          ai_introduction: data.ai_introduction || '',
          ai_projects: data.ai_projects || [],
          resume_parsed_at: new Date().toISOString(),
        };

        // Update formData for edit mode
        setFormData(prev => ({ ...prev, ...updatePayload }));

        // Save directly to Firestore so it reflects immediately
        if (authUser) {
          await authService.updateProfile(authUser.uid, updatePayload);
        }

        toast.success("Resume analyzed! Introduction, projects & skills updated.", { id: 'resume-parse' });
      } else {
        toast.error("AI couldn't extract data.", { id: 'resume-parse' });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse resume.", { id: 'resume-parse' });
    } finally {
      setParsing(false);
    }
  };

  const handleUpdate = async () => {
    if (!authUser) return;
    setEditLoading(true);
    try {
      // If profile doesn't exist, we're basically creating it
      const dataToSave = {
        ...formData,
        email: authUser.email,
        role: loggedInProfile?.role || 'student', // Default to student
        id: authUser.uid,
        isApproved: loggedInProfile?.isApproved ?? true, // Default to true for easy access if missing
      };
      await authService.updateProfile(authUser.uid, dataToSave);
      toast.success(loggedInProfile ? "Profile updated!" : "Profile created!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const displayProfile = effectiveProfile || {
    id: id || authUser.uid,
    name: (isOwnProfile ? authUser.displayName : 'Unknown User') || 'AlumConnect Member',
    role: 'New Member',
    profile_image: (isOwnProfile ? authUser.photoURL : null) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id || authUser.email}`,
    isApproved: false,
    email: (isOwnProfile ? authUser.email : 'private@example.com'),
    graduation_year: 2024,
    skills: [],
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Profile Header */}
      <section className="relative h-[240px] md:h-[320px] w-full overflow-hidden rounded-[40px] group shadow-2xl shadow-primary/5">
        <img 
          alt="Banner Header" 
          className="w-full h-full object-cover grayscale-[0.2]" 
          src={`https://picsum.photos/seed/profile-${displayProfile.id}/1200/400`} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
        {isOwnProfile && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute bottom-15 right-6 p-4 bg-white/90 backdrop-blur rounded-2xl shadow-xl hover:bg-white transition-all flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-white"
          >
            <Edit2 className="w-4 h-4" />
            Edit User Profile
          </button>
        )}
        {!isOwnProfile && (
          <div className="absolute bottom-6 right-6 flex gap-3">
            <button
              onClick={() => setChatOpen(true)}
              className="p-4 bg-white/90 backdrop-blur rounded-2xl shadow-xl hover:bg-white transition-all flex items-center gap-2 font-bold text-sm text-primary"
            >
              <MessageCircle className="w-4 h-4" /> Send Message
            </button>
            <button
              onClick={async () => {
                if (!profile || !id) return;
                try {
                  await dataService.sendConnectionRequest(profile.id, id);
                  toast.success('Connection request sent!');
                } catch (e: any) { toast.error(e.message || 'Failed'); }
              }}
              className="p-4 bg-primary backdrop-blur rounded-2xl shadow-xl hover:bg-orange-700 transition-all flex items-center gap-2 font-bold text-sm text-white"
            >
              <Send className="w-4 h-4" /> Connect
            </button>
          </div>
        )}
      </section>

      <div className="-mt-24 relative z-10 pb-20 space-y-12 px-4 md:px-0">
        {/* Profile Identity Card */}
        <div className="bg-white dark:bg-stone-800 rounded-[40px] p-8 shadow-[0_32px_80px_rgba(138,114,100,0.12)] border border-stone-200 dark:border-stone-700">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-44 h-44 rounded-3xl bg-surface overflow-hidden border-8 border-surface-container-lowest shadow-2xl shrink-0 transition-transform hover:scale-105 duration-500">
              <img 
                alt="Profile Image" 
                className="w-full h-full object-cover" 
                src={displayProfile.profile_image} 
              />
            </div>
            <div className="flex-1 w-full space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      className="text-2xl font-headline font-extrabold tracking-tight text-stone-900 dark:text-white w-full bg-stone-50 border-2 border-transparent rounded-2xl py-3 px-6 focus:ring-0 focus:border-primary transition-all"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                      <input 
                        className="pl-14 text-lg text-primary font-medium w-full bg-stone-200/30 border-none rounded-2xl py-3 px-6 cursor-not-allowed"
                        value={displayProfile.email}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                      <input 
                        className="pl-14 text-sm text-primary font-medium w-full bg-stone-50 border-2 border-transparent rounded-2xl py-3 px-6 focus:ring-0 focus:border-primary transition-all"
                        placeholder="Role (e.g. Software Engineer)"
                        value={formData.job_role}
                        onChange={(e) => setFormData({...formData, job_role: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                      <input 
                        className="pl-14 text-sm text-primary font-medium w-full bg-stone-50 border-2 border-transparent rounded-2xl py-3 px-6 focus:ring-0 focus:border-primary transition-all"
                        placeholder="Company"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h1 className="text-4xl font-headline font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-4">
                    {displayProfile.name}
                    {displayProfile.isApproved && <CheckCircle className="w-8 h-8 text-primary" />}
                    {displayProfile.role === 'admin' && <ShieldCheck className="w-8 h-8 text-orange-500" />}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4">
                    <p className="text-xl text-primary font-bold font-body">{displayProfile.job_role || 'Member'} @ {displayProfile.company || 'DA-IICT Network'}</p>
                    <span className="w-1.5 h-1.5 bg-stone-300 rounded-full"></span>
                    <div className="flex items-center gap-2 text-stone-500 font-medium">
                      <Mail className="w-4 h-4" />
                      {displayProfile.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {isEditing && (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-4 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-colors shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={editLoading}
                  className="flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-[1.05] transition-all active:scale-[0.98]"
                >
                  {editLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                  <span>Save Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {isEditing ? (
            <div className="md:col-span-12 p-10 bg-surface-container-low rounded-[40px] border border-stone-200 dark:border-stone-700 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <FileCheck className="text-primary w-6 h-6" />
                </div>
                <h2 className="text-2xl font-headline font-extrabold text-stone-900 dark:text-white">Professional Bio</h2>
              </div>
              <textarea 
                className="w-full bg-white border-2 border-stone-100 rounded-3xl p-6 text-lg font-body focus:ring-0 focus:border-primary transition-all min-h-[200px]"
                placeholder="Write a short summary of your career and ethos..."
                value={formData.resume_summary}
                onChange={(e) => setFormData({...formData, resume_summary: e.target.value})}
              />
              <div className="p-8 bg-stone-900 rounded-3xl text-white space-y-4">
                <div className="flex items-center gap-3">
                   <BrainCircuit className="text-primary w-6 h-6" />
                   <h4 className="font-headline font-bold">Fast-Track with AI</h4>
                </div>
                <p className="text-sm text-stone-400">Upload your CV to let AI pre-fill your career details and summary instantly.</p>
                <label className="inline-block cursor-pointer px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:scale-105 transition-all">
                  Upload Resume
                  <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleResumeUpload} disabled={parsing} />
                </label>
              </div>
            </div>
          ) : displayProfile.resume_summary ? (
            <div className="md:col-span-12 bg-primary/[0.03] p-10 rounded-[40px] border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Quote className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <FileCheck className="text-primary w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-headline font-extrabold text-stone-900 dark:text-white">Professional Ethos</h2>
                </div>
                <p className="text-xl text-on-surface-variant leading-relaxed font-body italic max-w-4xl">
                  "{displayProfile.resume_summary}"
                </p>
                <div className="flex items-center gap-3 mt-8">
                   <div className="h-1 w-12 bg-primary/20 rounded-full"></div>
                   <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">
                    Identified by AlumConnect AI
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Resume Upload + AI Insights */}
          <div className="md:col-span-12 space-y-8">
            {/* Resume Upload Card */}
            {isOwnProfile && (
              <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-[40px] p-10 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5">
                  <Upload className="w-64 h-64" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-headline font-extrabold mb-2">AI Resume Analysis</h2>
                      <p className="text-stone-400 text-sm font-medium">Upload your resume and AI will extract your introduction, projects, and skills automatically.</p>
                    </div>
                    <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <BrainCircuit className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-3 cursor-pointer px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-primary/30 active:scale-95">
                    {parsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {parsing ? 'Analyzing...' : 'Upload Resume (PDF/Image)'}
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleResumeUpload} disabled={parsing} />
                  </label>
                  {displayProfile.resume_parsed_at && (
                    <p className="text-[10px] text-stone-500 mt-4 font-bold uppercase tracking-widest flex items-center gap-2">
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      Last analyzed: {new Date(displayProfile.resume_parsed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* AI Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Introduction Card */}
              <div className="bg-white dark:bg-stone-800 p-10 rounded-[40px] border border-stone-200 dark:border-stone-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <User className="w-28 h-28" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <User className="text-blue-600 w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-headline font-extrabold text-stone-900 dark:text-white">Introduction</h2>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <BrainCircuit className="w-3 h-3" /> AI-Generated from Resume
                      </p>
                    </div>
                  </div>
                  {displayProfile.ai_introduction ? (
                    <p className="text-stone-600 leading-relaxed font-body text-[15px]">
                      {displayProfile.ai_introduction}
                    </p>
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed border-stone-100 rounded-3xl">
                      <User className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                      <p className="text-stone-400 text-sm font-medium">No introduction yet</p>
                      <p className="text-stone-300 text-xs mt-1">{isOwnProfile ? 'Upload resume to generate' : ''}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Projects Card */}
              <div className="bg-white dark:bg-stone-800 p-10 rounded-[40px] border border-stone-200 dark:border-stone-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Briefcase className="w-28 h-28" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <Briefcase className="text-emerald-600 w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-headline font-extrabold text-stone-900 dark:text-white">Projects</h2>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <BrainCircuit className="w-3 h-3" /> Extracted from Resume
                      </p>
                    </div>
                  </div>
                  {displayProfile.ai_projects && displayProfile.ai_projects.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {displayProfile.ai_projects.map((project: any, idx: number) => (
                        <div key={idx} className="p-4 bg-stone-50/80 rounded-2xl border border-stone-100 hover:border-primary/20 transition-colors">
                          <h4 className="font-bold text-sm text-stone-900 dark:text-white mb-1 flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-[10px] font-black text-primary">{idx + 1}</span>
                            {project.title}
                          </h4>
                          <p className="text-xs text-stone-500 leading-relaxed pl-8">{project.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed border-stone-100 rounded-3xl">
                      <Briefcase className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                      <p className="text-stone-400 text-sm font-medium">No projects yet</p>
                      <p className="text-stone-300 text-xs mt-1">{isOwnProfile ? 'Upload resume to auto-extract' : ''}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Extended Details Card — only show if user has extra fields */}
          {!isEditing && (
            <div className="md:col-span-12 bg-white dark:bg-stone-800 p-10 rounded-[40px] border border-stone-200 dark:border-stone-700">
              <h2 className="text-2xl font-headline font-extrabold text-stone-900 dark:text-white mb-8">Profile Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Common Fields */}
                {displayProfile.role && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Role</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white capitalize">{displayProfile.role}</p>
                  </div>
                )}
                {displayProfile.course && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Course</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.course}</p>
                  </div>
                )}
                {displayProfile.specialization && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Specialization</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.specialization}</p>
                  </div>
                )}
                {displayProfile.enrollment_year && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Enrollment Year</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.enrollment_year}</p>
                  </div>
                )}
                {(displayProfile.graduation_year || displayProfile.passout_year) && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{displayProfile.role === 'alumni' ? 'Passout Year' : 'Expected Graduation'}</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.graduation_year || displayProfile.passout_year}</p>
                  </div>
                )}

                {/* Student-Specific */}
                {displayProfile.current_year && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Current Year</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.current_year}</p>
                  </div>
                )}
                {displayProfile.cgpa && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">CGPA</p>
                    <p className="text-sm font-bold text-primary">{displayProfile.cgpa} / 10.0</p>
                  </div>
                )}
                {displayProfile.internship_company && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Internship</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">
                      {displayProfile.internship_role ? `${displayProfile.internship_role} @ ` : ''}{displayProfile.internship_company}
                    </p>
                  </div>
                )}

                {/* Alumni-Specific */}
                {displayProfile.company && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Company</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.company}</p>
                  </div>
                )}
                {displayProfile.job_role && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Job Role</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.job_role}</p>
                  </div>
                )}
                {displayProfile.experience_years && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Experience</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.experience_years} years</p>
                  </div>
                )}
                {displayProfile.location && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{displayProfile.location}</p>
                  </div>
                )}
                {displayProfile.linkedin_url && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">LinkedIn</p>
                    <a href={displayProfile.linkedin_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary hover:underline truncate block">
                      View Profile ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit Mode — Extended Fields */}
          {isEditing && (
            <div className="md:col-span-12 bg-white dark:bg-stone-800 p-10 rounded-[40px] border border-stone-200 dark:border-stone-700 space-y-6">
              <h2 className="text-2xl font-headline font-extrabold text-stone-900 dark:text-white">Extended Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Course</label>
                  <select value={formData.course || ''} onChange={e => setFormData({...formData, course: e.target.value})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary">
                    <option value="">Select...</option>
                    <option>B.Tech</option>
                    <option>M.Tech</option>
                    <option>PhD</option>
                    <option>MSc (IT)</option>
                    <option>MCA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Specialization</label>
                  <select value={formData.specialization || ''} onChange={e => setFormData({...formData, specialization: e.target.value})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary">
                    <option value="">Select...</option>
                    <option>ICT</option>
                    <option>CS</option>
                    <option>MnC</option>
                    <option>ECE</option>
                    <option>IT</option>
                    <option>Data Science</option>
                    <option>AI/ML</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Enrollment Year</label>
                  <input type="number" value={formData.enrollment_year || ''} onChange={e => setFormData({...formData, enrollment_year: parseInt(e.target.value)})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary" placeholder="2022" min={1990} max={2030} />
                </div>
                
                {effectiveProfile?.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Current Year</label>
                      <select value={formData.current_year || ''} onChange={e => setFormData({...formData, current_year: e.target.value})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary">
                        <option value="">Select...</option>
                        <option>1st Year</option>
                        <option>2nd Year</option>
                        <option>3rd Year</option>
                        <option>4th Year</option>
                        <option>5th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">CGPA</label>
                      <input type="number" step="0.01" min={0} max={10} value={formData.cgpa || ''} onChange={e => setFormData({...formData, cgpa: parseFloat(e.target.value)})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary" placeholder="8.5" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Internship Company</label>
                      <input type="text" value={formData.internship_company || ''} onChange={e => setFormData({...formData, internship_company: e.target.value})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary" placeholder="e.g. Google" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Internship Role</label>
                      <input type="text" value={formData.internship_role || ''} onChange={e => setFormData({...formData, internship_role: e.target.value})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary" placeholder="e.g. SDE Intern" />
                    </div>
                  </>
                )}

                {effectiveProfile?.role === 'alumni' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Passout Year</label>
                      <input type="number" value={formData.passout_year || formData.graduation_year || ''} onChange={e => setFormData({...formData, passout_year: parseInt(e.target.value), graduation_year: parseInt(e.target.value)})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary" placeholder="2020" min={1990} max={2030} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Experience (Years)</label>
                      <input type="number" value={formData.experience_years || ''} onChange={e => setFormData({...formData, experience_years: parseInt(e.target.value)})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary" placeholder="3" min={0} max={40} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Location</label>
                      <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary" placeholder="e.g. Bengaluru" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">LinkedIn URL</label>
                      <input type="url" value={formData.linkedin_url || ''} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} className="w-full py-3 px-4 bg-stone-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary" placeholder="https://linkedin.com/in/yourname" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="md:col-span-12 lg:col-span-5 bg-stone-950 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-5">
               <BrainCircuit className="w-64 h-64" />
            </div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-headline font-extrabold">Skill Matrix</h2>
                <BrainCircuit className="opacity-30 w-8 h-8" />
              </div>
              
              {isEditing ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2.5">
                    {formData.skills?.map((skill, index) => (
                      <span key={index} className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl text-sm font-bold border border-white/20 hover:bg-white/20 transition-all">
                        {skill}
                        <button 
                          onClick={() => setFormData({
                            ...formData, 
                            skills: formData.skills?.filter((_, i) => i !== index)
                          })}
                          className="text-white/40 hover:text-orange-400 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-stone-600"
                      placeholder="Add an expertise area..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !formData.skills?.includes(val)) {
                            setFormData({...formData, skills: [...(formData.skills || []), val]});
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/10 rounded text-[10px] font-black tracking-widest pointer-events-none">ENTER</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 mb-auto">
                   {displayProfile.skills && displayProfile.skills.length > 0 ? (
                     displayProfile.skills.map(skill => (
                      <span key={skill} className="px-5 py-2.5 bg-white/10 text-white/90 rounded-2xl text-sm font-bold border border-white/10 hover:bg-white/20 transition-colors">
                        {skill}
                      </span>
                    ))
                   ) : (
                     <div className="w-full p-8 border-2 border-dashed border-white/10 rounded-3xl text-center text-white/40">
                        <p className="text-sm font-medium">No expertise tags added yet.</p>
                     </div>
                   )}
                </div>
              )}

              <div className="mt-12 p-8 bg-primary/10 rounded-3xl border border-primary/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3">Institutional Identity</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-headline font-black capitalize text-primary">{displayProfile.role}</p>
                </div>
                <p className="text-sm text-stone-400 mt-2 font-body font-medium">
                  {displayProfile.role === 'alumni' ? 'Legacy Member of DA-IICT.' : 'Representing the Undergraduate Cohort.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal for messaging other users */}
      {!isOwnProfile && id && (
        <ChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          recipientId={id}
          recipientName={displayProfile.name || 'User'}
        />
      )}
    </div>
  );
}
