from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import io
import json
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Models ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ResumeData(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    linkedin: Optional[str] = ""
    professional_summary: Optional[str] = ""
    technical_skills: List[str] = []
    experiences: List[dict] = []
    projects: List[dict] = []
    education: List[dict] = []

class ResumeCreate(BaseModel):
    title: str
    raw_text: str
    parsed_data: Optional[ResumeData] = None

class ResumeUpdate(BaseModel):
    title: Optional[str] = None
    raw_text: Optional[str] = None
    parsed_data: Optional[ResumeData] = None

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    title: str
    raw_text: str
    parsed_data: Optional[dict] = None
    created_at: str
    updated_at: str

class ParseRequest(BaseModel):
    text: str

# ==================== Auth Helpers ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== Auth Routes ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# ==================== Parse Routes ====================

@api_router.post("/parse/simple")
async def parse_simple(request: ParseRequest):
    """Simple regex-based resume parsing"""
    text = request.text
    
    # Extract email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else ""
    
    # Extract LinkedIn
    linkedin_match = re.search(r'(?:linkedin\.com/in/|linkedin:?\s*)([^\s,\n]+)', text, re.IGNORECASE)
    linkedin = linkedin_match.group(0) if linkedin_match else ""
    
    # Extract name (first line or first capitalized words)
    lines = text.strip().split('\n')
    name = lines[0].strip() if lines else ""
    
    # Extract sections based on common headers
    sections = {
        "professional_summary": "",
        "technical_skills": [],
        "experiences": [],
        "projects": [],
        "education": []
    }
    
    current_section = None
    section_content = []
    
    section_keywords = {
        "summary": "professional_summary",
        "professional summary": "professional_summary",
        "about": "professional_summary",
        "profile": "professional_summary",
        "objective": "professional_summary",
        "skills": "technical_skills",
        "technical skills": "technical_skills",
        "technologies": "technical_skills",
        "experience": "experiences",
        "work experience": "experiences",
        "employment": "experiences",
        "project": "projects",
        "projects": "projects",
        "education": "education",
        "academic": "education",
        "qualification": "education"
    }
    
    for line in lines[1:]:
        line_lower = line.lower().strip()
        line_clean = re.sub(r'[:\-]', '', line_lower).strip()
        
        # Check if this is a section header
        matched_section = None
        for keyword, section in section_keywords.items():
            if keyword in line_clean and len(line_clean) < 50:
                matched_section = section
                break
        
        if matched_section:
            # Save previous section
            if current_section and section_content:
                if current_section == "professional_summary":
                    sections[current_section] = '\n'.join(section_content)
                elif current_section == "technical_skills":
                    # Parse skills as comma/bullet separated
                    all_skills = '\n'.join(section_content)
                    skills = re.split(r'[,\n•\-\|]', all_skills)
                    sections[current_section] = [s.strip() for s in skills if s.strip()]
                elif current_section in ["experiences", "projects", "education"]:
                    # Group by bullet points
                    items = []
                    current_item = {"title": "", "description": "", "bullets": []}
                    for content_line in section_content:
                        if content_line.startswith(('•', '-', '*')) or re.match(r'^\d+\.', content_line):
                            bullet = re.sub(r'^[•\-\*\d+\.]\s*', '', content_line)
                            current_item["bullets"].append(bullet)
                        elif current_item["bullets"] or current_item["title"]:
                            if current_item["title"]:
                                items.append(current_item)
                            current_item = {"title": content_line, "description": "", "bullets": []}
                        else:
                            current_item["title"] = content_line
                    if current_item["title"] or current_item["bullets"]:
                        items.append(current_item)
                    sections[current_section] = items
            
            current_section = matched_section
            section_content = []
        elif current_section and line.strip():
            section_content.append(line.strip())
    
    # Save last section
    if current_section and section_content:
        if current_section == "professional_summary":
            sections[current_section] = '\n'.join(section_content)
        elif current_section == "technical_skills":
            all_skills = '\n'.join(section_content)
            skills = re.split(r'[,\n•\-\|]', all_skills)
            sections[current_section] = [s.strip() for s in skills if s.strip()]
        elif current_section in ["experiences", "projects", "education"]:
            items = []
            current_item = {"title": "", "description": "", "bullets": []}
            for content_line in section_content:
                if content_line.startswith(('•', '-', '*')) or re.match(r'^\d+\.', content_line):
                    bullet = re.sub(r'^[•\-\*\d+\.]\s*', '', content_line)
                    current_item["bullets"].append(bullet)
                elif current_item["bullets"] or current_item["title"]:
                    if current_item["title"]:
                        items.append(current_item)
                    current_item = {"title": content_line, "description": "", "bullets": []}
                else:
                    current_item["title"] = content_line
            if current_item["title"] or current_item["bullets"]:
                items.append(current_item)
            sections[current_section] = items
    
    return {
        "name": name,
        "email": email,
        "linkedin": linkedin,
        **sections
    }

@api_router.post("/parse/ai")
async def parse_ai(request: ParseRequest):
    """AI-powered resume parsing using GPT-5.2"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI parsing not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"resume-parse-{uuid.uuid4()}",
            system_message="""You are a professional resume parser. Extract structured data from resume text.
            Return ONLY valid JSON with this exact structure:
            {
                "name": "Full Name",
                "email": "email@example.com",
                "linkedin": "linkedin.com/in/profile",
                "professional_summary": "Summary text",
                "technical_skills": ["skill1", "skill2"],
                "experiences": [
                    {
                        "title": "Job Title at Company",
                        "company": "Company Name",
                        "from_date": "Start Date",
                        "to_date": "End Date",
                        "description": "Brief description",
                        "bullets": ["Achievement 1", "Achievement 2"]
                    }
                ],
                "projects": [
                    {
                        "title": "Project Name",
                        "description": "Project description",
                        "bullets": ["Feature 1", "Feature 2"]
                    }
                ],
                "education": [
                    {
                        "title": "Degree - Institution",
                        "institution": "Institution Name",
                        "from_date": "Start Date",
                        "to_date": "End Date",
                        "description": "Additional info"
                    }
                ]
            }
            Extract all information accurately. If something is not found, use empty string or empty array."""
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"Parse this resume and return JSON:\n\n{request.text}"
        )
        
        response = await chat.send_message(user_message)
        
        # Try to extract JSON from response
        try:
            # Remove markdown code blocks if present
            json_str = response
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0]
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0]
            
            parsed = json.loads(json_str.strip())
            return parsed
        except json.JSONDecodeError:
            # Return the raw response if JSON parsing fails
            logger.error(f"Failed to parse AI response as JSON: {response}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
            
    except Exception as e:
        logger.error(f"AI parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {str(e)}")

# ==================== Resume CRUD Routes ====================

@api_router.post("/resumes", response_model=ResumeResponse)
async def create_resume(resume_data: ResumeCreate, current_user: dict = Depends(get_current_user)):
    resume_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    resume_doc = {
        "id": resume_id,
        "user_id": current_user["id"],
        "title": resume_data.title,
        "raw_text": resume_data.raw_text,
        "parsed_data": resume_data.parsed_data.model_dump() if resume_data.parsed_data else None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.resumes.insert_one(resume_doc)
    
    return ResumeResponse(**{k: v for k, v in resume_doc.items() if k != "_id"})

@api_router.get("/resumes", response_model=List[ResumeResponse])
async def list_resumes(current_user: dict = Depends(get_current_user)):
    resumes = await db.resumes.find(
        {"user_id": current_user["id"]}, 
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    return [ResumeResponse(**r) for r in resumes]

@api_router.get("/resumes/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    resume = await db.resumes.find_one(
        {"id": resume_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeResponse(**resume)

@api_router.put("/resumes/{resume_id}", response_model=ResumeResponse)
async def update_resume(resume_id: str, resume_data: ResumeUpdate, current_user: dict = Depends(get_current_user)):
    resume = await db.resumes.find_one({"id": resume_id, "user_id": current_user["id"]})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    update_dict = {}
    if resume_data.title is not None:
        update_dict["title"] = resume_data.title
    if resume_data.raw_text is not None:
        update_dict["raw_text"] = resume_data.raw_text
    if resume_data.parsed_data is not None:
        update_dict["parsed_data"] = resume_data.parsed_data.model_dump()
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.resumes.update_one({"id": resume_id}, {"$set": update_dict})
    
    updated_resume = await db.resumes.find_one({"id": resume_id}, {"_id": 0})
    return ResumeResponse(**updated_resume)

@api_router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.resumes.delete_one({"id": resume_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"message": "Resume deleted successfully"}

# ==================== Download Routes ====================

@api_router.post("/download/pdf")
async def download_pdf(resume_data: ResumeData):
    """Generate PDF from parsed resume data"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    y = height - 0.75 * inch
    left_margin = 0.75 * inch
    
    def draw_text(text, x, y_pos, font="Helvetica", size=10, color=colors.black):
        c.setFont(font, size)
        c.setFillColor(color)
        c.drawString(x, y_pos, text)
        return y_pos
    
    def wrap_text(text, max_width, font, size):
        c.setFont(font, size)
        words = text.split()
        lines = []
        current_line = ""
        for word in words:
            test_line = f"{current_line} {word}".strip()
            if c.stringWidth(test_line, font, size) < max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        return lines
    
    # Name
    if resume_data.name:
        y = draw_text(resume_data.name, left_margin, y, "Helvetica-Bold", 18, colors.HexColor("#1E1B4B"))
        y -= 0.25 * inch
    
    # Contact Info
    contact_parts = []
    if resume_data.email:
        contact_parts.append(resume_data.email)
    if resume_data.linkedin:
        contact_parts.append(resume_data.linkedin)
    if contact_parts:
        y = draw_text(" | ".join(contact_parts), left_margin, y, "Helvetica", 10, colors.HexColor("#475569"))
        y -= 0.4 * inch
    
    # Professional Summary
    if resume_data.professional_summary:
        y = draw_text("PROFESSIONAL SUMMARY", left_margin, y, "Helvetica-Bold", 12, colors.HexColor("#1E1B4B"))
        y -= 0.2 * inch
        lines = wrap_text(resume_data.professional_summary, width - 1.5 * inch, "Helvetica", 10)
        for line in lines:
            y = draw_text(line, left_margin, y, "Helvetica", 10)
            y -= 0.18 * inch
        y -= 0.2 * inch
    
    # Technical Skills
    if resume_data.technical_skills:
        y = draw_text("TECHNICAL SKILLS", left_margin, y, "Helvetica-Bold", 12, colors.HexColor("#1E1B4B"))
        y -= 0.2 * inch
        skills_text = ", ".join(resume_data.technical_skills)
        lines = wrap_text(skills_text, width - 1.5 * inch, "Helvetica", 10)
        for line in lines:
            y = draw_text(line, left_margin, y, "Helvetica", 10)
            y -= 0.18 * inch
        y -= 0.2 * inch
    
    # Experience
    if resume_data.experiences:
        y = draw_text("EXPERIENCE", left_margin, y, "Helvetica-Bold", 12, colors.HexColor("#1E1B4B"))
        y -= 0.2 * inch
        for exp in resume_data.experiences:
            title = exp.get("title", "")
            company = exp.get("company", "")
            from_date = exp.get("from_date", "")
            to_date = exp.get("to_date", "")
            
            if title:
                y = draw_text(title, left_margin, y, "Helvetica-Bold", 11)
                y -= 0.18 * inch
            if company or from_date:
                date_str = f"{from_date} - {to_date}" if from_date else ""
                company_str = f"{company} | {date_str}" if company and date_str else company or date_str
                y = draw_text(company_str, left_margin, y, "Helvetica-Oblique", 10, colors.HexColor("#475569"))
                y -= 0.18 * inch
            
            for bullet in exp.get("bullets", []):
                lines = wrap_text(f"• {bullet}", width - 1.75 * inch, "Helvetica", 10)
                for line in lines:
                    y = draw_text(line, left_margin + 0.15 * inch, y, "Helvetica", 10)
                    y -= 0.16 * inch
            y -= 0.15 * inch
            
            if y < 1.5 * inch:
                c.showPage()
                y = height - 0.75 * inch
    
    # Projects
    if resume_data.projects:
        y = draw_text("PROJECTS", left_margin, y, "Helvetica-Bold", 12, colors.HexColor("#1E1B4B"))
        y -= 0.2 * inch
        for proj in resume_data.projects:
            title = proj.get("title", "")
            if title:
                y = draw_text(title, left_margin, y, "Helvetica-Bold", 11)
                y -= 0.18 * inch
            desc = proj.get("description", "")
            if desc:
                lines = wrap_text(desc, width - 1.5 * inch, "Helvetica", 10)
                for line in lines:
                    y = draw_text(line, left_margin, y, "Helvetica", 10)
                    y -= 0.16 * inch
            for bullet in proj.get("bullets", []):
                lines = wrap_text(f"• {bullet}", width - 1.75 * inch, "Helvetica", 10)
                for line in lines:
                    y = draw_text(line, left_margin + 0.15 * inch, y, "Helvetica", 10)
                    y -= 0.16 * inch
            y -= 0.15 * inch
            
            if y < 1.5 * inch:
                c.showPage()
                y = height - 0.75 * inch
    
    # Education
    if resume_data.education:
        y = draw_text("EDUCATION", left_margin, y, "Helvetica-Bold", 12, colors.HexColor("#1E1B4B"))
        y -= 0.2 * inch
        for edu in resume_data.education:
            title = edu.get("title", "")
            institution = edu.get("institution", "")
            from_date = edu.get("from_date", "")
            to_date = edu.get("to_date", "")
            
            if title:
                y = draw_text(title, left_margin, y, "Helvetica-Bold", 11)
                y -= 0.18 * inch
            if institution or from_date:
                date_str = f"{from_date} - {to_date}" if from_date else ""
                inst_str = f"{institution} | {date_str}" if institution and date_str else institution or date_str
                y = draw_text(inst_str, left_margin, y, "Helvetica-Oblique", 10, colors.HexColor("#475569"))
                y -= 0.18 * inch
            y -= 0.1 * inch
    
    c.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resume.pdf"}
    )

