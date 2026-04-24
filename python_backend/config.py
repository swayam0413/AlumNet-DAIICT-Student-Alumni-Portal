"""
AlumConnect Python Backend - Centralized Configuration
"""
import os
from dotenv import load_dotenv

# Load .env from project root (one level up)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# --- AI ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemma-3-27b-it"

# --- Firebase ---
FIREBASE_API_KEY = "AIzaSyCL6eB6KyzJEKN4-fxWMO2ZFDFJvScI5gI"

# --- SMTP (Email Notifications) ---
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

# --- Server ---
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PYTHON_PORT", "8000"))
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
