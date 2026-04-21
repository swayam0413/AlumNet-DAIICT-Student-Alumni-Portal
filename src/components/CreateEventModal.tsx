import React, { useState } from 'react';
import { X, Calendar, MapPin, Video, Clock, AlignLeft, User, Mail, Tag, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    type: 'Webinar',
    targetAudience: 'All',
    organizerName: '',
    organizerEmail: '',
    isVirtual: false
  });

  // Sync profile data when it's available, fallback to basic user info
  React.useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        organizerName: profile.name || prev.organizerName,
        organizerEmail: profile.email || prev.organizerEmail
      }));
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        organizerName: user.displayName || prev.organizerName || 'Member',
        organizerEmail: user.email || prev.organizerEmail || ''
      }));
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to request an event");
      return;
    }

    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }

    setLoading(true);
    try {
      const eventDate = new Date(formData.date);
      const month = eventDate.toLocaleString('default', { month: 'short' });
      const day = eventDate.getDate().toString();

      await dataService.createEvent({
        ...formData,
        organizerId: user.uid,
        organizerRole: profile?.role || 'student',
        month,
        day
      });
      toast.success("Event request sent to admin for approval!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Event submission error:", error);
      toast.error("Failed to submit event request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-headline font-black text-stone-900 tracking-tight">Host an Event</h2>
                  <p className="text-stone-500 font-medium font-body">Detail your event for community and admin review.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Event Title</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. Alumni Networking Dinner"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-stone-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                          required
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                          required
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Event Format</label>
                    <div className="flex gap-4 p-1 bg-stone-50 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isVirtual: false })}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${!formData.isVirtual ? 'bg-white shadow-sm text-primary' : 'text-stone-400'}`}
                      >
                        <MapPin className="w-4 h-4" /> Physical
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isVirtual: true })}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.isVirtual ? 'bg-white shadow-sm text-primary' : 'text-stone-400'}`}
                      >
                        <Video className="w-4 h-4" /> Virtual
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">
                      {formData.isVirtual ? 'Meeting Link' : 'Venue Address'}
                    </label>
                    <div className="relative">
                      {formData.isVirtual ? (
                        <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      ) : (
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      )}
                      <input
                        required
                        type="text"
                        placeholder={formData.isVirtual ? "Zoom/Meet Link" : "e.g. CEP Auditorium, DA-IICT"}
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-stone-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Event Type</label>
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface font-bold appearance-none"
                        >
                          <option>Webinar</option>
                          <option>Meetup</option>
                          <option>Workshop</option>
                          <option>Tech Talk</option>
                          <option>Social</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Target Audience</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <select
                          value={formData.targetAudience}
                          onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface font-bold appearance-none"
                        >
                          <option>All</option>
                          <option>Students Only</option>
                          <option>Alumni Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Event Description</label>
                    <div className="relative">
                      <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-stone-400" />
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us more about the event, agenda, and expectations..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-stone-300 resize-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Organizer Information</p>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 flex items-center gap-2 text-sm font-bold text-stone-600">
                        <User className="w-4 h-4" /> {formData.organizerName}
                      </div>
                      <div className="flex-1 flex items-center gap-2 text-sm font-bold text-stone-600">
                        <Mail className="w-4 h-4" /> {formData.organizerEmail}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black shadow-xl shadow-stone-900/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                  >
                    {loading ? 'Submitting...' : 'Submit Event Request'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
