const API_BASE = '/api';

class AIService {
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

  async generateReferral(payload: {
    student: any;
    alumni: any;
    job: any;
    tone: string;
    customNote?: string;
  }): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE}/ai/generate-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Referral generation failed');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Referral generation error:', error);
      return null;
    }
  }

  async getNetworkingRadarInsights(events: any[], studentProfile: any): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/ai/networking-radar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, studentProfile }),
      });

      if (!response.ok) {
        throw new Error('Networking radar request failed');
      }

      const data = await response.json();
      return data.insights || [];
    } catch (error) {
      console.error('Networking radar error:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
