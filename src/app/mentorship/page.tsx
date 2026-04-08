'use client';

import { useState } from 'react';

interface Mentor {
  id: number;
  name: string;
  expertise: string[];
  experience: string;
  availability: string;
}

const mockMentors: Mentor[] = [
  { id: 1, name: 'Alice Wilson', expertise: ['Software Engineering', 'AI/ML'], experience: '10+ years at FAANG', availability: 'Weekends' },
  { id: 2, name: 'Charlie Brown', expertise: ['Data Science', 'Analytics'], experience: '8 years in Finance', availability: 'Evenings' },
  // Add more
];

export default function Mentorship() {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [sessionPrep, setSessionPrep] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');

  const handleMentorRecommendation = async () => {
    // Mock AI recommendation
    const response = await fetch('/api/ai/recommend-mentors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals: 'Career in AI', skills: ['Python', 'ML'] }),
    });
    const data = await response.json();
    // For demo, just set first mentor
    setSelectedMentor(mockMentors[0]);
  };

  const handleSessionPrep = async () => {
    if (!selectedMentor) return;
    const response = await fetch('/api/ai/session-prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentor: selectedMentor, goals: 'Discuss AI career path' }),
    });
    const data = await response.json();
    setSessionPrep(data.prep || 'Prepare questions about your career goals and current projects.');
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Mock AI response
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chatInput, context: 'mentorship' }),
    });
    const data = await response.json();
    const aiMessage = { role: 'assistant' as const, content: data.response || 'I\'m here to help with your mentorship questions!' };
    setChatMessages(prev => [...prev, aiMessage]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentorship Hub</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mentor Recommendations */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Your Mentor</h2>
            <button
              onClick={handleMentorRecommendation}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
            >
              Get AI Mentor Recommendations
            </button>
            <div className="space-y-4">
              {mockMentors.map((mentor) => (
                <div key={mentor.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
                  <p className="text-gray-600">Expertise: {mentor.expertise.join(', ')}</p>
                  <p className="text-gray-600">{mentor.experience}</p>
                  <p className="text-gray-600">Available: {mentor.availability}</p>
                  <button
                    onClick={() => setSelectedMentor(mentor)}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Select Mentor
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Session Prep and Chat */}
          <div className="space-y-6">
            {/* Session Prep */}
            {selectedMentor && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Preparation</h2>
                <p className="text-gray-600 mb-4">Selected Mentor: {selectedMentor.name}</p>
                <button
                  onClick={handleSessionPrep}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mb-4"
                >
                  Generate AI Session Prep
                </button>
                {sessionPrep && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-800">{sessionPrep}</p>
                  </div>
                )}
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Schedule Session
                </button>
              </div>
            )}

            {/* AI Chatbot */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mentorship Assistant</h2>
              <div className="h-64 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {msg.content}
                    </span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about mentorship..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}