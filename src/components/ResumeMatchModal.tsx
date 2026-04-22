import React, { useState, useCallback } from 'react';
import { X, Upload, Loader2, CheckCircle2, XCircle, Zap, TrendingUp, Target, AlertCircle, Lightbulb, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from '../services/dataService';
import { toast } from 'react-hot-toast';

interface MatchResult {
  match_score: number;
  verdict: string;
  verdict_summary: string;
  matched_skills: string[];
  missing_skills: string[];
  experience_fit: { score: number; summary: string };
  keyword_match: { found: string[]; missing: string[] };
  strengths: string[];
  improvements: string[];
  ats_tips: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f0ee" strokeWidth="8" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke={color}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] font-bold text-stone-400 uppercase">Score</span>
      </div>
    </div>
  );
}

export default function ResumeMatchModal({ isOpen, onClose, job }: Props) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/ai/match-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64,
          mimeType: file.type || 'application/pdf',
          jobTitle: job.title,
          jobCompany: job.company,
          jobDescription: job.description,
          jobRequirements: job.requirements,
        }),
      });

      // Safely read response text first
      const text = await res.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Server returned empty response. The AI model may have timed out — please try again.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      if (data.match_score === undefined) {
        throw new Error('AI returned incomplete data. Please try again.');
      }

      setResult(data);
      toast.success('Match analysis complete!');
    } catch (err: any) {
      console.error('Resume match error:', err);
      toast.error(err.message || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [job]);

  const verdictColor = (v: string) => {
    if (v?.includes('Strong')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (v?.includes('Moderate')) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500/10 via-violet-500/5 to-transparent p-6 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-headline font-black text-on-surface tracking-tight">Resume Match</h2>
                  <p className="text-xs text-stone-400 font-medium">{job.title} at {job.company}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Upload Area */}
              {!result && !loading && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                    dragOver ? 'border-blue-500 bg-blue-50' : 'border-stone-200 hover:border-blue-300'
                  }`}
                >
                  <input type="file" accept=".pdf" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-on-surface mb-1">Upload your resume</h3>
                  <p className="text-stone-400 text-sm font-medium">PDF format • We'll match it against this job</p>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="py-16 text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <h3 className="font-bold text-on-surface mb-1">Analyzing match...</h3>
                  <p className="text-sm text-stone-400">Comparing your resume with the job description</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-5">
                  {/* Top: Score + Verdict */}
                  <div className="flex items-center gap-6 p-5 bg-stone-50 rounded-2xl">
                    <ScoreRing score={result.match_score} />
                    <div className="flex-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border mb-2 ${verdictColor(result.verdict)}`}>
                        {result.verdict}
                      </span>
                      <p className="text-sm text-stone-600 leading-relaxed">{result.verdict_summary}</p>
                    </div>
                  </div>

                  {/* Skills Match */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.matched_skills?.length > 0 && (
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills ({result.matched_skills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {result.matched_skills.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.missing_skills?.length > 0 && (
                      <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Missing Skills ({result.missing_skills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {result.missing_skills.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 bg-red-100 text-red-600 text-[11px] font-bold rounded-lg">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Experience Fit */}
                  {result.experience_fit && (
                    <div className="p-4 bg-white rounded-2xl border border-stone-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" /> Experience Fit
                        </h4>
                        <span className="text-sm font-black text-blue-600">{result.experience_fit.score}/100</span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.experience_fit.score}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-stone-500">{result.experience_fit.summary}</p>
                    </div>
                  )}

                  {/* Strengths + Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.strengths?.length > 0 && (
                      <div className="p-4 bg-white rounded-2xl border border-stone-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Your Strengths
                        </h4>
                        <div className="space-y-2">
                          {result.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.improvements?.length > 0 && (
                      <div className="p-4 bg-white rounded-2xl border border-stone-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" /> Suggestions
                        </h4>
                        <div className="space-y-2">
                          {result.improvements.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ATS Tips */}
                  {result.ats_tips?.length > 0 && (
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> ATS Optimization Tips
                      </h4>
                      <div className="space-y-2">
                        {result.ats_tips.map((t, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Try Again */}
                  <button
                    onClick={() => setResult(null)}
                    className="w-full py-3 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-all text-sm"
                  >
                    Upload a Different Resume
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
