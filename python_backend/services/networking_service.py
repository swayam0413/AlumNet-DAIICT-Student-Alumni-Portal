"""Networking radar service — Gemma 3 27B powered insights."""
import json
from utils.gemini_client import gemini
from utils.json_parser import extract_json_array


async def get_networking_insights(events: list, student_profile: dict) -> list:
    """Generate AI networking radar insights using Gemma 3 27B."""
    sp = student_profile

    system_instruction = """You are NetworkRadar AI — an intelligent networking advisor for DA-IICT's alumni platform "AlumConnect".

Your role: Analyze recent alumni activity and generate proactive, hyper-personalized networking insights for a student.

Critical rules:
1. Generate EXACTLY 4 insights — no more, no less.
2. Each insight must be SPECIFIC — mention real names, companies, roles, and events from the data.
3. Prioritize insights by actionability — what can the student DO right now?
4. Connect insights to the student's specific skills and career goals.
5. Use engaging, motivational language — not corporate jargon.
6. Each insight should suggest a DIFFERENT type of action (connect, attend, learn, apply).
7. If alumni activity data is sparse, generate insights about industry trends relevant to the student's skills.
8. Use emojis strategically for visual categorization (1 emoji per title).
9. Return ONLY a valid JSON array — no markdown, no explanation, no wrapping text.

Priority scoring:
- "high" = Direct career opportunity (job, referral, mentorship from someone in student's target field)
- "medium" = Relevant networking opportunity (event, skill trend, company news)
- "low" = General awareness (industry trend, broad career advice)"""

    user_prompt = f"""=== STUDENT PROFILE ===
Name: {sp.get('name', 'Student')}
Department: {sp.get('department', 'Not specified')}
Technical Skills: {', '.join(sp.get('skills', [])) or 'Not specified'}
Graduation Year: {sp.get('graduation_year', 'Current')}
Career Interest: {sp.get('job_role', 'Not specified')}
Target Companies: {sp.get('company', 'Not specified')}

=== RECENT ALUMNI NETWORK ACTIVITY (last 14 days) ===
{json.dumps(events, indent=2) if events else 'No recent events data available. Generate insights based on student profile and general DA-IICT alumni ecosystem.'}

=== OUTPUT FORMAT ===
Return a JSON array with exactly 4 objects. Each object:
{{
  "id": "<unique_snake_case_id>",
  "icon": "<single emoji: 🚀 for jobs, 🤝 for connections, 📅 for events, 📈 for trends, 🎯 for skills, ⭐ for opportunities, 💼 for companies>",
  "title": "<short punchy headline, max 8 words>",
  "message": "<2-3 sentence actionable insight. Be specific — mention names, companies, and concrete actions the student should take.>",
  "type": "<one of: JOB_CHANGE | PROMOTION | HIRING_TREND | SKILL_TREND | CONNECTION_OPPORTUNITY | EVENT_ALERT>",
  "priority": "<high | medium | low>",
  "actionLabel": "<short CTA: Connect Now | View Profile | Explore Jobs | Attend Event | Learn More | View Details>",
  "relatedCompany": "<company name or null>",
  "relatedIndustry": "<industry name or null>"
}}

Generate insights now. Prioritize high-priority items first in the array."""

    result = await gemini.generate(user_prompt, system_instruction)
    insights = extract_json_array(result)

    # Ensure exactly 4 insights, pad if needed
    while len(insights) < 4:
        insights.append({
            "id": f"general_tip_{len(insights)}",
            "icon": "💡",
            "title": "Expand Your Network",
            "message": "Connect with DA-IICT alumni in your field of interest. Active networking increases job referral chances by 10x.",
            "type": "CONNECTION_OPPORTUNITY",
            "priority": "low",
            "actionLabel": "Browse Alumni",
            "relatedCompany": None,
            "relatedIndustry": None,
        })

    return insights[:4]
