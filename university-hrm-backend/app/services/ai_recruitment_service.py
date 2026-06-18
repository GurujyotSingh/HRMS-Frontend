import os
import json
import logging
from PyPDF2 import PdfReader
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger(__name__)

async def analyze_candidate_resume(resume_url: str, job_title: str, job_description: str, job_requirements: list[str]) -> dict:
    """Extracts text from a local resume and calls Groq to generate a structured analysis."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured.")
        
    if not resume_url or not resume_url.startswith("/static/resumes/"):
        raise ValueError("Invalid resume URL format or missing resume.")
        
    filename = resume_url.replace("/static/resumes/", "")
    file_path = os.path.join("app", "static", "resumes", filename)
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Resume file not found at {file_path}")
        
    # Extract text from PDF
    try:
        reader = PdfReader(file_path)
        resume_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"
    except Exception as e:
        logger.error(f"Failed to read PDF {file_path}: {e}")
        raise ValueError(f"Failed to extract text from resume: {str(e)}")
        
    if not resume_text.strip():
        raise ValueError("Resume appears to be empty or could not be parsed.")
        
    # Call Groq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    requirements_str = "\n".join(f"- {req}" for req in (job_requirements or []))
    
    prompt = f"""
    You are an expert HR Recruitment AI at a university. Analyze the following candidate document.
    First, thoroughly evaluate the text to determine if it is a valid Resume or Curriculum Vitae (CV). If it appears to be a random project file, code snippet, assignment, or entirely unrelated document, you MUST set "is_valid_resume" to false.
    
    Job Title: {job_title}
    Job Description: {job_description}
    Requirements:
    {requirements_str}
    
    Candidate Document Text:
    {resume_text[:4000]}  # limit text to prevent token overflow
    
    Return the output STRICTLY as a JSON object with exactly the following keys:
    - "is_valid_resume": A boolean (true/false) indicating if this document is actually a resume/CV.
    - "match_score": An integer from 0 to 100 representing how well the candidate fits (0 if invalid).
    - "recommendation": A short string (e.g., "Strong Match", "Potential Fit", "Not Recommended").
    - "strengths": A list of strings detailing key matched skills or experiences.
    - "missing_skills": A list of strings detailing missing required skills.
    - "experience_assessment": A short paragraph summarizing their experience. IMPORTANT: If the document is NOT a valid resume, use this field to explicitly describe WHAT the document actually appears to be (e.g., "This document appears to be technical project documentation for an HRMS system rather than a candidate's resume.").
    """
    
    try:
        completion = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an API that strictly returns valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1024
        )
        
        result_text = completion.choices[0].message.content.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        result = json.loads(result_text.strip())
        
        is_valid = result.get("is_valid_resume", True)
        if isinstance(is_valid, str):
            is_valid = is_valid.lower() == "true"
            
        if not is_valid:
            result["match_score"] = 0
            result["recommendation"] = "INVALID DOCUMENT"
            result["strengths"] = []
            result["missing_skills"] = []
            if not result.get("experience_assessment"):
                result["experience_assessment"] = "WARNING: The uploaded file does not appear to be a valid Resume or CV."
            
        return result
        
    except Exception as e:
        logger.error(f"Groq API Error during resume analysis: {e}")
        raise ValueError(f"AI analysis failed: {str(e)}")


async def generate_interview_questions(resume_url: str, job_title: str, job_description: str) -> list[str]:
    """Generates specific interview questions based on the candidate's resume and job requirements."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured.")
        
    filename = resume_url.replace("/static/resumes/", "")
    file_path = os.path.join("app", "static", "resumes", filename)
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Resume file not found at {file_path}")
        
    try:
        reader = PdfReader(file_path)
        resume_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"
    except Exception as e:
        raise ValueError(f"Failed to extract text from resume: {str(e)}")
        
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    prompt = f"""
    You are an expert HR Interviewer at a university. Create 5 specific, tailored interview questions for this candidate based on their document and the job they applied for.
    First, evaluate the text to ensure it is actually a valid Resume or CV. If it is a project file, codebase, or unrelated document, set "is_valid_resume" to false.
    
    Job Title: {job_title}
    Job Description: {job_description}
    
    Candidate Document Text:
    {resume_text[:4000]}
    
    Focus the questions on their specific past experience, projects, or gaps in their resume relative to the job.
    Return the output STRICTLY as a JSON object with exactly the following keys:
    - "is_valid_resume": A boolean (true/false) indicating if this document is actually a resume/CV.
    - "questions": A list of 5 string questions. IMPORTANT: If the document is NOT a valid resume, put a single string in this list explaining what the document actually is.
    """
    
    try:
        completion = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an API that strictly returns valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.5,
            max_tokens=800
        )
        
        result_text = completion.choices[0].message.content.strip()
        result_json = json.loads(result_text.strip())
        
        is_valid = result_json.get("is_valid_resume", True)
        if isinstance(is_valid, str):
            is_valid = is_valid.lower() == "true"
            
        questions = result_json.get("questions", [])
        
        if not is_valid:
            if not questions or len(questions) == 0:
                return ["WARNING: The uploaded document does not appear to be a valid Resume or CV. Unable to generate tailored interview questions."]
            return questions
            
        return questions
        
    except Exception as e:
        logger.error(f"Groq API Error during question generation: {e}")
        raise ValueError(f"AI generation failed: {str(e)}")
