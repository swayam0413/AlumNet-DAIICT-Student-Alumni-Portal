"""
Advanced Resume Parsing with LangChain
Multi-step AI pipeline: Extract → Analyze → Score → Career Path
"""

import os
import re
import json
import base64
import logging
from typing import Dict, Any, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("alumconnect.langchain_parser")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


# ── Pydantic Output Schemas ──────────────────────────────────────

class ProjectInfo(BaseModel):
    title: str = Field(description="Project name")
    description: str = Field(description="1-2 sentence project description")
    technologies: List[str] = Field(default_factory=list, description="Technologies used")
    impact: str = Field(default="", description="Impact or outcome of the project")

class ResumeExtraction(BaseModel):
    name: str = Field(description="Full name of the candidate")
    email: str = Field(default="", description="Email address")
    phone: str = Field(default="", description="Phone number")
    job_role: str = Field(description="Current or most recent job title")
    company: str = Field(description="Current or most recent company")
    skills: List[str] = Field(default_factory=list, description="List of technical and soft skills")
    graduation_year: int = Field(default=2024, description="Year of graduation")
    department: str = Field(description="Department or field of study")
    education: List[str] = Field(default_factory=list, description="Educational qualifications")
    experience_years: int = Field(default=0, description="Total years of experience")
    certifications: List[str] = Field(default_factory=list, description="Professional certifications")

class ResumeAnalysis(BaseModel):
    summary: str = Field(description="2-3 sentence professional summary")
    ai_introduction: str = Field(description="3-4 sentence compelling introduction in third person")
    strengths: List[str] = Field(default_factory=list, description="Top 3-5 professional strengths")
    improvement_areas: List[str] = Field(default_factory=list, description="Areas for improvement")
    ai_projects: List[ProjectInfo] = Field(default_factory=list, description="Notable projects")

class ResumeScore(BaseModel):
    overall_score: int = Field(description="Overall resume score 0-100")
    skill_depth: int = Field(description="Skill depth score 0-100")
    experience_relevance: int = Field(description="Experience relevance score 0-100")
    project_quality: int = Field(description="Project quality score 0-100")
    presentation: int = Field(description="Resume presentation score 0-100")
    feedback: str = Field(description="2-3 sentence scoring feedback")

class CareerPathStep(BaseModel):
    year: str = Field(description="Timeline, e.g. 'Year 1-2'")
    role: str = Field(description="Suggested role")
    company_type: str = Field(description="Type of company, e.g. 'FAANG', 'Startup'")
    skills_to_build: List[str] = Field(default_factory=list, description="Skills to develop")
    description: str = Field(description="Brief description of this career stage")

class CareerPathSuggestion(BaseModel):
    current_position: str = Field(description="Current career position")
    target_roles: List[str] = Field(default_factory=list, description="Recommended target roles")
    path: List[CareerPathStep] = Field(default_factory=list, description="5-year career path steps")
    industry_trends: List[str] = Field(default_factory=list, description="Relevant industry trends")
    recommended_certifications: List[str] = Field(default_factory=list, description="Certifications to pursue")


# ── LangChain Pipeline ───────────────────────────────────────────

