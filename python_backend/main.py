"""
AlumConnect Python Backend - Entry Point
Run: python main.py
"""
import logging
from app import create_app
from config import HOST, PORT

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
