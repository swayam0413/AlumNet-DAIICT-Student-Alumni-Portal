"""Resume match service — Direct PDF analysis with Gemma 3 27B multimodal."""
import json
import traceback
from utils.gemini_client import gemini
from utils.pdf_parser import extract_pdf_text
from utils.json_parser import extract_json


async def match_resume(file_data: str, job_title: str, job_company: str,
                       job_description: str = "", job_requirements: str = "") -> dict:
    """Match a resume against a job description using Gemma 3 27B.
    
    Strategy:
      1. Try multimodal: send the raw PDF to Gemma 3 27B directly (most accurate).
      2. Fallback: extract text with PyPDF2 and send as plain text.
    """

    prompt = f"""You are an expert ATS (Applicant Tracking System) and career advisor.
Analyze the candidate's resume against the following job posting.

=== JOB POSTING ===
Title: {job_title}
Company: {job_company}
Description: {job_description or 'Not provided'}
Requirements: {job_requirements or 'Not provided'}

=== INSTRUCTIONS ===
1. Carefully read the entire resume.
2. Compare every skill, project, experience, and qualification against the job requirements.
3. Be realistic and precise — do NOT inflate scores.
4. Consider both explicit keyword matches AND implied/transferable skills.
5. Evaluate experience level fit (junior/mid/senior).

Return ONLY a valid JSON object (no markdown fences, no extra text before or after):
{{
  "match_score": <integer 0-100>,
  "verdict": "<exactly one of: Strong Match, Moderate Match, Weak Match>",
  "verdict_summary": "<2-3 sentence explanation of why this score was given>",
  "matched_skills": ["<skill1>", "<skill2>", "..."],
  "missing_skills": ["<skill1>", "<skill2>", "..."],
  "experience_fit": {{
    "score": <integer 0-100>,
    "summary": "<1-2 sentence assessment of experience level vs job needs>"
  }},
  "keyword_match": {{
    "found": ["<keyword1>", "<keyword2>"],
    "missing": ["<keyword1>", "<keyword2>"]
  }},
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<actionable suggestion1>", "<actionable suggestion2>", "<actionable suggestion3>"],
  "ats_tips": ["<specific tip1>", "<specific tip2>", "<specific tip3>"]
}}

Scoring guidelines:
- 80-100: Resume closely matches all major requirements, strong relevant experience
- 60-79: Matches most requirements with some gaps, transferable skills present
- 40-59: Partial match, significant skill gaps, may need upskilling
- 0-39: Poor fit, major misalignment between resume and role

Be thorough and specific in your analysis. List real skills from the resume, not generic ones."""

    # --- Strategy 1: Multimodal (send PDF directly to Gemma 3 27B) ---
    try:
        print("[MATCH] Attempting multimodal PDF analysis...")
        result = await gemini.generate_with_file(prompt, file_data, "application/pdf")
        if result and len(result.strip()) > 10:
            parsed = extract_json(result)
            _validate_result(parsed)
            print(f"[MATCH] Multimodal success — score: {parsed.get('match_score')}")
            return parsed
    except Exception as e:
        print(f"[MATCH] Multimodal failed: {e}")
        traceback.print_exc()

    # --- Strategy 2: Fallback to text extraction + text-only prompt ---
    try:
        print("[MATCH] Falling back to text extraction...")
        resume_text = extract_pdf_text(file_data)
        if len(resume_text) < 50:
            raise ValueError("Could not extract text from PDF. Please upload a text-based PDF.")

        text_prompt = f"""You are an expert ATS (Applicant Tracking System) and career advisor.
Analyze the candidate's resume against the following job posting.

=== RESUME TEXT ===
{resume_text[:8000]}

=== JOB POSTING ===
Title: {job_title}
Company: {job_company}
Description: {job_description or 'Not provided'}
Requirements: {job_requirements or 'Not provided'}

=== INSTRUCTIONS ===
1. Carefully read the entire resume.
2. Compare every skill, project, experience, and qualification against the job requirements.
3. Be realistic and precise — do NOT inflate scores.
4. Consider both explicit keyword matches AND implied/transferable skills.
5. Evaluate experience level fit (junior/mid/senior).

Return ONLY a valid JSON object (no markdown fences, no extra text before or after):
{{
  "match_score": <integer 0-100>,
  "verdict": "<exactly one of: Strong Match, Moderate Match, Weak Match>",
  "verdict_summary": "<2-3 sentence explanation of why this score was given>",
  "matched_skills": ["<skill1>", "<skill2>", "..."],
  "missing_skills": ["<skill1>", "<skill2>", "..."],
  "experience_fit": {{
    "score": <integer 0-100>,
    "summary": "<1-2 sentence assessment of experience level vs job needs>"
  }},
  "keyword_match": {{
    "found": ["<keyword1>", "<keyword2>"],
    "missing": ["<keyword1>", "<keyword2>"]
  }},
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<actionable suggestion1>", "<actionable suggestion2>", "<actionable suggestion3>"],
  "ats_tips": ["<specific tip1>", "<specific tip2>", "<specific tip3>"]
}}

Scoring guidelines:
- 80-100: Resume closely matches all major requirements
- 60-79: Matches most requirements with some gaps
- 40-59: Partial match, significant gaps
- 0-39: Poor fit, major misalignment"""

        result = await gemini.generate(text_prompt)
        parsed = extract_json(result)
        _validate_result(parsed)
        print(f"[MATCH] Text fallback success — score: {parsed.get('match_score')}")
        return parsed
    except ValueError:
        raise
    except Exception as e:
        print(f"[MATCH] Text fallback failed: {e}")
        traceback.print_exc()
        raise ValueError(f"Analysis failed: {str(e)}")


def _validate_result(data: dict):
    """Validate the AI response has required fields, fill defaults for missing ones."""
    if not isinstance(data, dict):
        raise ValueError("AI returned non-dict response")
    
    # Ensure required fields exist with defaults
    data.setdefault("match_score", 0)
    data.setdefault("verdict", "Weak Match")
    data.setdefault("verdict_summary", "Analysis could not be completed fully.")
    data.setdefault("matched_skills", [])
    data.setdefault("missing_skills", [])
    data.setdefault("experience_fit", {"score": 0, "summary": "Not enough data."})
    data.setdefault("keyword_match", {"found": [], "missing": []})
    data.setdefault("strengths", [])
    data.setdefault("improvements", [])
    data.setdefault("ats_tips", [])
    
    # Clamp score
    data["match_score"] = max(0, min(100, int(data["match_score"])))
