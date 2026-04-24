"""
JSON extraction utilities for LLM responses.
"""
import re
import json


def extract_json(text: str):
    """Extract JSON from LLM response (handles ```json blocks and raw JSON)."""
    # Try fenced code block first
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        return json.loads(match.group(1).strip())
    # Try raw JSON object
    obj_match = re.search(r"\{[\s\S]*\}", text)
    if obj_match:
        return json.loads(obj_match.group(0))
    # Try raw JSON array
    arr_match = re.search(r"\[[\s\S]*\]", text)
    if arr_match:
        return json.loads(arr_match.group(0))
    # Last resort: try parsing as-is
    return json.loads(text.strip())


def extract_json_array(text: str) -> list:
    """Extract a JSON array from LLM response."""
    try:
        result = extract_json(text)
        if isinstance(result, list):
            return result
        return [result]
    except json.JSONDecodeError:
        array_match = re.search(r"\[[\s\S]*\]", text)
        if array_match:
            return json.loads(array_match.group(0))
        return []
