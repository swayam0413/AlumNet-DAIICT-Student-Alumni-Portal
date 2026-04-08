import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userProfile } = await request.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an AI that matches user profiles with alumni based on skills, interests, and career goals. Return a JSON array of alumni IDs that would be good matches.' },
        { role: 'user', content: `User profile: ${JSON.stringify(userProfile)}. Available alumni: 1. John Doe - Tech, AI skills; 2. Jane Smith - Finance, Python; 3. Bob Johnson - Healthcare, ML. Return JSON array of matching IDs.` }
      ],
    });

    const response = completion.choices[0].message.content;
    const matchingIds = JSON.parse(response || '[]');

    const mockAlumni = [
      { id: 1, name: 'John Doe', graduationYear: 2015, industry: 'Technology', company: 'Google', location: 'Mountain View, CA', skills: ['JavaScript', 'React', 'AI'] },
      { id: 2, name: 'Jane Smith', graduationYear: 2018, industry: 'Finance', company: 'JPMorgan', location: 'New York, NY', skills: ['Python', 'Data Analysis', 'Finance'] },
      { id: 3, name: 'Bob Johnson', graduationYear: 2020, industry: 'Healthcare', company: 'Mayo Clinic', location: 'Rochester, MN', skills: ['Machine Learning', 'Healthcare', 'Research'] },
    ];

    const matches = mockAlumni.filter(alumni => matchingIds.includes(alumni.id));

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Profile matching error:', error);
    return NextResponse.json({ error: 'Failed to match profiles' }, { status: 500 });
  }
}