async def parse_resume_with_langchain(file_data: str, mime_type: str) -> Dict[str, Any]:
    """
    Multi-step LangChain pipeline for advanced resume parsing.
    
    Steps:
    1. Extract — Pull structured data from resume
    2. Analyze — Generate insights, summary, introduction
    3. Score — Rate the resume quality
    """
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)

    # ── Step 1: Extract structured data ──
    logger.info("Step 1: Extracting structured data from resume...")

    extract_prompt = """You are an expert resume parser. Extract ALL information from this resume.
Return ONLY valid JSON with these exact keys:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or empty string",
  "job_role": "Current/most recent job title",
  "company": "Current/most recent company",
  "skills": ["skill1", "skill2", ...],
  "graduation_year": 2024,
  "department": "Department or field of study",
  "education": ["Degree - University - Year"],
  "experience_years": 3,
  "certifications": ["cert1", "cert2"]
}

Extract ALL skills mentioned (technical, soft, tools, frameworks). Be thorough."""

    extract_response = client.models.generate_content(
        model="gemma-3-27b-it",
        contents=[{
            "role": "user",
            "parts": [
                {"inline_data": {"mime_type": mime_type, "data": file_data}},
                {"text": extract_prompt},
            ],
        }],
    )

    extraction = _parse_json_safely(extract_response.text or "{}")

    # ── Step 2: Analyze & generate insights ──
    logger.info("Step 2: Analyzing resume and generating insights...")

    analyze_prompt = f"""Based on this extracted resume data, provide a deep analysis.
Return ONLY valid JSON:

Resume Data:
{json.dumps(extraction, indent=2)}

Return JSON:
{{
  "summary": "2-3 sentence professional summary highlighting key strengths",
  "ai_introduction": "3-4 sentence polished professional bio in third person, like a LinkedIn About section. Start with their name and role (e.g., 'Swayam is a software engineer specializing in...'). Do NOT write a speech or conference introduction. Do NOT start with 'Ladies and gentlemen'. Highlight what makes them unique.",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvement_areas": ["area1", "area2"],
  "ai_projects": [
    {{
      "title": "Project Name",
      "description": "What the project does",
      "technologies": ["tech1", "tech2"],
      "impact": "Business/technical impact"
    }}
  ]
}}

For ai_projects, infer up to 5 notable projects from their experience. If explicit projects aren't listed, create project entries from their work experience."""

    analyze_response = client.models.generate_content(
        model="gemma-3-27b-it",
        contents=[{"role": "user", "parts": [{"text": analyze_prompt}]}],
    )

    analysis = _parse_json_safely(analyze_response.text or "{}")

    # ── Step 3: Score the resume ──
    logger.info("Step 3: Scoring resume quality...")

    score_prompt = f"""Rate this resume on a scale of 0-100 across multiple dimensions.
Return ONLY valid JSON:

Resume Data:
{json.dumps(extraction, indent=2)}

Analysis:
{json.dumps(analysis, indent=2)}

Return JSON:
{{
  "overall_score": 75,
  "skill_depth": 80,
  "experience_relevance": 70,
  "project_quality": 65,
  "presentation": 85,
  "feedback": "2-3 sentence constructive feedback about the resume quality and how to improve it."
}}

Be realistic with scores. A fresh graduate with no experience should score 30-50.
An experienced professional with strong projects should score 70-90."""

    score_response = client.models.generate_content(
        model="gemma-3-27b-it",
        contents=[{"role": "user", "parts": [{"text": score_prompt}]}],
    )

    scores = _parse_json_safely(score_response.text or "{}")

    # ── Combine all results ──
    result = {
        # From extraction
        "name": extraction.get("name", ""),
        "email": extraction.get("email", ""),
        "job_role": extraction.get("job_role", ""),
        "company": extraction.get("company", ""),
        "skills": extraction.get("skills", []),
        "graduation_year": extraction.get("graduation_year", 2024),
        "department": extraction.get("department", ""),
        "education": extraction.get("education", []),
        "experience_years": extraction.get("experience_years", 0),
        "certifications": extraction.get("certifications", []),
        # From analysis
        "summary": analysis.get("summary", ""),
        "ai_introduction": analysis.get("ai_introduction", ""),
        "strengths": analysis.get("strengths", []),
        "improvement_areas": analysis.get("improvement_areas", []),
        "ai_projects": analysis.get("ai_projects", []),
        # From scoring
        "scores": scores,
        # Metadata
        "pipeline": "langchain-multi-step",
        "model": "gemma-3-27b-it",
        "steps_completed": 3,
    }

    logger.info(f"✅ Resume parsed successfully for: {result.get('name', 'Unknown')}")
    return result


