import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { goals, skills } = await request.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an AI mentor recommender. Based on user goals and skills, recommend the most suitable mentors from the available list. Return a JSON array of mentor IDs.' },
        { role: 'user', content: `User goals: ${goals}, skills: ${skills.join(', ')}. Available mentors: 1. Alice Wilson - Software Engineering, AI/ML; 2. Charlie Brown - Data Science, Analytics. Return JSON array of recommended mentor IDs.` }
      ],
    });

    const response = completion.choices[0].message.content;
    const recommendedIds = JSON.parse(response || '[]');

    const mockMentors = [
      { id: 1, name: 'Alice Wilson', expertise: ['Software Engineering', 'AI/ML'], experience: '10+ years at FAANG', availability: 'Weekends' },
      { id: 2, name: 'Charlie Brown', expertise: ['Data Science', 'Analytics'], experience: '8 years in Finance', availability: 'Evenings' },
    ];

    const recommendations = mockMentors.filter(mentor => recommendedIds.includes(mentor.id));

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Mentor recommendation error:', error);
    return NextResponse.json({ error: 'Failed to recommend mentors' }, { status: 500 });
  }
}