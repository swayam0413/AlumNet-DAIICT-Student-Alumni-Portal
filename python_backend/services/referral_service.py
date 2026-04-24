"""Referral generation service."""
from utils.gemini_client import gemini


async def generate_referral(student: dict, alumni: dict, job: dict, tone: str = "Professional", custom_note: str = None) -> str:
    """Generate an AI-powered personalized referral request message."""
    shared_context = []
    if student.get("department") and alumni.get("department"):
        if student["department"] == alumni["department"]:
            shared_context.append(f"Both from {student['department']} department")

    student_skills = [s.lower() for s in (student.get("skills") or [])]
    alumni_skills = [s.lower() for s in (alumni.get("skills") or [])]
    shared_skills = [s for s in student_skills if s in alumni_skills]
    if shared_skills:
        shared_context.append(f"Shared skills: {', '.join(shared_skills)}")

    system_instruction = (
        "You are a professional career communication assistant helping students write "
        "personalized referral requests to alumni. The message must be respectful, concise, "
        "and tailored. Avoid generic language. Do not exaggerate. Return ONLY the referral "
        "message text, no additional commentary."
    )

    user_prompt = f"""Student Information:
Name: {student.get('name', 'Student')}
Degree: {student.get('department', 'Computer Science')}
Graduation Year: {student.get('graduation_year', 'Current')}
Skills: {', '.join(student.get('skills', [])) or 'Not specified'}
Resume Summary: {student.get('resume_summary', 'Not provided')}
Career Goal: Working in {job.get('company')} as {job.get('title')}

Alumni Information:
Name: {alumni.get('name', 'Alumni')}
Role: {alumni.get('job_role') or alumni.get('role', 'Professional')}
Company: {alumni.get('company') or job.get('company')}
Shared Background: {'; '.join(shared_context) if shared_context else 'Same university (DA-IICT)'}

Job Information:
Job Title: {job.get('title')}
Company: {job.get('company')}
Location: {job.get('location', 'Not specified')}
Job Description Summary: {job.get('description', 'Not provided')}

Tone: {tone}
{f'Additional context from student: {custom_note}' if custom_note else ''}

Generate a referral request message that:
- Mentions shared background if available
- Shows alignment with job requirements
- Is polite and professional
- Is under 180 words
- Does not sound automated
- Addresses the alumni by first name"""

    return await gemini.generate(user_prompt, system_instruction)
