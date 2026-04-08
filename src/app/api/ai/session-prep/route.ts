import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { mentor, goals } = await request.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an AI that helps prepare for mentorship sessions. Generate personalized preparation advice based on the mentor\'s expertise and user goals.' },
        { role: 'user', content: `Mentor: ${mentor.name}, expertise: ${mentor.expertise.join(', ')}. User goals: ${goals}. Generate preparation tips for the session.` }
      ],
    });

    const prep = completion.choices[0].message.content;

    return NextResponse.json({ prep });
  } catch (error) {
    console.error('Session prep error:', error);
    return NextResponse.json({ error: 'Failed to generate session prep' }, { status: 500 });
  }
}