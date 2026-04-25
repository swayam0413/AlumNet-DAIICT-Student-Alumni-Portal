"""Referral generation service — Gemma 3 27B powered."""
from utils.gemini_client import gemini


async def generate_referral(student: dict, alumni: dict, job: dict, tone: str = "Professional", custom_note: str = None) -> str:
    """Generate an AI-powered personalized referral request message."""

    # Build shared context for personalization
    shared_context = []
    if student.get("department") and alumni.get("department"):
        if student["department"].lower() == alumni["department"].lower():
            shared_context.append(f"Both from {student['department']} department at DA-IICT")

    student_skills = set(s.lower() for s in (student.get("skills") or []))
    alumni_skills = set(s.lower() for s in (alumni.get("skills") or []))
    shared_skills = student_skills & alumni_skills
    if shared_skills:
        shared_context.append(f"Shared technical skills: {', '.join(list(shared_skills)[:5])}")

    # Check graduation year proximity
    student_year = student.get("graduation_year")
    alumni_year = alumni.get("graduation_year")
    if student_year and alumni_year and isinstance(student_year, int) and isinstance(alumni_year, int):
        year_diff = abs(student_year - alumni_year)
        if year_diff <= 3:
            shared_context.append(f"Close graduation years ({student_year} and {alumni_year})")

    tone_instructions = {
        "Professional": "Use formal business communication style. Address them respectfully. Structure the message clearly with purpose stated upfront.",
        "Friendly": "Use warm, approachable language like you're writing to an elder sibling from college. Be genuine and personable while remaining respectful.",
        "Concise": "Keep it under 120 words. Lead with your ask, provide minimal but compelling context. Respect their time.",
        "Formal": "Use highly formal language suitable for a senior executive. Show deep respect for their position and time. Use proper salutations."
    }

    system_instruction = f"""You are an expert career communication coach specializing in referral networking within Indian alumni networks.

Your task: Write a personalized referral request message from a DA-IICT student to an alumni.

Critical rules:
1. NEVER use generic phrases like "I came across your profile" or "I hope this message finds you well"
2. Start with a specific, personal hook — reference shared department, skills, company, or DA-IICT connection
3. Show you've researched the alumni — mention their specific role/company
4. Clearly state what you're asking for (referral for a specific role)
5. Briefly highlight 1-2 specific skills/projects that make you qualified (don't just list skills)
6. Show genuine interest in the company and role, not just getting a job
7. End with a low-pressure call to action (offer to share resume, schedule a brief call)
8. Do NOT use any placeholder text like [Your Name] — use the actual names provided
9. Address the alumni by their FIRST NAME only
10. Sign off with the student's FIRST NAME only

Tone: {tone_instructions.get(tone, tone_instructions["Professional"])}

Return ONLY the message text. No subject line, no commentary, no explanations."""

    user_prompt = f"""=== STUDENT (message sender) ===
Name: {student.get('name', 'Student')}
Department: {student.get('department', 'Computer Science')} at DA-IICT
Graduation Year: {student.get('graduation_year', 'Current student')}
Key Skills: {', '.join(list(student.get('skills', []))[:8]) or 'Not specified'}
Resume Highlights: {student.get('resume_summary', 'Not provided')}

=== ALUMNI (message recipient) ===
Name: {alumni.get('name', 'Alumni')}
Current Role: {alumni.get('job_role') or alumni.get('role', 'Professional')}
Company: {alumni.get('company') or job.get('company', 'the company')}
Department at DA-IICT: {alumni.get('department', 'Not specified')}

=== TARGET JOB ===
Title: {job.get('title', 'Software Engineer')}
Company: {job.get('company', 'Not specified')}
Location: {job.get('location', 'Not specified')}
Description: {(job.get('description', '') or '')[:500]}

=== SHARED BACKGROUND ===
{chr(10).join(shared_context) if shared_context else 'Both part of the DA-IICT alumni network'}

{f'=== ADDITIONAL CONTEXT FROM STUDENT ==={chr(10)}{custom_note}' if custom_note else ''}

Write the referral request message now. Make it feel authentic and human-written, not AI-generated."""

    return await gemini.generate(user_prompt, system_instruction)
