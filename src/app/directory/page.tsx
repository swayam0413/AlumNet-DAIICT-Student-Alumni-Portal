'use client';

import { useState } from 'react';

interface Alumni {
  id: number;
  name: string;
  graduationYear: number;
  industry: string;
  company: string;
  location: string;
  skills: string[];
}

const mockAlumni: Alumni[] = [
  { id: 1, name: 'John Doe', graduationYear: 2015, industry: 'Technology', company: 'Google', location: 'Mountain View, CA', skills: ['JavaScript', 'React', 'AI'] },
  { id: 2, name: 'Jane Smith', graduationYear: 2018, industry: 'Finance', company: 'JPMorgan', location: 'New York, NY', skills: ['Python', 'Data Analysis', 'Finance'] },
  { id: 3, name: 'Bob Johnson', graduationYear: 2020, industry: 'Healthcare', company: 'Mayo Clinic', location: 'Rochester, MN', skills: ['Machine Learning', 'Healthcare', 'Research'] },
  // Add more mock data
];

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAlumni, setFilteredAlumni] = useState(mockAlumni);
  const [aiMatches, setAiMatches] = useState<Alumni[]>([]);

  const handleSearch = () => {
    const filtered = mockAlumni.filter(alumni =>
      alumni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumni.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alumni.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredAlumni(filtered);
  };

  const handleAISearch = async () => {
    // Mock AI search - in real app, call API
    const response = await fetch('/api/ai/search-alumni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery }),
    });
    const data = await response.json();
    setAiMatches(data.matches || []);
  };

  const handleProfileMatching = async () => {
    // Mock profile matching
    const response = await fetch('/api/ai/match-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfile: { skills: ['JavaScript', 'AI'], interests: ['Tech', 'Mentoring'] } }),
    });
    const data = await response.json();
    setAiMatches(data.matches || []);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Alumni Directory</h1>

        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, industry, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
            <button
              onClick={handleAISearch}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              AI Smart Search
            </button>
            <button
              onClick={handleProfileMatching}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Find Matches
            </button>
          </div>
        </div>

        {/* AI Matches */}
        {aiMatches.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Recommended Matches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiMatches.map((alumni) => (
                <div key={alumni.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{alumni.name}</h3>
                  <p className="text-gray-600">{alumni.graduationYear} • {alumni.industry}</p>
                  <p className="text-gray-600">{alumni.company} • {alumni.location}</p>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Skills: {alumni.skills.join(', ')}</p>
                  </div>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alumni List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((alumni) => (
            <div key={alumni.id} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900">{alumni.name}</h3>
              <p className="text-gray-600">{alumni.graduationYear} • {alumni.industry}</p>
              <p className="text-gray-600">{alumni.company}</p>
              <p className="text-gray-600">{alumni.location}</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Skills: {alumni.skills.join(', ')}</p>
              </div>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}