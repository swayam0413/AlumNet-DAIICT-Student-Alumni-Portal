import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- AI API routes ---
  app.post('/api/ai/parse-resume', async (req, res) => {
    try {
      const { fileData, mimeType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
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
  "summary": "A 2-3 sentence professional summary"
}`,
              },
            ],
          },
        ],
      });

      const text = result.text || '';
      // Extract JSON from potential markdown code blocks
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
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a career advisor for DA-IICT alumni and students. 
Here is some context about the alumni network: ${context}

User question: ${query}

Provide helpful, actionable career advice. Keep your response concise and well-structured.`,
              },
            ],
          },
        ],
      });

      res.json({ response: result.text || 'No response generated.' });
    } catch (error: any) {
      console.error('Career advice error:', error);
      res.status(500).json({ error: error.message || 'Failed to get advice' });
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
