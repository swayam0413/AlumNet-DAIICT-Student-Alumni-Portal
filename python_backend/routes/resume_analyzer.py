"""Resume analysis route — full profile extraction + scoring with Gemma 3 27B."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.gemini_client import gemini
from utils.pdf_parser import extract_pdf_text
from utils.json_parser import extract_json
from config import GEMINI_API_KEY
import traceback

router = APIRouter(prefix="/api/ml/resume", tags=["resume-analyzer"])


class ResumeParseRequest(BaseModel):
    fileData: str  # base64
    mimeType: str = "application/pdf"


@router.post("/parse-langchain")
async def parse_resume_langchain(req: ResumeParseRequest):
    """Full resume analysis: extract profile data, score, and provide feedback.
    Uses Gemma 3 27B for comprehensive analysis."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    prompt = """You are ResumeExpert AI — a senior HR analyst and career coach with 20 years of experience reviewing 50,000+ resumes at companies like Google, McKinsey, and Goldman Sachs. You specialize in evaluating Indian engineering graduates.

=== YOUR TASK ===
Perform a comprehensive resume analysis. Extract all data, evaluate quality, identify strengths/weaknesses, and score objectively.

=== EXTRACTION RULES ===
1. Extract the candidate's EXACT name, email, and contact info as written.
2. List ALL technical skills mentioned (programming languages, frameworks, tools, databases, cloud platforms, etc.) — up to 20.
3. Include soft skills only if explicitly demonstrated (e.g., "Led a team of 5" → Leadership).
4. For graduation_year: use the most recent degree's year. If still studying, use expected graduation year.
5. For experience_years: count from first job/internship to present. For students with only internships, use 0.
6. For job_role: use the most recent or target role. For students, infer from their skills/projects (e.g., "Full Stack Developer", "ML Engineer").
7. For company: use current employer. For students, write "Student" or "Fresher".

=== ANALYSIS RULES ===
1. ai_introduction: Write a polished 3rd-person professional bio (like a LinkedIn "About" section). It should read like: "Swayam is a software engineer specializing in..." — NOT a speech or conference introduction. Do NOT start with "Ladies and gentlemen" or any speech-style opening. Write it as a concise, impactful professional summary that highlights their key skills, experience, and what makes them unique.
2. strengths: List 3-5 SPECIFIC strengths backed by evidence from the resume (e.g., "Strong full-stack experience demonstrated through 3 production-grade MERN projects" not just "Good at programming").
3. improvement_areas: List 3-5 SPECIFIC, actionable suggestions (e.g., "Add quantifiable metrics to project descriptions — e.g., 'Reduced load time by 40%'" not just "Improve projects").
4. ai_projects: Extract ALL projects mentioned. For each, identify the core tech stack and try to infer impact even if not explicitly stated.

=== SCORING RUBRIC ===
Apply these criteria strictly:

**Skill Depth (0-100):**
- 90-100: Expert-level depth in 3+ areas with production experience
- 70-89: Strong skills with project evidence, some production work
- 50-69: Good academic skills, limited real-world application
- 30-49: Basic skills, mostly coursework
- 0-29: Very few or generic skills listed

**Experience Relevance (0-100):**
- 90-100: 3+ years of directly relevant industry experience
- 70-89: 1-3 years relevant experience or strong internships at top companies
- 50-69: Some internship experience, mostly academic projects
- 30-49: Only academic projects, no industry exposure
- 0-29: No relevant experience

**Project Quality (0-100):**
- 90-100: Complex, production-deployed projects with measurable impact
- 70-89: Well-documented projects with clear tech stack and outcomes
- 50-69: Standard academic projects with some complexity
- 30-49: Basic todo/calculator-level projects
- 0-29: No meaningful projects

**Presentation (0-100):**
- 90-100: Clean formatting, quantified achievements, strong action verbs, ATS-optimized
- 70-89: Good structure, mostly clear descriptions, some metrics
- 50-69: Decent format but vague descriptions, no metrics
- 30-49: Poor formatting, generic descriptions
- 0-29: Unreadable or extremely poorly formatted

**Overall Score:** Weighted average — Skills(30%) + Experience(25%) + Projects(25%) + Presentation(20%)

