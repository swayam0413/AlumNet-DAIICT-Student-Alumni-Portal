import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    // Use OpenAI to understand the natural language query
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for searching alumni based on natural language queries. Return a JSON array of alumni IDs that match the query.' },
        { role: 'user', content: `Find alumni matching: ${query}. Available alumni: 1. John Doe - Tech, Google, AI skills; 2. Jane Smith - Finance, JPMorgan, Python; 3. Bob Johnson - Healthcare, Mayo Clinic, ML. Return only JSON array of matching IDs.` }
      ],
    });

    const response = completion.choices[0].message.content;
    const matchingIds = JSON.parse(response || '[]');

    // Mock alumni data - in real app, fetch from database
    const mockAlumni = [
      { id: 1, name: 'John Doe', graduationYear: 2015, industry: 'Technology', company: 'Google', location: 'Mountain View, CA', skills: ['JavaScript', 'React', 'AI'] },
      { id: 2, name: 'Jane Smith', graduationYear: 2018, industry: 'Finance', company: 'JPMorgan', location: 'New York, NY', skills: ['Python', 'Data Analysis', 'Finance'] },
      { id: 3, name: 'Bob Johnson', graduationYear: 2020, industry: 'Healthcare', company: 'Mayo Clinic', location: 'Rochester, MN', skills: ['Machine Learning', 'Healthcare', 'Research'] },
    ];

    const matches = mockAlumni.filter(alumni => matchingIds.includes(alumni.id));

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}