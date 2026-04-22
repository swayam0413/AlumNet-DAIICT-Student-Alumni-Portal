import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader2, ArrowLeft, Send, User, Search, Users, Phone, Video, MoreVertical, Check, CheckCheck, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { dataService, Conversation } from '../services/dataService';
import { UserProfile } from '../services/authService';
import { toast } from 'react-hot-toast';

export default function Messages() {
  const { user, profile } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('contacts');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load all users & existing conversations
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [users, convs] = await Promise.all([
          dataService.getAllUsers(),
          dataService.getConversations(user.uid),
        ]);
        // Filter out current user
        setAllUsers(users.filter(u => u.id !== user.uid));
        setConversations(convs);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Open a chat with a user
  const openChat = async (targetUser: UserProfile) => {
    if (!user || !profile) return;
    setSelectedUser(targetUser);
    setLoadingMsgs(true);
    setMessages([]);

    try {
      const convId = await dataService.getOrCreateConversation(
        user.uid,
        targetUser.id,
        profile.name,
        targetUser.name
      );
      setSelectedConvId(convId);

      const msgs = await dataService.getMessages(convId);
      setMessages(msgs);

      // Switch to chats tab and refresh conversations
      setActiveTab('chats');
      const convs = await dataService.getConversations(user.uid);
      setConversations(convs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to open chat');
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Open existing conversation
  const openConversation = async (conv: Conversation) => {
    if (!user) return;
    setSelectedConvId(conv.id);
    setLoadingMsgs(true);

    // Find the other user
    const otherId = conv.participants.find(p => p !== user.uid);
    const otherName = otherId ? (conv.participantNames?.[otherId] || 'User') : 'User';
    
    // Try to find full profile
    const otherUser = allUsers.find(u => u.id === otherId);
    setSelectedUser(otherUser || { id: otherId || '', name: otherName, email: '', role: 'student' as any } as UserProfile);

    try {
      const msgs = await dataService.getMessages(conv.id);
      setMessages(msgs);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedConvId || !user) return;
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
      await dataService.sendMessage(selectedConvId, user.uid, text);
      // Update conversation last message
      setConversations(prev => prev.map(c =>
        c.id === selectedConvId ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() } : c
      ));
    } catch (err) {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  // Filter users by search
  const filteredUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.job_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group users by role
  const alumni = filteredUsers.filter(u => u.role === 'alumni');
  const students = filteredUsers.filter(u => u.role === 'student');

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const getTimeLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-stone-400 text-sm font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-stone-900 dark:text-white tracking-tight">Messages</h1>
          <p className="text-stone-400 text-sm font-medium">{allUsers.length} members in the DA-IICT community</p>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="flex-1 flex bg-white dark:bg-stone-800 rounded-3xl shadow-[0_16px_64px_rgba(138,114,100,0.08)] border border-stone-100 dark:border-stone-700 overflow-hidden min-h-0">
        
        {/* Left Panel — Contacts & Chats */}
        <div className={`w-full md:w-96 flex flex-col border-r border-stone-100 dark:border-stone-700 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Search */}
          <div className="p-4 border-b border-stone-100 dark:border-stone-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-700 border-none rounded-xl text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-stone-100 dark:border-stone-700">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'contacts' 
                  ? 'text-primary border-b-2 border-primary bg-primary/5' 
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <Users className="w-4 h-4 mx-auto mb-1" />
              All People ({allUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === 'chats' 
                  ? 'text-primary border-b-2 border-primary bg-primary/5' 
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <MessageCircle className="w-4 h-4 mx-auto mb-1" />
              Chats ({conversations.length})
            </button>
          </div>

          {/* Contact / Chat List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'contacts' ? (
              <div>
                {/* Alumni Section */}
                {alumni.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-stone-50 dark:bg-stone-900 sticky top-0 z-10">
                      <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                        Alumni ({alumni.length})
                      </p>
                    </div>
                    {alumni.map(u => (
                      <button
                        key={u.id}
                        onClick={() => openChat(u)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-100 dark:hover:bg-stone-600 dark:hover:text-white transition-colors text-left ${
                          selectedUser?.id === u.id ? 'bg-primary/5 border-r-2 border-primary' : ''
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                            {u.profile_image ? (
                              <img src={u.profile_image} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-black text-primary">{getInitials(u.name)}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Alumni" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-stone-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                            {u.job_role ? `${u.job_role}` : 'Alumni'} {u.company ? `@ ${u.company}` : ''}
                          </p>
                        </div>
                        <MessageCircle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Students Section */}
                {students.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-stone-50 dark:bg-stone-900 sticky top-0 z-10">
                      <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                        Students ({students.length})
                      </p>
                    </div>
                    {students.map(u => (
                      <button
                        key={u.id}
                        onClick={() => openChat(u)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-100 dark:hover:bg-stone-600 dark:hover:text-white transition-colors text-left ${
                          selectedUser?.id === u.id ? 'bg-primary/5 border-r-2 border-primary' : ''
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center">
                            {u.profile_image ? (
                              <img src={u.profile_image} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-black text-blue-600">{getInitials(u.name)}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 border-2 border-white rounded-full" title="Student" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-stone-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                            {u.department || 'Student'} {u.graduation_year ? `• ${u.graduation_year}` : ''}
                          </p>
                        </div>
                        <MessageCircle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {filteredUsers.length === 0 && (
                  <div className="py-16 text-center">
                    <Search className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                    <p className="text-stone-400 text-sm font-medium">No users found</p>
                    <p className="text-stone-300 text-xs mt-1">Try a different search</p>
                  </div>
                )}
              </div>
            ) : (
              /* Chats Tab */
              <div>
                {conversations.length === 0 ? (
                  <div className="py-16 text-center px-6">
                    <MessageCircle className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                    <p className="text-stone-400 text-sm font-medium">No conversations yet</p>
                    <p className="text-stone-300 text-xs mt-1">Go to "All People" tab to start a chat</p>
                  </div>
                ) : (
                  conversations.map(conv => {
                    const otherId = conv.participants.find(p => p !== user?.uid);
                    const otherName = otherId ? (conv.participantNames?.[otherId] || 'User') : 'User';
                    const otherUser = allUsers.find(u => u.id === otherId);

                    return (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-left border-b border-stone-50 dark:border-stone-700 ${
                          selectedConvId === conv.id ? 'bg-primary/5 border-r-2 border-primary' : ''
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                          {otherUser?.profile_image ? (
                            <img src={otherUser.profile_image} alt={otherName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black text-primary">{getInitials(otherName)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-stone-900 dark:text-white truncate">{otherName}</p>
                            <span className="text-[10px] text-stone-400 flex-shrink-0 ml-2">
                              {getTimeLabel(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 truncate mt-0.5">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Chat Area */}
        <div className={`flex-1 flex flex-col bg-stone-50/30 dark:bg-gradient-to-b dark:from-stone-800 dark:to-stone-900 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700 shadow-sm">
                <button 
                  onClick={() => { setSelectedUser(null); setSelectedConvId(null); }}
                  className="md:hidden p-2 hover:bg-stone-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                  {selectedUser.profile_image ? (
                    <img src={selectedUser.profile_image} alt={selectedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-primary">{getInitials(selectedUser.name)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-stone-900 dark:text-white">{selectedUser.name}</p>
                  <p className="text-[10px] text-stone-400">
                    {selectedUser.role === 'alumni' ? '🟢 Alumni' : '🔵 Student'}
                    {selectedUser.company ? ` • ${selectedUser.company}` : ''}
                    {selectedUser.department ? ` • ${selectedUser.department}` : ''}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4">
                      <MessageCircle className="w-10 h-10 text-primary/40" />
                    </div>
                    <h4 className="text-lg font-bold text-stone-600 mb-1">Start a conversation</h4>
                    <p className="text-stone-400 text-sm max-w-xs">
                      Send a message to <span className="font-bold text-primary">{selectedUser.name}</span> to begin networking!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Date separator */}
                    <div className="flex items-center justify-center mb-4">
                      <span className="px-4 py-1 bg-white rounded-full text-[10px] font-bold text-stone-400 shadow-sm border border-stone-100">
                        Conversation Started
                      </span>
                    </div>
                    {messages.map((msg, i) => {
                      const isMe = msg.senderId === user?.uid;
                      const showAvatar = i === 0 || messages[i - 1]?.senderId !== msg.senderId;
                      
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${!showAvatar ? (isMe ? 'pr-0' : 'pl-10') : ''}`}
                        >
                          {!isMe && showAvatar && (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                              {selectedUser.profile_image ? (
                                <img src={selectedUser.profile_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-primary">{getInitials(selectedUser.name)}</span>
                              )}
                            </div>
                          )}
                          <div className={`max-w-[65%] ${isMe ? 'order-1' : ''}`}>
                            <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                              isMe
                                ? 'bg-primary text-white rounded-2xl rounded-br-md shadow-lg shadow-primary/10'
                                : 'bg-white text-stone-700 rounded-2xl rounded-bl-md shadow-sm border border-stone-100'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <p className={`text-[9px] mt-1 px-1 ${isMe ? 'text-right text-stone-400' : 'text-stone-300'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && <CheckCheck className="w-3 h-3 inline ml-1 text-primary/50" />}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-stone-800 border-t border-stone-100 dark:border-stone-700">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Message ${selectedUser.name}...`}
                      className="w-full px-5 py-3.5 bg-stone-50 dark:bg-stone-700 dark:text-white dark:placeholder-stone-400 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 font-medium pr-12"
                      disabled={loadingMsgs}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500">
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="w-12 h-12 bg-primary text-white rounded-2xl hover:bg-orange-700 disabled:bg-stone-200 disabled:text-stone-400 transition-all flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-orange-50 rounded-3xl flex items-center justify-center mx-auto">
                  <MessageCircle className="w-12 h-12 text-primary/30" />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-stone-600">AlumConnect Chat</h3>
                  <p className="text-stone-400 text-sm mt-2 leading-relaxed">
                    Connect with DA-IICT alumni and students. Select someone from the list to start a conversation.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-6 pt-4 text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] font-bold uppercase">Alumni</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-400 rounded-full" />
                    <span className="text-[10px] font-bold uppercase">Students</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