@api_router.post("/download/docx")
async def download_docx(resume_data: ResumeData):
    """Generate DOCX from parsed resume data"""
    doc = Document()
    
    # Set up styles
    style = doc.styles['Normal']
    style.font.name = 'Arial'
    style.font.size = Pt(10)
    
    # Name
    if resume_data.name:
        name_para = doc.add_paragraph()
        name_run = name_para.add_run(resume_data.name)
        name_run.bold = True
        name_run.font.size = Pt(18)
        name_run.font.color.rgb = RGBColor(30, 27, 75)
        name_para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    
    # Contact Info
    contact_parts = []
    if resume_data.email:
        contact_parts.append(resume_data.email)
    if resume_data.linkedin:
        contact_parts.append(resume_data.linkedin)
    if contact_parts:
        contact_para = doc.add_paragraph(" | ".join(contact_parts))
        contact_para.runs[0].font.color.rgb = RGBColor(71, 85, 105)
    
    # Professional Summary
    if resume_data.professional_summary:
        doc.add_paragraph()
        heading = doc.add_paragraph()
        heading_run = heading.add_run("PROFESSIONAL SUMMARY")
        heading_run.bold = True
        heading_run.font.size = Pt(12)
        heading_run.font.color.rgb = RGBColor(30, 27, 75)
        doc.add_paragraph(resume_data.professional_summary)
    
    # Technical Skills
    if resume_data.technical_skills:
        doc.add_paragraph()
        heading = doc.add_paragraph()
        heading_run = heading.add_run("TECHNICAL SKILLS")
        heading_run.bold = True
        heading_run.font.size = Pt(12)
        heading_run.font.color.rgb = RGBColor(30, 27, 75)
        doc.add_paragraph(", ".join(resume_data.technical_skills))
    
    # Experience
    if resume_data.experiences:
        doc.add_paragraph()
        heading = doc.add_paragraph()
        heading_run = heading.add_run("EXPERIENCE")
        heading_run.bold = True
        heading_run.font.size = Pt(12)
        heading_run.font.color.rgb = RGBColor(30, 27, 75)
        
        for exp in resume_data.experiences:
            if exp.get("title"):
                title_para = doc.add_paragraph()
                title_run = title_para.add_run(exp["title"])
                title_run.bold = True
                title_run.font.size = Pt(11)
            
            company = exp.get("company", "")
            from_date = exp.get("from_date", "")
            to_date = exp.get("to_date", "")
            if company or from_date:
                date_str = f"{from_date} - {to_date}" if from_date else ""
                company_str = f"{company} | {date_str}" if company and date_str else company or date_str
                company_para = doc.add_paragraph()
                company_run = company_para.add_run(company_str)
                company_run.italic = True
                company_run.font.color.rgb = RGBColor(71, 85, 105)
            
            for bullet in exp.get("bullets", []):
                bullet_para = doc.add_paragraph(f"• {bullet}")
                bullet_para.paragraph_format.left_indent = Inches(0.25)
    
    # Projects
    if resume_data.projects:
        doc.add_paragraph()
        heading = doc.add_paragraph()
        heading_run = heading.add_run("PROJECTS")
        heading_run.bold = True
        heading_run.font.size = Pt(12)
        heading_run.font.color.rgb = RGBColor(30, 27, 75)
        
        for proj in resume_data.projects:
            if proj.get("title"):
                title_para = doc.add_paragraph()
                title_run = title_para.add_run(proj["title"])
                title_run.bold = True
                title_run.font.size = Pt(11)
            
            if proj.get("description"):
                doc.add_paragraph(proj["description"])
            
            for bullet in proj.get("bullets", []):
                bullet_para = doc.add_paragraph(f"• {bullet}")
                bullet_para.paragraph_format.left_indent = Inches(0.25)
    
    # Education
    if resume_data.education:
        doc.add_paragraph()
        heading = doc.add_paragraph()
        heading_run = heading.add_run("EDUCATION")
        heading_run.bold = True
        heading_run.font.size = Pt(12)
        heading_run.font.color.rgb = RGBColor(30, 27, 75)
        
        for edu in resume_data.education:
            if edu.get("title"):
                title_para = doc.add_paragraph()
                title_run = title_para.add_run(edu["title"])
                title_run.bold = True
                title_run.font.size = Pt(11)
            
            institution = edu.get("institution", "")
            from_date = edu.get("from_date", "")
            to_date = edu.get("to_date", "")
            if institution or from_date:
                date_str = f"{from_date} - {to_date}" if from_date else ""
                inst_str = f"{institution} | {date_str}" if institution and date_str else institution or date_str
                inst_para = doc.add_paragraph()
                inst_run = inst_para.add_run(inst_str)
                inst_run.italic = True
                inst_run.font.color.rgb = RGBColor(71, 85, 105)
    
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=resume.docx"}
    )

# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "Resume Formatter API", "status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
