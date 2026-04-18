import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Paperclip, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { dataService } from '../services/dataService';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  id: string;
}

export default function AIAssistant() {
  const { profile } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Welcome back, ${profile?.name?.split(' ')[0] || 'Member'}! I've analyzed the latest job postings and alumni movements. How can I help your career journey today?`,
      id: '1'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    const userText = text || input;
    if (!userText.trim()) return;

    const userMessage: Message = { role: 'user', content: userText, id: Date.now().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get some context from directory for better AI responses
      const alumni = await dataService.getAlumni();
      const alumniContext = alumni?.map(a => `${a.name} (${a.job_role} at ${a.company})`).join(', ') || "";
      const userContext = profile?.resume_summary ? `\nUser's Profile Summary: ${profile.resume_summary}` : "";
      
      const response = await aiService.getCareerAdvice(userText, alumniContext + userContext);
      const assistantMessage: Message = { role: 'assistant', content: response || "I'm sorry, I couldn't generate a response.", id: (Date.now() + 1).toString() };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("AI Assistant is offline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] relative max-w-3xl mx-auto w-full">
      {/* Intro Section */}
      <div className="text-center space-y-4 pt-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container/10 rounded-2xl mb-2 relative">
          <Bot className="text-primary w-10 h-10 absolute opacity-20" />
          <Bot className="text-primary w-10 h-10" />
        </div>
        <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Career Assistant</h1>
        <p className="text-stone-500 max-w-md mx-auto font-body">Leverage the collective wisdom of the alumni network powered by Gemini AI.</p>
      </div>

      {/* Chat Log */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 px-4 custom-scrollbar pb-32">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse ml-12' : 'mr-12'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'assistant' ? 'bg-surface-container-high' : 'bg-surface-container-lowest'}`}>
                {msg.role === 'assistant' ? <Sparkles className="w-4 h-4 text-stone-600" /> : <User className="w-4 h-4 text-stone-600" />}
              </div>
              
              <div className={`p-5 rounded-2xl shadow-sm space-y-4 border ${msg.role === 'assistant' ? 'bg-surface-container-low rounded-tl-none border-outline-variant/10' : 'bg-surface-container-lowest rounded-tr-none border-outline-variant/20'}`}>
                <p className="text-on-surface text-[0.9375rem] leading-relaxed font-body whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4 mr-12">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
              </div>
              <div className="p-5 rounded-2xl bg-surface-container-low rounded-tl-none border border-outline-variant/10">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Suggested Queries */}
        {!loading && messages.length < 3 && (
          <div className="space-y-3 pt-6">
            <p className="text-xs font-label font-bold text-stone-400 uppercase tracking-widest text-center">Suggested Queries</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[ "How can I improve my resume?", "Find alumni at Amazon", "Networking tips" ].map(q => (
                <button 
                  key={q} 
                  onClick={() => handleSend(q)}
                  className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface via-surface to-transparent">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="max-w-3xl mx-auto relative">
          <div className="bg-white shadow-[0_20px_50px_rgba(138,114,100,0.15)] rounded-2xl border border-outline-variant/30 flex items-center p-2 focus-within:ring-2 ring-primary-container transition-all">
            <button 
              type="button" 
              onClick={() => toast("Resume analysis is automatic during registration! Direct file upload for AI chat is coming soon.", { icon: '📄' })}
              className="p-3 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              className="flex-1 border-none focus:ring-0 bg-transparent py-4 px-2 text-on-surface font-medium placeholder:text-stone-400" 
              placeholder="Type your career query here..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              type="text" 
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary-container disabled:opacity-50 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90"
            >
              <Send className="w-5 h-5 fill-current" />
            </button>
          </div>
          <p className="text-[10px] text-center mt-3 text-stone-400 font-medium">
            AlumConnect AI provides career guidance based on historical and current network data.
          </p>
        </form>
      </div>
    </div>
  );
}
