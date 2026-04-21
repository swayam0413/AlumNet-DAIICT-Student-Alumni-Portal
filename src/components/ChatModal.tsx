import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { toast } from 'react-hot-toast';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

export default function ChatModal({ isOpen, onClose, recipientId, recipientName }: ChatModalProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user || !profile) return;

    const initChat = async () => {
      setLoading(true);
      try {
        const convId = await dataService.getOrCreateConversation(
          user.uid,
          recipientId,
          profile.name,
          recipientName
        );
        setConversationId(convId);

        const msgs = await dataService.getMessages(convId);
        setMessages(msgs);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [isOpen, user, profile, recipientId, recipientName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !user) return;

    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: user.uid,
      text,
      createdAt: new Date().toISOString(),
    }]);

    try {
      await dataService.sendMessage(conversationId, user.uid, text);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
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
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '70vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-sm">{recipientName}</h3>
                  <p className="text-[10px] text-stone-400 font-medium">Direct Message</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-12 h-12 text-stone-200 mb-3" />
                  <p className="text-stone-400 text-sm font-medium">No messages yet</p>
                  <p className="text-stone-300 text-xs">Start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-stone-100 text-stone-700 rounded-bl-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[9px] mt-1 ${isMe ? 'text-white/50' : 'text-stone-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-stone-100">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-stone-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 font-medium"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
