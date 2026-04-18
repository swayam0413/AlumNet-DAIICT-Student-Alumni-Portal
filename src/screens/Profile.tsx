import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, CheckCircle, GraduationCap, Briefcase, GraduationCap as SchoolIcon, BrainCircuit, Loader2, Save, X, Edit2, Upload, FileCheck, User, Quote, Mail, ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService, UserProfile } from '../services/authService';
import { aiService } from '../services/aiService';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
  const { profile: loggedInProfile, user: authUser } = useAuth();
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [loadingView, setLoadingView] = useState(!!id);
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    job_role: '',
    company: '',
    department: '',
    graduation_year: 2024,
    skills: [],
    profile_image: '',
    resume_summary: '',
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
      <div className="max-w-xl mx-auto mt-20 p-12 bg-surface-container-lowest rounded-[40px] shadow-2xl shadow-primary/5 border border-outline-variant/10 text-center space-y-8">
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
          <BrainCircuit className="text-primary w-12 h-12" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Welcome to AlumConnect</h1>
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
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const base64 = (reader.result as string).split(',')[1];
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
                    }
                  };
                  reader.readAsDataURL(file);
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
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await aiService.parseResume(base64, file.type);
        
        if (data) {
          setFormData(prev => ({
            ...prev,
            name: data.name || prev.name,
            job_role: data.job_role || prev.job_role,
            company: data.company || prev.company,
            skills: data.skills || prev.skills,
            graduation_year: data.graduation_year || prev.graduation_year,
            department: data.department || prev.department,
          }));
          toast.success("Profile fields updated from resume!", { id: 'resume-parse' });
        }
      };
      reader.readAsDataURL(file);
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
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur rounded-2xl shadow-xl hover:bg-white transition-all flex items-center gap-2 font-bold text-sm text-on-surface"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </section>

      <div className="-mt-24 relative z-10 pb-20 space-y-12 px-4 md:px-0">
        {/* Profile Identity Card */}
        <div className="bg-surface-container-lowest rounded-[40px] p-8 shadow-[0_32px_80px_rgba(138,114,100,0.12)] border border-outline-variant/10">
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
                      className="text-2xl font-headline font-extrabold tracking-tight text-on-surface w-full bg-stone-50 border-2 border-transparent rounded-2xl py-3 px-6 focus:ring-0 focus:border-primary transition-all"
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
                  <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface flex items-center gap-4">
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
            <div className="md:col-span-12 p-10 bg-surface-container-low rounded-[40px] border border-outline-variant/10 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <FileCheck className="text-primary w-6 h-6" />
                </div>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface">Professional Bio</h2>
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
                  <h2 className="text-2xl font-headline font-extrabold text-on-surface">Professional Ethos</h2>
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

          <div className="md:col-span-12 lg:col-span-7 bg-surface-container-lowest p-10 rounded-[40px] shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-headline font-extrabold text-on-surface">Alma Mater Journey</h2>
              <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center">
                <SchoolIcon className="text-on-surface-variant/40 w-6 h-6" />
              </div>
            </div>
            {isEditing ? (
              <div className="space-y-6">
                <div className="relative">
                  <GraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
                  <input 
                    className="pl-14 w-full bg-stone-50 border-2 border-transparent rounded-2xl py-4 px-6 font-bold text-on-surface"
                    placeholder="Department (e.g. ICT, MnC)"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div className="relative">
                   <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
                   <input 
                    type="number"
                    className="pl-14 w-full bg-stone-50 border-2 border-transparent rounded-2xl py-4 px-6 font-bold text-on-surface"
                    placeholder="Graduation Year"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData({...formData, graduation_year: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="flex gap-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center shrink-0 shadow-inner">
                    <GraduationCap className="text-primary w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-headline font-black text-2xl text-on-surface">DA-IICT</h4>
                    <p className="text-xl text-primary font-bold font-body">{displayProfile.department || 'Information & Communication Technology'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-lg text-sm font-black tracking-widest uppercase">Class of {displayProfile.graduation_year}</span>
                      <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                      <span className="text-stone-400 text-sm font-medium italic">Gandhinagar, India</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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
    </div>
  );
}
