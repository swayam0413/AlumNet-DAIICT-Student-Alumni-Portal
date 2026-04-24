"""Career advice service."""
from utils.gemini_client import gemini


async def get_career_advice(query: str, context: str = "") -> str:
    """Get AI-powered career advice."""
    prompt = f"""You are a career advisor for DA-IICT alumni and students.
Here is some context about the alumni network: {context}

User question: {query}

Provide helpful, actionable career advice. Keep your response concise and well-structured."""

    return await gemini.generate(prompt)
