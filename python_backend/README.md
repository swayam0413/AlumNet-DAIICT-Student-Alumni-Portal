# AlumConnect Python Backend

Python FastAPI backend that mirrors all Express.js endpoints + adds ML recommendations and LangChain parsing.

## Setup

```bash
cd python_backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

Server starts at **http://localhost:8000**

## API Endpoints

### Existing (mirrored from Express)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/delete-stale-user` | Delete stale Firebase Auth user |
| POST | `/api/ai/parse-resume` | AI resume parsing (Gemma 3 27B) |
| POST | `/api/ai/career-advice` | AI career advice chatbot |
| POST | `/api/ai/generate-referral` | AI referral message generator |
| POST | `/api/ai/networking-radar` | AI networking insights |

### New (Python exclusive)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/recommend/alumni` | ML alumni recommendations (TF-IDF + Cosine Similarity) |
| POST | `/api/ml/resume/parse-langchain` | Advanced resume parsing (3-step LangChain pipeline) |
| POST | `/api/ml/resume/career-path` | AI career path suggestions |
| GET | `/api/health` | Health check |

## Architecture

```
python_backend/
├── main.py                    # FastAPI server + all route handlers
├── requirements.txt           # Python dependencies
├── README.md                  # This file
└── services/
    ├── __init__.py
    ├── recommendation.py      # TF-IDF + Cosine Similarity ML engine
    └── langchain_parser.py    # Multi-step resume parsing pipeline
```

## ML Recommendation Algorithm

1. **TF-IDF Vectorization** — Converts profiles (skills, role, company, department) into numerical vectors
2. **Cosine Similarity** — Measures profile similarity between user and all alumni
3. **Bonus Scoring** — Weighted bonuses for department match (+0.2), course match (+0.1), location match (+0.1), skill overlap (up to +0.3)
4. **Final Score** = 60% TF-IDF + 40% Bonus

## LangChain Resume Pipeline

3 sequential AI steps using Gemma 3 27B:
1. **Extract** — Pull all structured data (name, skills, education, experience)
2. **Analyze** — Generate summary, introduction, strengths, projects
3. **Score** — Rate resume quality across 5 dimensions (0-100)

## API Docs

Once running, visit **http://localhost:8000/docs** for interactive Swagger documentation.
