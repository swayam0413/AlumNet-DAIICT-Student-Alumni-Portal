import React, { useState } from 'react';
import { Mail, Lock, School, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService, UserRole } from '../services/authService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Student-specific fields
  const [course, setCourse] = useState('B.Tech');
  const [specialization, setSpecialization] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState<number>(new Date().getFullYear());
  const [currentYear, setCurrentYear] = useState('1st Year');
  const [cgpa, setCgpa] = useState('');
  const [internshipCompany, setInternshipCompany] = useState('');

  // Alumni-specific fields
  const [company, setCompany] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [gradYear, setGradYear] = useState<number>(2024);
  const [experienceYears, setExperienceYears] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const navigate = useNavigate();

  // Build the extra profile data based on role
  const buildExtraData = () => {
    const data: any = {
      name,
      course,
      specialization,
      enrollment_year: enrollmentYear,
      department: specialization || 'ICT',
    };

    if (role === 'student') {
      data.current_year = currentYear;
      if (cgpa) data.cgpa = parseFloat(cgpa);
      if (internshipCompany) data.internship_company = internshipCompany;
    } else {
      // Alumni
      if (company) data.company = company;
      if (jobRole) data.job_role = jobRole;
      if (gradYear) data.graduation_year = gradYear;
      if (gradYear) data.passout_year = gradYear;
      if (experienceYears) data.experience_years = parseInt(experienceYears);
      if (location) data.location = location;
      if (linkedinUrl) data.linkedin_url = linkedinUrl;
    }

    // Remove undefined/empty values
    Object.keys(data).forEach(k => {
      if (data[k] === undefined || data[k] === '' || data[k] === null) delete data[k];
    });

    return data;
  };

  // Attempt to delete a stale auth-only user (no Firestore profile) via REST API
  const deleteStaleAuthUser = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/delete-stale-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) return true;
      // If the server returned an error, show it
      if (data.error) setError(data.error);
      return false;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // ---- SIGN IN ----
        const user = await authService.login(email, password);
        
        // Check if Firestore profile exists; if not, create one
        const profile = await authService.getProfile(user.uid);
        if (!profile) {
          // User exists in Auth but not Firestore — create a basic profile
          await authService.updateProfile(user.uid, {
            name: user.displayName || email.split('@')[0],
            email,
            role: 'student',
            isApproved: true,
            profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            skills: [],
          });
        }
        navigate('/');
      } else {
        // ---- CREATE ACCOUNT ----
        try {
          const extraData = buildExtraData();
          await authService.signup(email, password, name, role, extraData);
          toast.success('Account created successfully!');
          navigate('/');
        } catch (signupErr: any) {
          if (signupErr?.code === 'auth/email-already-in-use') {
            // Email exists in Firebase Auth — try to handle gracefully
            
            // Step 1: Try logging in with the provided password
            try {
              const user = await authService.login(email, password);
              // Login succeeded — create/update the Firestore profile
              const extraData = buildExtraData();
              await authService.updateProfile(user.uid, {
                ...extraData,
                role,
                email,
                isApproved: true,
                profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              });
              toast.success('Welcome back! Profile updated.');
              navigate('/');
              return;
            } catch {
              // Login failed — password is different from original
            }

            // Step 2: Try deleting the stale auth user via server
            const deleted = await deleteStaleAuthUser();
            if (deleted) {
              // Retry signup after stale user deletion
              try {
                const extraData = buildExtraData();
                await authService.signup(email, password, name, role, extraData);
                toast.success('Account created successfully!');
                navigate('/');
                return;
              } catch (retryErr: any) {
                setError(retryErr?.message || 'Failed to create account after cleanup.');
              }
            }
            // If we get here, deletion failed — error was already set by deleteStaleAuthUser
            if (!error) {
              setError('This email is already registered. Try signing in or use "Forgot Password".');
            }
          } else {
            throw signupErr; // Re-throw non-email-in-use errors
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Incorrect email or password.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found. Please create one.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err?.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address to reset password.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setResetSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email.');
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
            alt="DA-IICT Campus" 
            className="w-full h-full object-cover" 
            src="/images/login_bg.png" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-stone-900 via-stone-900/80 to-primary/40"></div>
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

              {/* --- SIGNUP FIELDS --- */}
              {!isLogin && (
                <>
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1 font-label">Full Name</label>
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

                  {/* Role Selection */}
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

                  {/* Role-specific fields */}
                  {role === 'student' ? (
                    <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Student Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Course</label>
                          <select value={course} onChange={e => setCourse(e.target.value)} className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium">
                            <option>B.Tech</option>
                            <option>M.Tech</option>
                            <option>PhD</option>
                            <option>MSc (IT)</option>
                            <option>MCA</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Specialization</label>
                          <select value={specialization} onChange={e => setSpecialization(e.target.value)} className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium">
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
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Enrollment Year</label>
                          <input type="number" value={enrollmentYear} onChange={e => setEnrollmentYear(parseInt(e.target.value))} className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" min={2000} max={2030} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Current Year</label>
                          <select value={currentYear} onChange={e => setCurrentYear(e.target.value)} className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium">
                            <option>1st Year</option>
                            <option>2nd Year</option>
                            <option>3rd Year</option>
                            <option>4th Year</option>
                            <option>5th Year</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">CGPA</label>
                          <input type="number" step="0.01" max={10} min={0} value={cgpa} onChange={e => setCgpa(e.target.value)} placeholder="8.5" className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Internship At</label>
                          <input type="text" value={internshipCompany} onChange={e => setInternshipCompany(e.target.value)} placeholder="e.g. Google" className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Alumni Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Company</label>
                          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Role</label>
                          <input type="text" value={jobRole} onChange={e => setJobRole(e.target.value)} placeholder="e.g. SDE" className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Course</label>
                          <select value={course} onChange={e => setCourse(e.target.value)} className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium">
                            <option>B.Tech</option>
                            <option>M.Tech</option>
                            <option>PhD</option>
                            <option>MSc (IT)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Specialization</label>
                          <select value={specialization} onChange={e => setSpecialization(e.target.value)} className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium">
                            <option value="">Select...</option>
                            <option>ICT</option>
                            <option>CS</option>
                            <option>MnC</option>
                            <option>ECE</option>
                            <option>IT</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Enrollment Year</label>
                          <input type="number" value={enrollmentYear} onChange={e => setEnrollmentYear(parseInt(e.target.value))} className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" min={1990} max={2030} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Passout Year</label>
                          <input type="number" value={gradYear} onChange={e => setGradYear(parseInt(e.target.value))} className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" min={1990} max={2030} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Experience (Years)</label>
                          <input type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="3" className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" min={0} max={40} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">Location</label>
                          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bengaluru" className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 ml-1">LinkedIn URL</label>
                        <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" className="w-full py-2.5 px-3 bg-white rounded-xl border-none text-sm focus:ring-2 focus:ring-primary font-medium" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email */}
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

              {/* Password */}
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

              {/* Submit */}
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
                onClick={() => { setIsLogin(!isLogin); setError(null); setResetSent(false); }}
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
