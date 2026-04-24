"""
Resume ↔ Job Match API - Python Backend
Uses PyPDF2 for PDF parsing and Gemma 3 27B via Google GenAI for analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import PyPDF2
import io
import base64
import json
import re
import os
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')


def extract_pdf_text(base64_data: str) -> str:
    """Extract text from base64-encoded PDF"""
    pdf_bytes = base64.b64decode(base64_data)
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()


def parse_json_response(text: str) -> dict:
    """Extract JSON from LLM response (handles markdown code blocks)"""
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if match:
        return json.loads(match.group(1).strip())
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return json.loads(match.group(0))
    return json.loads(text.strip())


@app.route('/api/match-resume', methods=['POST'])
def match_resume():
    try:
        data = request.get_json()
        file_data = data.get('fileData', '')
        job_title = data.get('jobTitle', '')
        job_company = data.get('jobCompany', '')
        job_description = data.get('jobDescription', '')
        job_requirements = data.get('jobRequirements', '')

        if not file_data:
            return jsonify({'error': 'No resume file provided'}), 400

        if not GEMINI_API_KEY:
            return jsonify({'error': 'GEMINI_API_KEY not configured in .env'}), 500

        # Step 1: Extract text from PDF
        resume_text = extract_pdf_text(file_data)

        if len(resume_text) < 50:
            return jsonify({'error': 'Could not extract text from PDF. Please upload a text-based PDF.'}), 400

        print(f"[PDF] Extracted resume text: {len(resume_text)} chars")

        # Step 2: Send to Gemma 3 27B
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer.

=== RESUME TEXT ===
{resume_text[:6000]}

=== JOB DESCRIPTION ===
Job Title: {job_title}
Company: {job_company}
Description: {job_description or 'Not provided'}
Requirements: {job_requirements or 'Not provided'}

Compare the resume against the job description. Return ONLY valid JSON (no markdown, no extra text):
{{
  "match_score": 75,
  "verdict": "Strong Match",
  "verdict_summary": "1-2 sentence summary",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "experience_fit": {{"score": 80, "summary": "1 sentence"}},
  "keyword_match": {{"found": ["kw1"], "missing": ["kw2"]}},
  "strengths": ["strength1", "strength2"],
  "improvements": ["suggestion1", "suggestion2"],
  "ats_tips": ["tip1", "tip2"]
}}

verdict must be exactly one of: "Strong Match", "Moderate Match", "Weak Match"
match_score: 0-100, be realistic not inflated"""

        response = client.models.generate_content(
            model='gemma-3-27b-it',
            contents=prompt
        )
        response_text = response.text or ''

        print(f"[AI] Response length: {len(response_text)} chars")

        if not response_text.strip():
            return jsonify({'error': 'AI returned empty response. Please try again.'}), 500

        result = parse_json_response(response_text)
        print(f"[OK] Resume match score: {result.get('match_score', 'N/A')}")

        return jsonify(result)

    except json.JSONDecodeError as e:
        print(f"[ERR] JSON parse error: {e}")
        return jsonify({'error': 'AI returned invalid format. Please try again.'}), 500
    except Exception as e:
        print(f"[ERR] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'gemma-3-27b-it'})


if __name__ == '__main__':
    print("[START] Python Resume Match Backend starting on port 5000...")
    print(f"[KEY] API Key configured: {'Yes' if GEMINI_API_KEY else 'No'}")
    app.run(host='0.0.0.0', port=5000, debug=False)
