"""
PDF text extraction utilities.
"""
import io
import base64
import PyPDF2


def extract_pdf_text(base64_data: str) -> str:
    """Extract text from a base64-encoded PDF file."""
    pdf_bytes = base64.b64decode(base64_data)
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()
