import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const result = await ai.models.generateContent({
    model: 'gemma-3-27b-it',
    contents: [
      {
        role: 'user',
        parts: [{ text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt }],
      },
    ],
  });

  return result.text || 'No response generated.';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Auto-start Python backend
  const pyScript = path.join(process.cwd(), 'python_backend', 'resume_match.py');
  console.log('🐍 Starting Python backend:', pyScript);
  const pyProcess = spawn('python', [pyScript], {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  pyProcess.stdout?.on('data', (d: Buffer) => {
    const msg = d.toString().trim();
    if (msg) console.log(`🐍 ${msg}`);
  });
  pyProcess.stderr?.on('data', (d: Buffer) => {
    const msg = d.toString().trim();
    if (msg) console.log(`🐍 [stderr] ${msg}`);
  });
  pyProcess.on('error', (err) => console.error('🐍 Failed to start Python:', err.message));
  pyProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) console.error(`🐍 Python exited with code ${code}`);
  });

  // Kill Python when Node exits
  process.on('exit', () => pyProcess.kill());
  process.on('SIGINT', () => { pyProcess.kill(); process.exit(); });
  process.on('SIGTERM', () => { pyProcess.kill(); process.exit(); });

  const FIREBASE_API_KEY = 'AIzaSyCL6eB6KyzJEKN4-fxWMO2ZFDFJvScI5gI';

  // --- Auth cleanup endpoint (uses Firebase REST API, no Admin SDK needed) ---
  app.post('/api/auth/delete-stale-user', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      
      // Try signing in via Firebase REST API
      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      
      if (!signInRes.ok) {
        // Can't sign in with this password — send password reset instead
        await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
          }
        );
        return res.status(403).json({ error: 'Password reset email sent. Check your inbox, reset password, then Sign In.' });
      }

      const signInData = await signInRes.json();
      const idToken = signInData.idToken;

      // Delete the account using the idToken
      const deleteRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );

      if (deleteRes.ok) {
        res.json({ success: true, message: 'Old account deleted. You can now re-register.' });
      } else {
        res.status(500).json({ error: 'Failed to delete old account.' });
      }
    } catch (err: any) {
      console.error('Delete stale user error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- AI API routes (powered by Gemini) ---
  app.post('/api/ai/parse-resume', async (req, res) => {
    try {
      const { fileData, mimeType } = req.body;

      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const result = await ai.models.generateContent({
        model: 'gemma-3-27b-it',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'application/pdf',
                  data: fileData,
                },
              },
              {
                text: `Analyze this resume and extract the following information. Return ONLY valid JSON with these keys:
{
  "name": "Full Name",
  "job_role": "Current or most recent job title",
  "company": "Current or most recent company",
  "skills": ["skill1", "skill2", ...],
  "graduation_year": 2024,
  "department": "Department or field of study",
  "summary": "A 2-3 sentence professional summary",
  "ai_introduction": "Write a compelling 3-4 sentence professional introduction about this person based on their resume. Write in third person. Highlight their expertise, experience level, and what makes them stand out.",
  "ai_projects": [
    {
      "title": "Project Name",
      "description": "1-2 sentence description of the project, technologies used, and impact"
    }
  ]
}

For ai_projects, extract up to 5 most notable projects or work experiences mentioned in the resume. If no projects are found, return an empty array.`,
              },
            ],
          },
        ],
      });

      const text = result.text || '';
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
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

      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const prompt = `You are a career advisor for DA-IICT alumni and students. 
Here is some context about the alumni network: ${context}

User question: ${query}

Provide helpful, actionable career advice. Keep your response concise and well-structured.`;

      const result = await callGemini(prompt);
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

      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
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

      const systemInstruction = 'You are a professional career communication assistant helping students write personalized referral requests to alumni. The message must be respectful, concise, and tailored. Avoid generic language. Do not exaggerate. Return ONLY the referral message text, no additional commentary.';

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

      const result = await callGemini(userPrompt, systemInstruction);
      res.json({ message: result });
    } catch (error: any) {
      console.error('Referral generation error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate referral' });
    }
  });

  // --- AI Networking Radar ---
  app.post('/api/ai/networking-radar', async (req, res) => {
    try {
      const { events, studentProfile } = req.body;

      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const systemInstruction = `You are an AI networking advisor for DA-IICT university's alumni platform called AlumConnect. Your job is to analyze recent alumni activity and generate proactive, actionable networking insights for students.

Rules:
- Generate exactly 3-5 JSON insight objects
- Each insight must be specific and actionable
- Use professional but engaging language
- Include emojis for visual appeal
- Focus on opportunities relevant to the student's profile
- Return ONLY a valid JSON array, no other text`;

      const prompt = `Student Profile:
Name: ${studentProfile.name || 'Student'}
Department: ${studentProfile.department || 'Not specified'}
Skills: ${(studentProfile.skills || []).join(', ') || 'Not specified'}
Graduation Year: ${studentProfile.graduation_year || 'Current'}
Career Interests: ${studentProfile.job_role || 'Not specified'}

Recent Alumni Network Activity (last 14 days):
${JSON.stringify(events, null, 2)}

Based on this data, generate personalized networking insights. Return a JSON array where each item has:
{
  "id": "unique_string",
  "icon": "🔔|🚀|💼|📈|🎯|🤝|⭐",
  "title": "Short headline",
  "message": "2-3 sentence actionable insight",
  "type": "JOB_CHANGE|PROMOTION|HIRING_TREND|SKILL_TREND|CONNECTION_OPPORTUNITY",
  "priority": "high|medium|low",
  "actionLabel": "Connect Now|View Alumni|Explore Jobs|Learn More",
  "relatedCompany": "company name or null",
  "relatedIndustry": "industry or null"
}`;

      const result = await callGemini(prompt, systemInstruction);
      
      // Parse JSON from response
      const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, result];
      let insights;
      try {
        insights = JSON.parse(jsonMatch[1]!.trim());
      } catch {
        // Try to find JSON array in plain text
        const arrayMatch = result.match(/\[[\s\S]*\]/);
        insights = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
      }

      res.json({ insights });
    } catch (error: any) {
      console.error('Networking radar error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate radar insights' });
    }
  });

  // --- Resume ↔ Job Match (proxied to Python backend) ---
  app.post('/api/ai/match-resume', async (req, res) => {
    try {
      const pyRes = await fetch('http://localhost:5000/api/match-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const text = await pyRes.text();
      if (!text.trim()) {
        return res.status(500).json({ error: 'Python backend returned empty response' });
      }
      res.status(pyRes.status).json(JSON.parse(text));
    } catch (error: any) {
      console.error('Python proxy error:', error?.message);
      res.status(500).json({ error: 'Python backend not running. Start it with: python python_backend/resume_match.py' });
    }
  });

  // --- LangChain-style 3-step Resume Analysis ---
  app.post('/api/ml/resume/parse-langchain', async (req, res) => {
    try {
      const { fileData, mimeType } = req.body;
      if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const parseJSON = (text: string) => {
        const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (m) return JSON.parse(m[1].trim());
        const obj = text.match(/\{[\s\S]*\}/);
        if (obj) return JSON.parse(obj[0]);
        return JSON.parse(text.trim());
      };

      console.log('📄 Step 1: Extracting...');
      const step1 = await ai.models.generateContent({
        model: 'gemma-3-27b-it',
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: mimeType || 'application/pdf', data: fileData } },
          { text: `Extract ALL info from this resume. Return ONLY valid JSON:
{"name":"Full Name","email":"","job_role":"Job title","company":"Company","skills":["skill1"],"graduation_year":2024,"department":"Department","education":["Degree - Uni"],"experience_years":0,"certifications":["cert1"]}
Extract ALL skills thoroughly.` },
        ]}],
      });
      const extraction = parseJSON(step1.text || '{}');

      console.log('🧠 Step 2: Analyzing...');
      const step2 = await callGemini(`Analyze this resume data. Return ONLY valid JSON:
Data: ${JSON.stringify(extraction)}
Return: {"summary":"2-3 sentence summary","ai_introduction":"3-4 sentence third-person intro","strengths":["s1","s2","s3"],"improvement_areas":["a1","a2"],"ai_projects":[{"title":"Name","description":"Desc","technologies":["t1"],"impact":"Impact"}]}
Infer up to 5 projects from experience.`);
      const analysis = parseJSON(step2);

      console.log('⭐ Step 3: Scoring...');
      const step3 = await callGemini(`Score this resume 0-100. Return ONLY valid JSON:
Resume: ${JSON.stringify(extraction)}
Return: {"overall_score":75,"skill_depth":80,"experience_relevance":70,"project_quality":65,"presentation":85,"feedback":"Constructive feedback."}
Fresh grad=30-50, experienced=70-90.`);
      const scores = parseJSON(step3);

      res.json({ ...extraction, ...analysis, scores, pipeline: 'langchain-3-step', model: 'gemma-3-27b-it', steps_completed: 3 });
      console.log('✅ Done:', extraction.name);
    } catch (error: any) {
      console.error('LangChain error:', error);
      res.status(500).json({ error: error.message || 'Resume analysis failed' });
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