async def suggest_career_path(user_profile: dict) -> Dict[str, Any]:
    """Generate a 5-year career path suggestion based on user profile using Gemma 3 27B."""
    from utils.gemini_client import gemini as gemini_client
    from utils.json_parser import extract_json as parse_json

    profile_summary = f"""Name: {user_profile.get('name', 'User')}
Current Role: {user_profile.get('job_role', 'Not specified')}
Company: {user_profile.get('company', 'Not specified')}
Department: {user_profile.get('department', 'Not specified')}
Skills: {', '.join(user_profile.get('skills', [])) or 'Not specified'}
Experience: {user_profile.get('experience_years', 0)} years
Education: {user_profile.get('course', '')} in {user_profile.get('specialization', '')}
Graduation: {user_profile.get('graduation_year', 'N/A')}"""

    prompt = f"""You are CareerPath AI — a senior career strategist who has guided 10,000+ Indian tech professionals from entry-level to leadership positions. You have deep knowledge of the Indian tech job market, salary benchmarks, and hiring trends for 2024-2029.

=== CANDIDATE PROFILE ===
{profile_summary}

=== YOUR TASK ===
Create a personalized, realistic 5-year career roadmap for this candidate. Your advice must be specific to the Indian tech market.

=== GUIDELINES ===
1. Be realistic about timelines — don't suggest VP roles after 2 years for a fresher.
2. Mention SPECIFIC companies hiring in India for each stage (e.g., "Razorpay, CRED, Zerodha" not just "fintech startups").
3. For skills_to_build: list specific technologies and certifications, not vague concepts.
4. Each career stage should build on the previous one logically.
5. Consider both IC (Individual Contributor) and Management tracks.
6. Include salary expectations in LPA (Lakhs Per Annum) for Indian market.
7. Industry trends should be specific to 2024-2029 predictions.

Return ONLY a valid JSON object (no markdown, no extra text):
{{
  "current_position": "<candid 1-2 sentence assessment of where they stand today, with strengths and gaps>",
  "target_roles": ["<aspirational role 1>", "<role 2>", "<role 3>"],
  "path": [
    {{
      "year": "Year 1",
      "role": "<specific role title>",
      "company_type": "<specific type: e.g., 'Series B SaaS Startup (like Razorpay, Postman)' not just 'Startup'>",
      "skills_to_build": ["<specific skill 1>", "<specific skill 2>", "<specific skill 3>"],
      "description": "<2-3 sentences: what to focus on, expected salary range in LPA, key milestones>"
    }},
    {{
      "year": "Year 2-3",
      "role": "<mid-level role>",
      "company_type": "<company type with examples>",
      "skills_to_build": ["<skill1>", "<skill2>"],
      "description": "<growth strategy with salary expectations>"
    }},
    {{
      "year": "Year 3-4",
      "role": "<senior role>",
      "company_type": "<company type>",
      "skills_to_build": ["<skill1>", "<skill2>"],
      "description": "<specialization/leadership focus>"
    }},
    {{
      "year": "Year 5+",
      "role": "<target role>",
      "company_type": "<dream tier>",
      "skills_to_build": ["<skill1>", "<skill2>"],
      "description": "<long-term vision with expected compensation range>"
    }}
  ],
  "industry_trends": ["<specific 2024-2029 trend 1>", "<trend 2>", "<trend 3>", "<trend 4>"],
  "recommended_certifications": ["<cert 1 with provider, e.g., 'AWS Solutions Architect — Amazon'>", "<cert 2>", "<cert 3>"]
}}"""

    result_text = await gemini_client.generate(prompt)
    return parse_json(result_text)


def _parse_json_safely(text: str) -> dict:
    """Safely parse JSON from LLM response."""
    # Try fenced code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try raw JSON
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in text
    obj_match = re.search(r"\{[\s\S]*\}", text)
    if obj_match:
        try:
            return json.loads(obj_match.group(0))
        except json.JSONDecodeError:
            pass

    logger.warning(f"Could not parse JSON from: {text[:200]}...")
    return {}
