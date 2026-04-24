"""Networking radar service."""
import json
from utils.gemini_client import gemini
from utils.json_parser import extract_json_array


async def get_networking_insights(events: list, student_profile: dict) -> list:
    """Generate AI networking radar insights."""
    sp = student_profile

    system_instruction = """You are an AI networking advisor for DA-IICT university's alumni platform called AlumConnect. Your job is to analyze recent alumni activity and generate proactive, actionable networking insights for students.

Rules:
- Generate exactly 3-5 JSON insight objects
- Each insight must be specific and actionable
- Use professional but engaging language
- Include emojis for visual appeal
- Focus on opportunities relevant to the student's profile
- Return ONLY a valid JSON array, no other text"""

    prompt = f"""Student Profile:
Name: {sp.get('name', 'Student')}
Department: {sp.get('department', 'Not specified')}
Skills: {', '.join(sp.get('skills', [])) or 'Not specified'}
Graduation Year: {sp.get('graduation_year', 'Current')}
Career Interests: {sp.get('job_role', 'Not specified')}

Recent Alumni Network Activity (last 14 days):
{json.dumps(events, indent=2)}

Based on this data, generate personalized networking insights. Return a JSON array where each item has:
{{
  "id": "unique_string",
  "icon": "🔔|🚀|💼|📈|🎯|🤝|⭐",
  "title": "Short headline",
  "message": "2-3 sentence actionable insight",
  "type": "JOB_CHANGE|PROMOTION|HIRING_TREND|SKILL_TREND|CONNECTION_OPPORTUNITY",
  "priority": "high|medium|low",
  "actionLabel": "Connect Now|View Alumni|Explore Jobs|Learn More",
  "relatedCompany": "company name or null",
  "relatedIndustry": "industry or null"
}}"""

    result = await gemini.generate(prompt, system_instruction)
    return extract_json_array(result)
