"""
ML-based Alumni Recommendation Engine
Uses TF-IDF + Cosine Similarity for skill-based matching
+ weighted scoring for department, interests, and location
"""

import os
import json
import logging
from typing import List, Dict, Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger("alumconnect.recommendations")


def build_profile_text(profile: dict) -> str:
    """Convert a user profile into a searchable text representation."""
    parts = []

    if profile.get("skills"):
        skills = profile["skills"] if isinstance(profile["skills"], list) else [profile["skills"]]
        parts.append(f"skills: {' '.join(skills)}")

    if profile.get("department"):
        parts.append(f"department: {profile['department']}")

    if profile.get("specialization"):
        parts.append(f"specialization: {profile['specialization']}")

    if profile.get("job_role"):
        parts.append(f"role: {profile['job_role']}")

    if profile.get("company"):
        parts.append(f"company: {profile['company']}")

    if profile.get("course"):
        parts.append(f"course: {profile['course']}")

    if profile.get("location"):
        parts.append(f"location: {profile['location']}")

    if profile.get("ai_introduction"):
        parts.append(profile["ai_introduction"])

    return " ".join(parts) if parts else "general"


def compute_bonus_score(user: dict, candidate: dict) -> float:
    """Compute weighted bonus score beyond TF-IDF similarity."""
    bonus = 0.0

    # Department match: +0.2
    if user.get("department") and candidate.get("department"):
        if user["department"].lower() == candidate["department"].lower():
            bonus += 0.2

    # Course match: +0.1
    if user.get("course") and candidate.get("course"):
        if user["course"].lower() == candidate["course"].lower():
            bonus += 0.1

    # Location match: +0.1
    if user.get("location") and candidate.get("location"):
        if user["location"].lower() == candidate["location"].lower():
            bonus += 0.1

    # Skill overlap: up to +0.3
    user_skills = set(s.lower() for s in (user.get("skills") or []))
    cand_skills = set(s.lower() for s in (candidate.get("skills") or []))
    if user_skills and cand_skills:
        overlap = len(user_skills & cand_skills)
        total = len(user_skills | cand_skills)
        if total > 0:
            bonus += 0.3 * (overlap / total)

    return bonus


async def get_alumni_recommendations(
    user_profile: dict,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Get top-K alumni recommendations for a given user profile.
    
    Uses:
    1. TF-IDF vectorization of profile text (skills, role, company, etc.)
    2. Cosine similarity for initial ranking
    3. Bonus scoring for department, course, location, skill overlap
    """

    # In production, this would fetch from Firebase
    # For now, we'll use the Firebase Admin SDK or accept profiles as input
    try:
        alumni_profiles = await _fetch_alumni_from_firebase()
    except Exception as e:
        logger.warning(f"Could not fetch alumni from Firebase: {e}")
        alumni_profiles = []

    if not alumni_profiles:
        return [{
            "id": "no-data",
            "name": "No alumni found",
            "match_score": 0,
            "match_reasons": ["Add more alumni to the platform to get recommendations"],
            "skills": [],
        }]

    # Filter out the requesting user
    user_email = user_profile.get("email", "")
    candidates = [p for p in alumni_profiles if p.get("email") != user_email]

    if not candidates:
        return []

    # Build text representations
    user_text = build_profile_text(user_profile)
    candidate_texts = [build_profile_text(c) for c in candidates]

    # TF-IDF + Cosine Similarity
    all_texts = [user_text] + candidate_texts
    vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
    tfidf_matrix = vectorizer.fit_transform(all_texts)

    # Similarity between user (index 0) and all candidates
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    # Add bonus scores
    final_scores = []
    for i, candidate in enumerate(candidates):
        tfidf_score = float(similarities[i])
        bonus = compute_bonus_score(user_profile, candidate)
        # Weighted: 60% TF-IDF, 40% bonus
        combined = 0.6 * tfidf_score + 0.4 * bonus
        final_scores.append((i, combined, tfidf_score, bonus))

    # Sort by combined score
    final_scores.sort(key=lambda x: x[1], reverse=True)

    # Build results
    results = []
    for idx, combined, tfidf, bonus in final_scores[:top_k]:
        candidate = candidates[idx]
        match_percent = min(round(combined * 100), 99)

        # Generate match reasons
        reasons = []
        user_skills = set(s.lower() for s in (user_profile.get("skills") or []))
        cand_skills = set(s.lower() for s in (candidate.get("skills") or []))
        shared = user_skills & cand_skills
        if shared:
            reasons.append(f"Shared skills: {', '.join(list(shared)[:3])}")

        if user_profile.get("department") == candidate.get("department"):
            reasons.append(f"Same department: {candidate.get('department')}")

        if candidate.get("company"):
            reasons.append(f"Works at {candidate['company']}")

        if candidate.get("job_role"):
            reasons.append(f"Role: {candidate['job_role']}")

        if not reasons:
            reasons.append("DA-IICT alumni network member")

        results.append({
            "id": candidate.get("id", f"user-{idx}"),
            "name": candidate.get("name", "Alumni"),
            "email": candidate.get("email", ""),
            "role": candidate.get("role", "alumni"),
            "job_role": candidate.get("job_role", ""),
            "company": candidate.get("company", ""),
            "department": candidate.get("department", ""),
            "skills": candidate.get("skills", []),
            "location": candidate.get("location", ""),
            "profile_image": candidate.get("profile_image", ""),
            "match_score": match_percent,
            "match_reasons": reasons,
        })

    return results


async def _fetch_alumni_from_firebase() -> List[dict]:
    """Fetch alumni profiles from Firebase Firestore."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        # Initialize Firebase Admin if not already done
        if not firebase_admin._apps:
            firebase_admin.initialize_app(options={
                "projectId": "ai-studio-applet-webapp-e411e",
            })

        db = firestore.client(database_id="ai-studio-2ecdea86-e0d5-4ce5-9b99-0b199d5a3c73")
        users_ref = db.collection("users")
        docs = users_ref.stream()

        profiles = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            profiles.append(data)

        return profiles

    except Exception as e:
        logger.error(f"Firebase fetch error: {e}")
        return []
