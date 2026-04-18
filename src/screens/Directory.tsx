import React, { useEffect, useState } from 'react';
import { Bookmark, Bolt, Search, ChevronDown, SlidersHorizontal, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { UserProfile } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function Directory() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAlumni({
        role: roleFilter !== 'All Roles' ? roleFilter : undefined,
        company: companyFilter !== 'Company' ? companyFilter : undefined,
        batch: batchFilter !== 'Batch' ? batchFilter : undefined,
      });
      if (data) setAlumni(data);
    } catch (error) {
      toast.error("Failed to load directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [roleFilter, companyFilter, batchFilter]);

  const handleConnect = async (alumniId: string) => {
    if (!profile) return;
    try {
      await dataService.sendConnectionRequest(profile.id, alumniId);
      toast.success("Connection request sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send request");
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-none">Alumni Directory</h2>
          <p className="text-on-surface-variant font-medium">Connecting graduates across the globe.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl">
            <div className="relative">
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-on-surface-variant focus:ring-0 cursor-pointer px-4 appearance-none pr-8"
              >
                <option value="">All Roles</option>
                <option value="Engineer">Engineer</option>
                <option value="Designer">Designer</option>
                <option value="Product">Product</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
            </div>
            <div className="w-[1px] h-4 bg-outline-variant/30"></div>
            <div className="relative">
              <select 
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-on-surface-variant focus:ring-0 cursor-pointer px-4 appearance-none pr-8"
              >
                <option value="">Company</option>
                <option value="Google">Google</option>
                <option value="Meta">Meta</option>
                <option value="Amazon">Amazon</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
            </div>
            <div className="w-[1px] h-4 bg-outline-variant/30"></div>
            <div className="relative">
              <select 
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-on-surface-variant focus:ring-0 cursor-pointer px-4 appearance-none pr-8"
              >
                <option value="">Batch</option>
                <option value="2024">2024</option>
                <option value="2020">2020</option>
                <option value="2015">2015</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.length > 0 ? alumni.map((alumnus, i) => (
            <motion.div 
              key={alumnus.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(138,114,100,0.08)] group hover:translate-y-[-4px] transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-stone-50 shrink-0 shadow-inner">
                    <img alt={alumnus.name} src={alumnus.profile_image} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">{alumnus.name}</h3>
                    <p className="text-primary font-semibold text-sm">{alumnus.job_role || 'Alumna/us'}</p>
                    <p className="text-on-surface-variant text-xs font-medium">{alumnus.company || 'DA-IICT'} • Batch of {alumnus.graduation_year || 'Unknown'}</p>
                  </div>
                </div>
                <Bookmark 
                  onClick={() => toast.success(`${alumnus.name} added to bookmarks!`)}
                  className="text-stone-400 w-5 h-5 cursor-pointer hover:text-primary transition-colors" 
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {alumnus.skills?.slice(0, 4).map(tag => (
                  <span key={tag} className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="mt-auto space-y-3">
                <button 
                  onClick={() => navigate(`/profile/${alumnus.id}`)}
                  className="w-full py-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] border border-primary/20 rounded-xl hover:bg-primary/5 transition-all"
                >
                  View full legacy
                </button>
                <button 
                  onClick={() => handleConnect(alumnus.id)}
                  className="w-full py-3 bg-stone-900 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-primary transition-all"
                >
                  <Bolt className="w-4 h-4 fill-current" />
                  Request Connection
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full p-20 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
              <p className="text-stone-400 font-medium">No alumni matching your criteria were found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