Return ONLY a valid JSON object (no markdown fences, no extra text):
{
  "name": "<exact full name>",
  "email": "<email or null>",
  "job_role": "<current/target role>",
  "company": "<current company or Student/Fresher>",
  "skills": ["<skill1>", "<skill2>", "...up to 20"],
  "graduation_year": <integer year>,
  "department": "<department/major>",
  "education": ["<Degree — Institution — Year>"],
  "experience_years": <integer>,
  "certifications": ["<cert1>", "<cert2>"],
  "summary": "<2-3 sentence factual summary extracted from resume content>",
  "ai_introduction": "<3-4 sentence compelling introduction you write FOR this person, as if introducing them at a tech conference>",
  "strengths": ["<specific evidence-backed strength>", "...3-5 items"],
  "improvement_areas": ["<specific actionable suggestion>", "...3-5 items"],
  "ai_projects": [
    {
      "title": "<project name>",
      "description": "<1-2 sentence description of what it does>",
      "technologies": ["<tech1>", "<tech2>"],
      "impact": "<measurable impact or 'Academic project'>"
    }
  ],
  "scores": {
    "overall_score": <0-100, calculated using weighted formula above>,
    "skill_depth": <0-100>,
    "experience_relevance": <0-100>,
    "project_quality": <0-100>,
    "presentation": <0-100>,
    "feedback": "<3 sentences: 1) What's strongest 2) What needs most improvement 3) One specific action to boost score by 10+ points>"
  },
  "pipeline": "gemma-3-27b-multimodal"
}"""

    # Strategy 1: Multimodal — send PDF directly to Gemma 3 27B
    try:
        print("[ANALYZER] Attempting multimodal PDF analysis...")
        result = await gemini.generate_with_file(prompt, req.fileData, req.mimeType)
        if result and len(result.strip()) > 20:
            parsed = extract_json(result)
            _validate_analysis(parsed)
            print(f"[ANALYZER] Multimodal success — score: {parsed.get('scores', {}).get('overall_score')}")
            return parsed
    except Exception as e:
        print(f"[ANALYZER] Multimodal failed: {e}")
        traceback.print_exc()

    # Strategy 2: Fallback to text extraction
    try:
        print("[ANALYZER] Falling back to text extraction...")
        resume_text = extract_pdf_text(req.fileData)
        if len(resume_text) < 50:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. Upload a text-based PDF.")

        text_prompt = f"""=== RESUME TEXT ===
{resume_text[:8000]}

{prompt}"""

        result = await gemini.generate(text_prompt)
        parsed = extract_json(result)
        _validate_analysis(parsed)
        parsed["pipeline"] = "gemma-3-27b-text-fallback"
        print(f"[ANALYZER] Text fallback success — score: {parsed.get('scores', {}).get('overall_score')}")
        return parsed
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ANALYZER] Text fallback failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


def _validate_analysis(data: dict):
    """Ensure all required fields exist with sensible defaults."""
    if not isinstance(data, dict):
        raise ValueError("AI returned non-dict response")

    data.setdefault("name", "Unknown")
    data.setdefault("email", None)
    data.setdefault("job_role", "Not specified")
    data.setdefault("company", "Not specified")
    data.setdefault("skills", [])
    data.setdefault("graduation_year", 2024)
    data.setdefault("department", "Not specified")
    data.setdefault("education", [])
    data.setdefault("experience_years", 0)
    data.setdefault("certifications", [])
    data.setdefault("summary", "")
    data.setdefault("ai_introduction", "")
    data.setdefault("strengths", [])
    data.setdefault("improvement_areas", [])
    data.setdefault("ai_projects", [])
    data.setdefault("scores", {
        "overall_score": 0,
        "skill_depth": 0,
        "experience_relevance": 0,
        "project_quality": 0,
        "presentation": 0,
        "feedback": "Analysis could not be completed fully."
    })
    data.setdefault("pipeline", "gemma-3-27b")

    # Ensure scores sub-fields
    scores = data["scores"]
    if isinstance(scores, dict):
        scores.setdefault("overall_score", 0)
        scores.setdefault("skill_depth", 0)
        scores.setdefault("experience_relevance", 0)
        scores.setdefault("project_quality", 0)
        scores.setdefault("presentation", 0)
        scores.setdefault("feedback", "")

        # Clamp all scores to 0-100
        for key in ["overall_score", "skill_depth", "experience_relevance", "project_quality", "presentation"]:
            if key in scores:
                scores[key] = max(0, min(100, int(scores[key])))
