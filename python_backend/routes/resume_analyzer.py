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

    prompt = """You are an expert resume analyst and career advisor. Analyze this resume thoroughly.

=== INSTRUCTIONS ===
1. Extract all key information from the resume.
2. Identify skills (technical + soft), projects, experience, education.
3. Score the resume on multiple dimensions (be realistic, not inflated).
4. Provide actionable strengths, improvement areas, and a professional introduction.

Return ONLY a valid JSON object (no markdown fences, no extra text):
{
  "name": "<full name>",
  "email": "<email if found, else null>",
  "job_role": "<current or target role>",
  "company": "<current company or 'Student' or 'Fresher'>",
  "skills": ["skill1", "skill2", "...up to 15 key skills"],
  "graduation_year": <year as integer>,
  "department": "<department/major>",
  "education": ["<degree1 — institution>", "<degree2 — institution>"],
  "experience_years": <number>,
  "certifications": ["cert1", "cert2"],
  "summary": "<2-3 sentence professional summary extracted from resume>",
  "ai_introduction": "<a polished 2-3 sentence professional introduction you write FOR this candidate, highlighting their strongest attributes>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvement_areas": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"],
  "ai_projects": [
    {
      "title": "<project name>",
      "description": "<1-2 sentence description>",
      "technologies": ["tech1", "tech2"],
      "impact": "<measurable impact if mentioned>"
    }
  ],
  "scores": {
    "overall_score": <0-100>,
    "skill_depth": <0-100>,
    "experience_relevance": <0-100>,
    "project_quality": <0-100>,
    "presentation": <0-100>,
    "feedback": "<2-3 sentence overall feedback with specific advice>"
  },
  "pipeline": "gemma-3-27b-multimodal"
}

Scoring guide:
- overall_score: Weighted average considering all factors
- skill_depth: How deep and relevant are the listed skills?
- experience_relevance: Quality and relevance of work experience
- project_quality: Complexity, impact, and presentation of projects
- presentation: Resume formatting, clarity, grammar, structure

Be specific and thorough. For freshers/students, focus on projects, internships, and learning trajectory."""

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

        text_prompt = f"""You are an expert resume analyst and career advisor.

=== RESUME TEXT ===
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
