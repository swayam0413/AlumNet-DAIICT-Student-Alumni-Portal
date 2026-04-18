import React, { useState } from 'react';
import { Mail, Lock, School, User, ArrowRight, Loader2, AlertCircle, FileText, Upload, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService, UserRole } from '../services/authService';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  
  // Extra fields for AI auto-fill
  const [jobRole, setJobRole] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [gradYear, setGradYear] = useState<number>(2024);
  const [dept, setDept] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');

  const navigate = useNavigate();

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    toast.loading("Parsing resume with AI...", { id: 'resume-parse' });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await aiService.parseResume(base64, file.type);
        
        if (data) {
          if (data.name) setName(data.name);
          if (data.job_role) setJobRole(data.job_role);
          if (data.company) setCompany(data.company);
          if (data.skills) setSkills(data.skills);
          if (data.graduation_year) setGradYear(data.graduation_year);
          if (data.department) setDept(data.department);
          if (data.summary) setResumeSummary(data.summary);
          
          toast.success("Resume parsed! Profile fields updated.", { id: 'resume-parse' });
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to parse resume.", { id: 'resume-parse' });
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation for password length
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await authService.login(email, password);
      } else {
        const user = await authService.signup(email, password, name, role);
        if (user) {
          // Update profile with extra info if available
          await authService.updateProfile(user.uid, {
            job_role: jobRole,
            company,
            skills,
            graduation_year: gradYear,
            department: dept,
            resume_summary: resumeSummary,
            resume_parsed_at: new Date().toISOString(),
          });
        }
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      const errorCode = err?.code;
      if (errorCode === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again or reset your password.');
      } else if (errorCode === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (errorCode === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else {
        setError(err?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setResetSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden bg-surface">
      {/* Branding Side */}
      <aside className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="DA-IICT Academic Block" 
            className="w-full h-full object-cover opacity-60 mix-blend-multiply" 
            src="https://picsum.photos/seed/college/1200/1200" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-transparent opacity-80"></div>
        </div>
        <div className="relative z-10 px-16 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <School className="text-primary w-8 h-8" />
            </div>
            <span className="text-3xl font-extrabold tracking-tighter text-on-primary font-headline">AlumConnect</span>
          </div>
          <h1 className="text-5xl font-extrabold text-on-primary leading-tight tracking-tight mb-6 font-headline">
            {isLogin ? 'Welcome Back!' : 'Join the Legacy.'}
          </h1>
          <p className="text-xl text-on-primary/90 leading-relaxed font-medium font-body">
            The Digital Curator for DA-IICT's global community. Reconnect with your cohort, share opportunities, and build your legacy.
          </p>
        </div>
        <div className="absolute bottom-8 left-16">
          <p className="text-on-primary/50 text-xs font-semibold uppercase tracking-[0.2em] font-label">© 2024 DA-IICT Alumni Association</p>
        </div>
      </aside>

      {/* Form Side */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-surface overflow-y-auto">
        <div className="w-full max-w-md">
          <header className="mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-on-surface-variant font-medium font-body">
              {isLogin ? 'Access your professional institutional network.' : 'Start your journey with AlumConnect today.'}
            </p>
          </header>

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5" 
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3 border border-error/20">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {!isLogin && (
                <>
                  <div className="p-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 transition-all hover:bg-primary/10">
                    <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        {parsing ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-primary mb-1">Upload Resume</span>
                      <span className="text-[10px] text-on-surface-variant font-medium">AI will auto-fill your profile (PDF/Image)</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,image/*" 
                        onChange={handleResumeUpload}
                        disabled={parsing}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1 font-label flex items-center justify-between">
                      Full Name
                      {name && <span className="text-[10px] text-success flex items-center gap-1 normal-case"><CheckCircle2 className="w-3 h-3" /> Auto-filled</span>}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-5 h-5" />
                      <input 
                        className="w-full pl-12 pr-4 py-3.5 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary text-on-surface" 
                        placeholder="John Doe" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {jobRole && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1 font-label flex items-center justify-between">
                        Detected Job Role
                        <span className="text-[10px] text-success flex items-center gap-1 normal-case"><CheckCircle2 className="w-3 h-3" /> Auto-filled</span>
                      </label>
                      <input 
                        className="w-full px-4 py-3 bg-success/5 border border-success/20 rounded-xl text-on-surface font-medium" 
                        value={jobRole}
                        readOnly
                      />
                    </motion.div>
                  )}

                  {company && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1 font-label flex items-center justify-between">
                        Current Company
                        <span className="text-[10px] text-success flex items-center gap-1 normal-case"><CheckCircle2 className="w-3 h-3" /> Auto-filled</span>
                      </label>
                      <input 
                        className="w-full px-4 py-3 bg-success/5 border border-success/20 rounded-xl text-on-surface font-medium" 
                        value={company}
                        readOnly
                      />
                    </motion.div>
                  )}

                  {skills.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                       <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1 font-label">Identified Skills</label>
                       <div className="flex flex-wrap gap-1.5">
                         {skills.map((skill, i) => (
                           <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-wider">
                             {skill}
                           </span>
                         ))}
                       </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1 font-label">Designation</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setRole('student')}
                        className={`py-3 rounded-xl font-bold transition-all ${role === 'student' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
                      >
                        Student
                      </button>
                      <button 
                        type="button"
                        onClick={() => setRole('alumni')}
                        className={`py-3 rounded-xl font-bold transition-all ${role === 'alumni' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
                      >
                        Alumna/us
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1 font-label">Institutional Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-5 h-5" />
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary text-on-surface" 
                    type="email" 
                    placeholder="name@daiict.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Security Key (Password)</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tight"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-5 h-5" />
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary text-on-surface" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {resetSent && (
                <div className="p-4 bg-success/10 text-success rounded-xl text-sm font-medium border border-success/20">
                  Password reset link sent to your email.
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:bg-primary-container transition-all shadow-xl shadow-primary/10 active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Enter AlumConnect' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <footer className="mt-12 text-center">
            <p className="text-on-surface-variant font-medium font-body">
              {isLogin ? "New to the community? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-bold hover:underline ml-1 font-headline"
              >
                {isLogin ? 'Request Membership' : 'Sign In instead'}
              </button>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
