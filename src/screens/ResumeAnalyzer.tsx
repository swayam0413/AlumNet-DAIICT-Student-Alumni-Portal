import React, { useState, useCallback } from 'react';
import { FileText, Upload, Loader2, Sparkles, Target, TrendingUp, Award, BookOpen, ChevronRight, Brain, Zap, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface ProjectInfo {
  title: string;
  description: string;
  technologies?: string[];
  impact?: string;
}

interface Scores {
  overall_score: number;
  skill_depth: number;
  experience_relevance: number;
  project_quality: number;
  presentation: number;
  feedback: string;
}

interface AnalysisResult {
  name: string;
  email?: string;
  job_role: string;
  company: string;
  skills: string[];
  graduation_year: number;
  department: string;
  education?: string[];
  experience_years?: number;
  certifications?: string[];
  summary: string;
  ai_introduction: string;
  strengths?: string[];
  improvement_areas?: string[];
  ai_projects: ProjectInfo[];
  scores?: Scores;
  pipeline?: string;
}

const STEPS = [
  { label: 'Extracting data', icon: FileText, color: 'text-blue-500' },
  { label: 'Analyzing profile', icon: Brain, color: 'text-violet-500' },
  { label: 'Scoring resume', icon: Award, color: 'text-amber-500' },
];

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-bold text-stone-600">{label}</span>
        <span className={`text-xs font-black ${color}`}>{value}/100</span>
      </div>
      <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            value >= 80 ? 'bg-emerald-500' :
            value >= 60 ? 'bg-blue-500' :
            value >= 40 ? 'bg-amber-500' : 'bg-red-400'
          }`}
        />
      </div>
    </div>
  );
}

export default function ResumeAnalyzer() {
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const processResume = async (file: File) => {
    setLoading(true);
    setCurrentStep(0);
    setAnalysis(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Animate steps
      const stepTimer1 = setTimeout(() => setCurrentStep(1), 3000);
      const stepTimer2 = setTimeout(() => setCurrentStep(2), 7000);

      const res = await fetch('/api/ml/resume/parse-langchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, mimeType: file.type }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || 'Analysis failed');
      }

      const data = await res.json();
      setCurrentStep(3);
      setAnalysis(data);
      toast.success('Resume analysis complete!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processResume(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type.includes('document'))) {
      processResume(file);
    } else {
      toast.error('Please upload a PDF file');
    }
  }, []);

  const overallScore = analysis?.scores?.overall_score || 0;
  const scoreColor = overallScore >= 80 ? 'text-emerald-500' : overallScore >= 60 ? 'text-blue-500' : overallScore >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-headline font-black text-on-surface tracking-tight">AI Resume Analyzer</h1>
          <p className="text-sm text-stone-400 font-medium">3-step pipeline • Powered by Gemma 3 27B</p>
        </div>
      </div>

      {/* Upload Area */}
      {!analysis && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer ${
            dragOver ? 'border-violet-500 bg-violet-50 scale-[1.01]' : 'border-stone-200 bg-white hover:border-violet-300 hover:bg-violet-50/30'
          }`}
        >
          <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-violet-500" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Drop your resume here</h3>
          <p className="text-stone-400 font-medium mb-6">or click to browse • PDF format</p>
          <div className="flex items-center justify-center gap-6 text-[11px] text-stone-400 font-bold">
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Extract Data</span>
            <ChevronRight className="w-3 h-3" />
            <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> AI Analysis</span>
            <ChevronRight className="w-3 h-3" />
            <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Score & Feedback</span>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-12 shadow-lg border border-stone-100">
          <div className="text-center mb-10">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-on-surface">Analyzing your resume...</h3>
            <p className="text-sm text-stone-400 mt-1">This may take 15-30 seconds</p>
          </div>
          <div className="max-w-sm mx-auto space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                i < currentStep ? 'bg-emerald-50 text-emerald-700' :
                i === currentStep ? 'bg-violet-50 text-violet-700 animate-pulse' : 'text-stone-300'
              }`}>
                {i < currentStep ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                 i === currentStep ? <Loader2 className="w-5 h-5 animate-spin" /> :
                 <step.icon className="w-5 h-5" />}
                <span className="font-bold text-sm">{step.label}</span>
                {i < currentStep && <span className="ml-auto text-[10px] font-black text-emerald-500">DONE</span>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Results */}
      {analysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile Card + Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                  {(analysis.name || '?')[0]}
                </div>
                <div>
                  <h2 className="text-xl font-black text-on-surface">{analysis.name}</h2>
                  <p className="text-sm text-stone-500 font-medium">{analysis.job_role} {analysis.company ? `at ${analysis.company}` : ''}</p>
                  <p className="text-xs text-stone-400 mt-1">{analysis.department} • Class of {analysis.graduation_year}</p>
                </div>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed italic border-l-4 border-violet-300 pl-4 bg-violet-50/50 p-3 rounded-r-xl">
                "{analysis.ai_introduction}"
              </p>
            </div>

            {/* Overall Score Circle */}
            {analysis.scores && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col items-center justify-center">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Overall Score</p>
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f0ee" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                      stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#3b82f6' : overallScore >= 40 ? '#f59e0b' : '#ef4444'}
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - overallScore / 100) }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-black ${scoreColor}`}>{overallScore}</span>
                  </div>
                </div>
                <p className="text-xs text-stone-400 font-medium mt-2 text-center">{analysis.scores.feedback?.slice(0, 60)}...</p>
              </div>
            )}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Strengths
                </h3>
                <div className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.improvement_areas && analysis.improvement_areas.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
                <h3 className="text-sm font-black text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Areas to Improve
                </h3>
                <div className="space-y-2">
                  {analysis.improvement_areas.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-stone-600">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <h3 className="text-sm font-black text-violet-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Skills Detected ({analysis.skills?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {(analysis.skills || []).map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-bold rounded-lg border border-violet-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          {analysis.scores && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Award className="w-4 h-4" /> Score Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <ScoreBar label="Skill Depth" value={analysis.scores.skill_depth} color="text-blue-600" />
                <ScoreBar label="Experience Relevance" value={analysis.scores.experience_relevance} color="text-violet-600" />
                <ScoreBar label="Project Quality" value={analysis.scores.project_quality} color="text-emerald-600" />
                <ScoreBar label="Presentation" value={analysis.scores.presentation} color="text-amber-600" />
              </div>
              {analysis.scores.feedback && (
                <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
                  <p className="text-sm text-blue-700 font-medium">💡 {analysis.scores.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          {analysis.ai_projects && analysis.ai_projects.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
              <h3 className="text-sm font-black text-fuchsia-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Projects ({analysis.ai_projects.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.ai_projects.map((project, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <h4 className="font-bold text-sm text-on-surface mb-1">{project.title}</h4>
                    <p className="text-xs text-stone-500 mb-2">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((t, j) => (
                          <span key={j} className="px-2 py-0.5 bg-fuchsia-50 text-fuchsia-600 text-[10px] font-bold rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Another */}
          <div className="text-center pt-4">
            <button
              onClick={() => { setAnalysis(null); setCurrentStep(0); }}
              className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 active:scale-95"
            >
              Analyze Another Resume
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
