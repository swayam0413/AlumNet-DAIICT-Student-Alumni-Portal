import React, { useState, useEffect } from 'react';
import { Radar, Loader2, ChevronRight, RefreshCw, Info, Zap, TrendingUp, Users, Briefcase, Star, Target, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { aiService } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface RadarInsight {
  id: string;
  icon: string;
  title: string;
  message: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel: string;
  relatedCompany?: string;
  relatedIndustry?: string;
}

export default function NetworkingRadar() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<RadarInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const fetchRadarInsights = async (isRefresh = false) => {
    if (!profile) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const fallbackInsights: RadarInsight[] = [
      {
        id: 'welcome-1',
        icon: '🎯',
        title: 'Complete Your Profile',
        message: 'Adding your skills and career interests helps our AI match you with the right alumni and opportunities.',
        type: 'SYSTEM',
        priority: 'high',
        actionLabel: 'Update Profile',
      },
      {
        id: 'explore-1',
        icon: '🔍',
        title: 'Explore Job Board',
        message: 'Check out the latest job postings shared by DA-IICT alumni across leading companies.',
        type: 'NEW_JOB_POST',
        priority: 'medium',
        actionLabel: 'View Jobs',
      },
      {
        id: 'connect-1',
        icon: '🤝',
        title: 'Grow Your Network',
        message: 'Connect with alumni from your department to build meaningful professional relationships.',
        type: 'CONNECTION_OPPORTUNITY',
        priority: 'medium',
        actionLabel: 'Browse Alumni',
      },
    ];

    try {
      // Build activity from actual data
      const activities = await dataService.buildRadarActivitySummary();

      if (activities.length === 0) {
        setInsights(fallbackInsights);
        return;
      }

      // Call AI to generate personalized insights
      try {
        const aiInsights = await aiService.getNetworkingRadarInsights(activities, {
          name: profile.name,
          department: profile.department,
          skills: profile.skills,
          graduation_year: profile.graduation_year,
          job_role: profile.job_role,
          company: profile.company,
        });

        if (aiInsights && aiInsights.length > 0) {
          setInsights(aiInsights);
        } else {
          setInsights(fallbackInsights);
        }
      } catch (aiError) {
        console.warn('AI Radar unavailable, using fallback insights:', aiError);
        setInsights(fallbackInsights);
      }
    } catch (error) {
      console.error('Radar error:', error);
      setInsights(fallbackInsights);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRadarInsights();
  }, [profile]);

  const handleAction = (insight: RadarInsight) => {
    const label = insight.actionLabel?.toLowerCase() || '';
    if (label.includes('profile')) navigate('/profile');
    else if (label.includes('job') || label.includes('explore')) navigate('/jobs');
    else if (label.includes('alumni') || label.includes('connect') || label.includes('browse')) navigate('/');
    else navigate('/');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200 text-red-700';
      case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'low': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default: return 'bg-stone-50 border-stone-200 text-stone-600';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-stone-400';
    }
  };

  const displayedInsights = expanded ? insights : insights.slice(0, 3);

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-[0_16px_64px_rgba(138,114,100,0.1)] border border-outline-variant/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Radar className="w-6 h-6 text-white" />
              </div>
              {insights.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-[10px] font-black text-white">{insights.length}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-headline font-black text-on-surface tracking-tight flex items-center gap-2">
                AI Networking Radar
                <Zap className="w-4 h-4 text-violet-500" />
              </h3>
              <p className="text-[11px] text-stone-400 font-medium">
                Smart insights powered by alumni activity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExplainer(!showExplainer)}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              title="Why am I seeing this?"
            >
              <Info className="w-4 h-4 text-stone-400" />
            </button>
            <button
              onClick={() => fetchRadarInsights(true)}
              disabled={refreshing}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              title="Refresh insights"
            >
              <RefreshCw className={`w-4 h-4 text-stone-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Explainer */}
        <AnimatePresence>
          {showExplainer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 bg-violet-50 rounded-2xl text-xs text-violet-700 flex items-start gap-3">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Why am I seeing this?</p>
                  <p>Our AI continuously monitors alumni job changes, promotions, new job postings, and skill trends. It matches these activities with your profile (department, skills, interests) to surface relevant networking opportunities — so you never miss a connection.</p>
                </div>
                <button onClick={() => setShowExplainer(false)} className="flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Insights List */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-violet-100 rounded-2xl flex items-center justify-center animate-pulse">
                <Radar className="w-6 h-6 text-violet-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-600">Scanning network activity...</p>
                <p className="text-[11px] text-stone-400">AI is analyzing alumni movements</p>
              </div>
            </div>
          </div>
        ) : insights.length === 0 ? (
          <div className="py-12 text-center">
            <Radar className="w-12 h-12 text-stone-200 mx-auto mb-3" />
            <p className="text-stone-400 font-medium text-sm">No radar signals detected yet</p>
            <p className="text-stone-300 text-xs mt-1">We'll notify you when we spot opportunities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedInsights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group relative bg-white rounded-2xl border border-stone-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Priority indicator */}
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getPriorityDot(insight.priority)}`} />
                    
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0 leading-none mt-0.5">
                      {insight.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-on-surface leading-tight mb-1 group-hover:text-violet-700 transition-colors">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                        {insight.message}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {insight.relatedCompany && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-50 rounded text-[10px] font-bold text-stone-500">
                            <Briefcase className="w-3 h-3" /> {insight.relatedCompany}
                          </span>
                        )}
                        {insight.relatedIndustry && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 rounded text-[10px] font-bold text-violet-500">
                            <TrendingUp className="w-3 h-3" /> {insight.relatedIndustry}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(insight.priority)}`}>
                          {insight.priority}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleAction(insight)}
                      className="flex-shrink-0 px-3 py-1.5 text-[10px] font-black text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-all uppercase tracking-wide"
                    >
                      {insight.actionLabel || 'View'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Show More / Less */}
            {insights.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full py-3 text-center text-xs font-bold text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-xl transition-all flex items-center justify-center gap-1"
              >
                {expanded ? 'Show Less' : `View All ${insights.length} Insights`}
                <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-t border-violet-100/50">
        <p className="text-[10px] text-violet-500 font-semibold text-center flex items-center justify-center gap-1.5">
          <Zap className="w-3 h-3" />
          Updated continuously from alumni activity • Tailored to your profile
        </p>
      </div>
    </div>
  );
}
