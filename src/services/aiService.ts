const API_BASE = '/api';

interface ResumeParseResult {
  name?: string;
  job_role?: string;
  company?: string;
  skills?: string[];
  graduation_year?: number;
  department?: string;
  summary?: string;
}

class AIService {
  async parseResume(base64Data: string, mimeType: string): Promise<ResumeParseResult | null> {
    try {
      const response = await fetch(`${API_BASE}/ai/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64Data, mimeType }),
      });

      if (!response.ok) {
        throw new Error('Resume parsing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Resume parse error:', error);
      // Fallback: return null if the AI backend is unavailable
      return null;
    }
  }

  async getCareerAdvice(query: string, context: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE}/ai/career-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });

      if (!response.ok) {
        throw new Error('Career advice request failed');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Career advice error:', error);
      return null;
    }
  }
}

export const aiService = new AIService();
