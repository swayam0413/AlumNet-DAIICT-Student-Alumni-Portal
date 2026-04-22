import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, Loader2, Trash2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { dataService } from '../services/dataService';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  id: string;
  timestamp: Date;
}

/** Render markdown-like AI text into styled React elements */
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 space-y-1.5 my-2">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2">
            {listItems}
          </ul>
        );
      }
      listItems = [];
      listType = null;
    }
  };

  const formatInline = (line: string): React.ReactNode => {
    // Bold + Italic, Bold, Italic, Code, Links
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={match.index} className="font-black italic">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<strong key={match.index} className="font-bold text-on-surface">{match[3]}</strong>);
      } else if (match[4]) {
        parts.push(<em key={match.index} className="italic">{match[4]}</em>);
      } else if (match[5]) {
        parts.push(<code key={match.index} className="px-1.5 py-0.5 bg-stone-100 text-primary text-xs rounded font-mono">{match[5]}</code>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    return parts.length > 0 ? parts : line;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (but flush lists)
    if (!trimmed) {
      flushList();
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h3-${i}`} className="text-xs font-black uppercase tracking-wider text-primary mt-4 mb-1.5 flex items-center gap-1.5">
          <span className="w-1 h-4 bg-primary rounded-full" />
          {trimmed.slice(4)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h2-${i}`} className="text-sm font-black text-on-surface mt-4 mb-1.5 border-b border-stone-100 pb-1">
          {trimmed.slice(3)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h1-${i}`} className="text-base font-black text-on-surface mt-3 mb-2">
          {trimmed.slice(2)}
        </h2>
      );
      continue;
    }

    // Bullet points (- or *)
    if (/^[-*•]\s/.test(trimmed)) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      const content = trimmed.replace(/^[-*•]\s+/, '');
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-sm leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
          <span>{formatInline(content)}</span>
        </li>
      );
      continue;
    }

    // Numbered list
    if (/^\d+[.)]\s/.test(trimmed)) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      const num = trimmed.match(/^(\d+)/)?.[1] || '1';
      const content = trimmed.replace(/^\d+[.)]\s+/, '');
      listItems.push(
        <li key={`oli-${i}`} className="flex items-start gap-2.5 text-sm leading-relaxed">
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
            {num}
          </span>
          <span>{formatInline(content)}</span>
        </li>
      );
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed">
        {formatInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

const SUGGESTIONS = [
  { text: "How can I improve my resume?", emoji: "📄" },
  { text: "Career transition tips for tech", emoji: "🚀" },
  { text: "How to prepare for FAANG interviews?", emoji: "💼" },
  { text: "Networking strategies for introverts", emoji: "🤝" },
  { text: "What skills are trending in 2026?", emoji: "📈" },
  { text: "How to ask for a referral politely?", emoji: "✉️" },
];

export default function AIAssistant() {
  const { profile } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: userText,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build context from alumni directory
      let alumniContext = '';
      try {
        const alumni = await dataService.getAlumni();
        if (alumni && alumni.length > 0) {
          alumniContext = `\nAlumni Network (${alumni.length} members): ` +
            alumni.slice(0, 10).map(a => `${a.name} (${a.job_role || 'Professional'} at ${a.company || 'N/A'})`).join(', ');
        }
      } catch {
        // Silently ignore directory fetch errors
      }

      const userContext = profile
        ? `\nAsking user: ${profile.name}, Role: ${profile.role}, Skills: ${(profile.skills || []).join(', ')}`
        : '';

      const response = await aiService.getCareerAdvice(
        userText,
        alumniContext + userContext
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response || "I'm sorry, I couldn't generate a response. Please check if GEMINI_API_KEY is configured in the .env file.",
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "⚠️ I'm having trouble connecting. Please make sure:\n\n1. Your GEMINI_API_KEY is set in the .env file\n2. The server is running\n3. You have an internet connection\n\nTry again in a moment!",
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  const firstName = profile?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-black text-on-surface tracking-tight">AI Career Assistant</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-xs text-stone-400 font-bold">Powered by Gemini • Online</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 space-y-4 min-h-0"
      >
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-headline font-black text-on-surface mb-2">
              Hey {firstName}! 👋
            </h2>
            <p className="text-stone-500 text-center max-w-md mb-8 font-medium">
              I can help with career advice, resume tips, interview prep, and connecting you with alumni. What would you like to know?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-2xl w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSend(s.text)}
                  className="text-left p-3 bg-white border border-stone-200 rounded-2xl text-sm text-stone-600 hover:border-primary hover:text-primary hover:shadow-md transition-all group"
                >
                  <span className="text-lg mb-1 block">{s.emoji}</span>
                  <span className="font-medium group-hover:font-bold transition-all">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-primary to-orange-500'
                  : 'bg-stone-200'
              }`}>
                {msg.role === 'assistant'
                  ? <Sparkles className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-stone-600" />
                }
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'assistant'
                  ? 'bg-white border border-stone-100 rounded-tl-sm'
                  : 'bg-primary text-white rounded-tr-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="text-stone-700">
                    <RenderMarkdown text={msg.content} />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                    {msg.content}
                  </p>
                )}
                <p className={`text-[10px] mt-2 ${
                  msg.role === 'assistant' ? 'text-stone-300' : 'text-white/60'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              </div>
              <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 pt-4 px-2">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative"
        >
          <div className="bg-white shadow-[0_-4px_30px_rgba(138,114,100,0.1)] rounded-2xl border border-stone-200 flex items-center p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <input
              ref={inputRef}
              className="flex-1 border-none focus:ring-0 bg-transparent py-3 px-4 text-on-surface font-medium placeholder:text-stone-400 text-sm"
              placeholder="Ask me anything about your career..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              type="text"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center mt-2 text-stone-400 font-medium">
            Powered by Google Gemini AI • Responses may not be 100% accurate
          </p>
        </form>
      </div>
    </div>
  );
}
