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

    prompt = f"""You are ResumeMatch AI — a senior technical recruiter with 15+ years of experience at top tech companies (Google, Amazon, Microsoft). You specialize in evaluating resume-job fit with precision.

=== YOUR TASK ===
Analyze the candidate's resume against the job posting below. Provide a detailed, honest compatibility assessment.

=== JOB POSTING ===
Title: {job_title}
Company: {job_company}
Description: {job_description or 'Not provided'}
Requirements: {job_requirements or 'Not provided'}

=== EVALUATION METHODOLOGY ===
1. **Skill Matching (40% weight)**: Map EVERY skill in the job requirements to the resume. Mark as matched (exact or synonymous) or missing.
2. **Experience Fit (25% weight)**: Assess years of experience, seniority level, and domain relevance.
3. **Project Relevance (20% weight)**: Evaluate if projects/work demonstrate capability for this specific role.
4. **Keyword Optimization (15% weight)**: Check ATS-critical keywords from the job description.

=== SCORING RULES ===
- Be REALISTIC — a fresh graduate applying for a senior role should score 15-30.
- Exact skill matches score higher than transferable/related skills.
- Industry experience matters — same industry gets bonus points.
- Consider skill synonyms: "React" = "React.js" = "ReactJS", "ML" = "Machine Learning".
- Don't inflate scores to be nice. Honest assessment helps candidates improve.

=== VERDICT CRITERIA ===
- "Strong Match" (75-100): Meets 80%+ of requirements, relevant experience, strong project alignment
- "Moderate Match" (45-74): Meets 50-79% of requirements, some transferable skills, partial experience fit
- "Weak Match" (0-44): Meets <50% of requirements, significant skill gaps, experience mismatch

Return ONLY a valid JSON object (no markdown fences, no commentary):
{{
  "match_score": <integer 0-100>,
  "verdict": "<exactly one of: Strong Match, Moderate Match, Weak Match>",
  "verdict_summary": "<3 sentences: 1) Overall assessment 2) Key strength 3) Biggest gap>",
  "matched_skills": ["<skill from resume that matches job requirement>", "..."],
  "missing_skills": ["<required skill NOT found in resume>", "..."],
  "experience_fit": {{
    "score": <integer 0-100>,
    "summary": "<2 sentences: years match, domain relevance, seniority alignment>"
  }},
  "keyword_match": {{
    "found": ["<ATS keyword from job desc found in resume>", "..."],
    "missing": ["<critical ATS keyword NOT in resume>", "..."]
  }},
  "strengths": ["<specific strength relevant to THIS job>", "<another>", "<another>"],
  "improvements": ["<actionable: what to add/learn/highlight for THIS specific role>", "<another>", "<another>"],
  "ats_tips": ["<specific tip to optimize resume for THIS job's ATS>", "<another>", "<another>"]
}}"""

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

        text_prompt = f"""=== CANDIDATE RESUME ===
{resume_text[:8000]}

{prompt}"""

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
