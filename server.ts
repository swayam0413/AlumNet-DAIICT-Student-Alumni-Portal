import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const GROK_API_KEY = process.env.GROK_API_KEY || '';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

async function callGrok(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini-fast',
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- AI API routes (powered by Grok) ---
  app.post('/api/ai/parse-resume', async (req, res) => {
    try {
      const { fileData, mimeType } = req.body;

      if (!GROK_API_KEY) {
        return res.status(500).json({ error: 'GROK_API_KEY not configured' });
      }

      // For resume parsing, we send the base64 data as text context
      // Grok doesn't support inline file data like Gemini, so we describe what to extract
      const prompt = `You are a resume parser. The user has uploaded a resume file (${mimeType}). 
The base64-encoded content is provided below. Parse whatever text you can identify and extract structured information.

Base64 content (first 2000 chars): ${fileData.substring(0, 2000)}

Return ONLY valid JSON with these keys (use empty string or empty array if not found):
{
  "name": "Full Name",
  "job_role": "Current or most recent job title",
  "company": "Current or most recent company",
  "skills": ["skill1", "skill2"],
  "graduation_year": 2024,
  "department": "Department or field of study",
  "summary": "A 2-3 sentence professional summary"
}`;

      const result = await callGrok([
        { role: 'system', content: 'You are a helpful resume parser. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ]);

      // Extract JSON from potential markdown code blocks
      const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
      const parsed = JSON.parse(jsonMatch[1]!.trim());

      res.json(parsed);
    } catch (error: any) {
      console.error('Resume parse error:', error);
      res.status(500).json({ error: error.message || 'Failed to parse resume' });
    }
  });

  app.post('/api/ai/career-advice', async (req, res) => {
    try {
      const { query, context } = req.body;

      if (!GROK_API_KEY) {
        return res.status(500).json({ error: 'GROK_API_KEY not configured' });
      }

      const result = await callGrok([
        {
          role: 'system',
          content: `You are a career advisor for DA-IICT alumni and students. You help with career guidance, networking tips, resume improvement, and job search strategies. Be concise, actionable, and encouraging.`
        },
        {
          role: 'user',
          content: `Context about the alumni network: ${context}\n\nUser question: ${query}`
        }
      ]);

      res.json({ response: result });
    } catch (error: any) {
      console.error('Career advice error:', error);
      res.status(500).json({ error: error.message || 'Failed to get advice' });
    }
  });

  // --- Smart Referral Generation ---
  app.post('/api/ai/generate-referral', async (req, res) => {
    try {
      const { student, alumni, job, tone, customNote } = req.body;

      if (!GROK_API_KEY) {
        return res.status(500).json({ error: 'GROK_API_KEY not configured' });
      }

      const sharedContext: string[] = [];
      if (student.department && alumni.department && student.department === alumni.department) {
        sharedContext.push(`Both from ${student.department} department`);
      }
      if (student.skills && alumni.skills) {
        const shared = student.skills.filter((s: string) => 
          alumni.skills.some((a: string) => a.toLowerCase() === s.toLowerCase())
        );
        if (shared.length > 0) sharedContext.push(`Shared skills: ${shared.join(', ')}`);
      }

      const userPrompt = `Student Information:
Name: ${student.name || 'Student'}
Degree: ${student.department || 'Computer Science'}
Graduation Year: ${student.graduation_year || 'Current'}
Skills: ${(student.skills || []).join(', ') || 'Not specified'}
Resume Summary: ${student.resume_summary || 'Not provided'}
Career Goal: Working in ${job.company} as ${job.title}

Alumni Information:
Name: ${alumni.name || 'Alumni'}
Role: ${alumni.job_role || alumni.role || 'Professional'}
Company: ${alumni.company || job.company}
Shared Background: ${sharedContext.length > 0 ? sharedContext.join('; ') : 'Same university (DA-IICT)'}

Job Information:
Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}
Job Description Summary: ${job.description || 'Not provided'}

Tone: ${tone || 'Professional'}
${customNote ? `Additional context from student: ${customNote}` : ''}

Generate a referral request message that:
- Mentions shared background if available
- Shows alignment with job requirements
- Is polite and professional
- Is under 180 words
- Does not sound automated
- Addresses the alumni by first name`;

      const result = await callGrok([
        {
          role: 'system',
          content: 'You are a professional career communication assistant helping students write personalized referral requests to alumni. The message must be respectful, concise, and tailored. Avoid generic language. Do not exaggerate. Return ONLY the referral message text, no additional commentary.',
        },
        { role: 'user', content: userPrompt },
      ]);

      res.json({ message: result });
    } catch (error: any) {
      console.error('Referral generation error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate referral' });
    }
  });

  // --- Vite Dev Server ---
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`🚀 AlumConnect running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
