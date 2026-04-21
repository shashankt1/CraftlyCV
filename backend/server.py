"""
CraftlyCV Backend - FastAPI Application
Career Operating System Backend
"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from enum import Enum
import os
import logging
import uuid
import json
import hashlib
import hmac
import httpx
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB Connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'craftlycv')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# FastAPI App
app = FastAPI(
    title="CraftlyCV API",
    description="Career Operating System - AI Resume Builder, Interview Simulator, Jobs & Income Hub",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://craftlycv.in,http://localhost:3000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Enums ─────────────────────────────────────────────────────────────────────

class InterviewType(str, Enum):
    HR = "hr"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"

class UserPlan(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    version: str

class ATSAnalysisRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None
    user_id: str

class ATSAnalysisResponse(BaseModel):
    score: int
    detected_field: str
    experience_years: int
    strength_statement: str
    real_world_context: str
    summary: str
    projected_score: int
    score_percentile: int
    keyword_matches: List[str]
    missing_keywords: List[str]
    strengths: List[str]
    improvements: List[str]
    opportunities: List[Dict[str, Any]]

class InterviewQuestionRequest(BaseModel):
    resume_text: str
    job_title: str
    job_description: Optional[str] = None
    interview_type: InterviewType = InterviewType.TECHNICAL
    count: int = 10

class InterviewQuestionResponse(BaseModel):
    questions: List[Dict[str, Any]]

class MockInterviewStartRequest(BaseModel):
    resume_text: str
    job_title: str
    job_description: Optional[str] = None
    interview_type: InterviewType = InterviewType.TECHNICAL
    user_id: str

class MockInterviewMessage(BaseModel):
    role: str
    content: str

class MockInterviewContinueRequest(BaseModel):
    session_id: str
    answer: str
    history: List[MockInterviewMessage]
    job_title: str
    question_count: int

class MockInterviewResponse(BaseModel):
    feedback: str
    score: int
    next_question: str
    star_feedback: Optional[Dict[str, Any]] = None

class ResumeTailorRequest(BaseModel):
    resume_text: str
    job_description: str
    user_id: str

class ResumeTailorResponse(BaseModel):
    tailored_resume: str
    docx_base64: str
    pdf_html_base64: str
    match_score: int
    improvements: List[str]

class IncomePathRequest(BaseModel):
    skills: List[str]
    experience_years: int
    time_per_week: int
    income_goal: str
    country: str = "india"

class IncomePathResponse(BaseModel):
    primary_path: Dict[str, Any]
    alternative_paths: List[Dict[str, Any]]

class JobSearchRequest(BaseModel):
    query: str
    location: Optional[str] = None
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None

class LocationDetectResponse(BaseModel):
    country: str
    currency: str
    language: str
    region: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    email: str
    username: Optional[str] = None
    scans: int
    plan: UserPlan
    referral_code: str
    resume_updated_at: Optional[datetime] = None
    created_at: datetime

class PaymentCreateRequest(BaseModel):
    amount: int
    user_id: str
    plan_id: str
    currency: str = "INR"

class PaymentCreateResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str

class ScanUpdateRequest(BaseModel):
    user_id: str
    scans_delta: int

# ─── Database Models ────────────────────────────────────────────────────────────

class InterviewSession(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    job_title: str
    interview_type: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    messages: List[Dict[str, Any]] = []
    scores: List[int] = []
    status: str = "active"  # active, completed, abandoned

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    payment_id: str
    order_id: str
    plan_id: str
    scans_added: int
    amount: int
    currency: str
    status: str  # pending, completed, failed, refunded
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScanLog(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action_type: str
    scans_used: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ─── AI Service (Placeholder - will use Gemini via HTTP) ──────────────────────

class AIService:
    """AI Service for resume analysis and interview simulation"""

    @staticmethod
    async def analyze_resume(resume_text: str, job_description: Optional[str] = None) -> Dict[str, Any]:
        """Analyze resume and return ATS score with improvements"""
        # This will be handled by the AI model
        # For now, return structure that frontend expects
        return {
            "score": 75,
            "detected_field": "Software Engineering",
            "experience_years": 3,
            "strength_statement": "Strong technical background with hands-on project experience",
            "real_world_context": "Your resume shows solid fundamentals. At your experience level, you're competitive for mid-level positions at product companies and top startups.",
            "summary": "Your resume demonstrates relevant skills. Key areas for improvement include quantifiable achievements and keyword alignment with target roles.",
            "projected_score": 89,
            "score_percentile": 68,
            "keyword_matches": ["Python", "JavaScript", "React", "SQL", "Git"],
            "missing_keywords": ["AWS", "Docker", "CI/CD", "REST API", "Agile"],
            "strengths": [
                "Clean technical skill presentation",
                "Relevant project experience",
                "Good educational background"
            ],
            "improvements": [
                "Add quantified metrics to achievements",
                "Include more ATS keywords from job descriptions",
                "Expand on impact and results"
            ],
            "opportunities": []
        }

    @staticmethod
    async def generate_interview_questions(
        resume_text: str,
        job_title: str,
        interview_type: str = "technical",
        count: int = 10
    ) -> List[Dict[str, Any]]:
        """Generate interview questions based on resume and job"""
        return [
            {
                "question": f"Tell me about your experience with {job_title} projects",
                "category": "technical",
                "difficulty": "medium",
                "ideal_answer": "I worked on 3 major projects using React and Node.js..."
            }
        ]

    @staticmethod
    async def mock_interview_feedback(
        question: str,
        answer: str,
        history: List[Dict[str, str]],
        job_title: str
    ) -> Dict[str, Any]:
        """Generate feedback for mock interview answer"""
        return {
            "feedback": "Good start. Try to be more specific about your role and impact.",
            "score": 7,
            "next_question": "Can you give a specific example of a technical challenge you faced and how you solved it?",
            "star_feedback": {
                "situation": "Described working on a React project",
                "task": "Frontend development lead",
                "action": "Built reusable components, implemented state management",
                "result": "Reduced load time by 40%",
                "overall_star_score": 72
            }
        }

# ─── API Routers ───────────────────────────────────────────────────────────────

# Create API router with prefix
api_router = APIRouter(prefix="/api")

# ─── Health Check ──────────────────────────────────────────────────────────────

@api_router.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
        version="2.0.0"
    )

@api_router.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "CraftlyCV API - Career Operating System",
        "version": "2.0.0",
        "docs": "/docs"
    }

# ─── AI Endpoints ──────────────────────────────────────────────────────────────

@api_router.post("/ai/analyze", response_model=ATSAnalysisResponse, tags=["AI"])
async def analyze_resume(request: ATSAnalysisRequest):
    """
    Analyze a resume and return ATS score with detailed feedback.
    """
    try:
        result = await AIService.analyze_resume(
            request.resume_text,
            request.job_description
        )
        return result
    except Exception as e:
        logger.error(f"Resume analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/interview-questions", response_model=InterviewQuestionResponse, tags=["AI"])
async def generate_interview_questions(request: InterviewQuestionRequest):
    """
    Generate personalized interview questions based on resume and job role.
    """
    try:
        questions = await AIService.generate_interview_questions(
            request.resume_text,
            request.job_title,
            request.interview_type,
            request.count
        )
        return InterviewQuestionResponse(questions=questions)
    except Exception as e:
        logger.error(f"Interview questions generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/mock-interview/start", tags=["AI"])
async def mock_interview_start(request: MockInterviewStartRequest):
    """
    Start a mock interview session.
    """
    try:
        session_id = str(uuid.uuid4())

        # Create session in database
        session = InterviewSession(
            id=session_id,
            user_id=request.user_id,
            job_title=request.job_title,
            interview_type=request.interview_type.value
        )

        await db.interview_sessions.insert_one(session.model_dump())

        # Generate first question
        first_question = await AIService.mock_interview_feedback(
            question="",
            answer="",
            history=[],
            job_title=request.job_title
        )

        return {
            "session_id": session_id,
            "first_question": "Hello! I'm your AI interviewer today. I'll be asking you questions related to the " + request.job_title + " role. Let's start with something fundamental - can you tell me about your most relevant experience for this position?",
            "interview_type": request.interview_type.value,
            "job_title": request.job_title
        }
    except Exception as e:
        logger.error(f"Mock interview start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/mock-interview/continue", response_model=MockInterviewResponse, tags=["AI"])
async def mock_interview_continue(request: MockInterviewContinueRequest):
    """
    Continue a mock interview session with user's answer.
    """
    try:
        result = await AIService.mock_interview_feedback(
            question="",
            answer=request.answer,
            history=[m.model_dump() for m in request.history],
            job_title=request.job_title
        )
        return MockInterviewResponse(**result)
    except Exception as e:
        logger.error(f"Mock interview continue error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/tailor", response_model=ResumeTailorResponse, tags=["AI"])
async def tailor_resume(request: ResumeTailorRequest):
    """
    Tailor a resume to match a job description.
    """
    try:
        # Placeholder response - in production this calls Gemini API
        return ResumeTailorResponse(
            tailored_resume="[AI tailored resume text would appear here]",
            docx_base64="",
            pdf_html_base64="",
            match_score=87,
            improvements=[
                "Added AWS and Docker keywords",
                "Restructured experience bullets for impact",
                "Added quantified achievements"
            ]
        )
    except Exception as e:
        logger.error(f"Resume tailoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/improve", tags=["AI"])
async def improve_resume(resume_text: str, focus_area: str = "general"):
    """
    Get AI suggestions to improve specific parts of resume.
    """
    try:
        return {
            "suggestions": [
                {
                    "area": "achievements",
                    "suggestion": "Add specific metrics and numbers to your achievements",
                    "example": "Instead of 'Improved performance', use 'Improved API response time by 40% (from 200ms to 120ms)'"
                }
            ]
        }
    except Exception as e:
        logger.error(f"Resume improve error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/roadmap", tags=["AI"])
async def generate_career_roadmap(
    current_role: str,
    target_role: str,
    timeline_months: int = 6
):
    """
    Generate a career roadmap from current role to target role.
    """
    try:
        return {
            "roadmap": [
                {"month": 1, "focus": "Skill assessment and gap analysis"},
                {"month": 2, "focus": "Learn required technologies"},
                {"month": 3, "focus": "Build portfolio projects"},
                {"month": 4, "focus": "Practice interview questions"},
                {"month": 5, "focus": "Start applying and networking"},
                {"month": 6, "focus": "Interview and negotiate offers"}
            ],
            "resources": [
                {"type": "course", "name": "Advanced React Patterns", "url": "https://udemy.com/course/react-advanced"},
                {"type": "project", "name": "Build a Full-stack App", "url": "https://freecodecamp.org"}
            ]
        }
    except Exception as e:
        logger.error(f"Career roadmap error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/linkedin", tags=["AI"])
async def optimize_linkedin(profile_text: str):
    """
    Optimize LinkedIn profile for better visibility.
    """
    try:
        return {
            "headline": "[Optimized headline with keywords and value proposition]",
            "summary": "[AI-optimized summary in first-person perspective]",
            "suggestions": [
                "Add more quantifiable achievements",
                "Include industry-specific keywords",
                "Use power words in descriptions"
            ]
        }
    except Exception as e:
        logger.error(f"LinkedIn optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Income Endpoints ──────────────────────────────────────────────────────────

@api_router.post("/income/paths", response_model=IncomePathResponse, tags=["Income"])
async def get_income_paths(request: IncomePathRequest):
    """
    Get personalized income path recommendations.
    """
    try:
        # Define income paths
        freelance = {
            "type": "freelance",
            "title": "Freelance Tech",
            "subtitle": "Upwork · Fiverr",
            "color": "#60a5fa",
            "min_investment": "₹0",
            "time_to_first_money": "3-7 days",
            "monthly_potential": "₹5K - 2L+",
            "difficulty": "Medium",
            "platforms": ["Upwork", "Fiverr", "Toptal"]
        }

        ai_training = {
            "type": "ai_training",
            "title": "AI Data Training",
            "subtitle": "Outlier · Scale AI",
            "color": "#34d399",
            "min_investment": "₹0",
            "time_to_first_money": "1-3 days",
            "monthly_potential": "₹10K - 45K",
            "difficulty": "Easy",
            "platforms": ["Outlier.ai", "Scale AI", "Remotasks"]
        }

        tutoring = {
            "type": "tutoring",
            "title": "Online Tutoring",
            "subtitle": "Preply · Wyzant",
            "color": "#a78bfa",
            "min_investment": "₹0",
            "time_to_first_money": "1-7 days",
            "monthly_potential": "₹5K - 80K",
            "difficulty": "Easy",
            "platforms": ["Preply", "Wyzant", "Vedantu"]
        }

        youtube = {
            "type": "youtube",
            "title": "YouTube Automation",
            "subtitle": "Content · Faceless",
            "color": "#f87171",
            "min_investment": "₹500/mo",
            "time_to_first_money": "30-60 days",
            "monthly_potential": "₹10K - 5L+",
            "difficulty": "Medium",
            "platforms": ["YouTube", "TikTok", "Instagram Reels"]
        }

        return IncomePathResponse(
            primary_path=freelance,
            alternative_paths=[ai_training, tutoring, youtube]
        )
    except Exception as e:
        logger.error(f"Income paths error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/income/paths", tags=["Income"])
async def list_income_paths():
    """
    List all available income paths.
    """
    return {
        "paths": [
            {
                "id": "freelance",
                "icon": "💻",
                "title": "Freelance Tech",
                "subtitle": "Upwork · Fiverr · Toptal",
                "min_investment": "₹0",
                "time_to_first_money": "3-7 days",
                "monthly_potential": "₹5K - 2L+",
                "difficulty": "Medium"
            },
            {
                "id": "ai_training",
                "icon": "🤖",
                "title": "AI Data Training",
                "subtitle": "Outlier · Scale AI",
                "min_investment": "₹0",
                "time_to_first_money": "1-3 days",
                "monthly_potential": "₹10K - 45K",
                "difficulty": "Easy"
            },
            {
                "id": "tutoring",
                "icon": "📚",
                "title": "Online Tutoring",
                "subtitle": "Preply · Wyzant",
                "min_investment": "₹0",
                "time_to_first_money": "1-7 days",
                "monthly_potential": "₹5K - 80K",
                "difficulty": "Easy"
            },
            {
                "id": "youtube",
                "icon": "🎥",
                "title": "YouTube Automation",
                "subtitle": "Faceless Channel",
                "min_investment": "₹500/mo",
                "time_to_first_money": "30-60 days",
                "monthly_potential": "₹10K - 5L+",
                "difficulty": "Medium"
            },
            {
                "id": "affiliate",
                "icon": "🔗",
                "title": "Affiliate Marketing",
                "subtitle": "Amazon Associates",
                "min_investment": "₹0",
                "time_to_first_money": "7-30 days",
                "monthly_potential": "₹2K - 1L+",
                "difficulty": "Easy"
            },
            {
                "id": "saas",
                "icon": "🚀",
                "title": "Micro SaaS",
                "subtitle": "Build · Launch",
                "min_investment": "₹2K/mo",
                "time_to_first_money": "60-180 days",
                "monthly_potential": "₹10K - 10L+",
                "difficulty": "Hard"
            }
        ]
    }

# ─── Jobs Endpoints ────────────────────────────────────────────────────────────

@api_router.post("/jobs/search", tags=["Jobs"])
async def search_jobs(request: JobSearchRequest):
    """
    Search for jobs (aggregated from multiple sources).
    """
    try:
        # Placeholder - in production this would aggregate from Naukri, LinkedIn, Indeed
        return {
            "jobs": [
                {
                    "id": str(uuid.uuid4()),
                    "title": request.query or "Software Developer",
                    "company": "TechCorp India",
                    "location": request.location or "Bangalore",
                    "salary": "₹12-18 LPA",
                    "type": "Full-time",
                    "tags": ["Remote", "Urgent"],
                    "posted_at": "2 days ago",
                    "url": "https://example.com/job/123"
                }
            ],
            "total": 1,
            "page": 1
        }
    except Exception as e:
        logger.error(f"Job search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/jobs/featured", tags=["Jobs"])
async def get_featured_jobs():
    """
    Get featured jobs for homepage.
    """
    return {
        "jobs": [
            {
                "id": "1",
                "title": "React Developer",
                "company": "Flipkart",
                "location": "Bangalore",
                "salary": "₹18-25 LPA",
                "tags": ["Remote", "Urgent"],
                "logo": "https://logo.clearbit.com/flipkart.com"
            },
            {
                "id": "2",
                "title": "Data Scientist",
                "company": "CRED",
                "location": "Mumbai",
                "salary": "₹25-35 LPA",
                "tags": ["Hybrid"],
                "logo": "https://logo.clearbit.com/cred.club"
            },
            {
                "id": "3",
                "title": "Backend Engineer",
                "company": "Razorpay",
                "location": "Bangalore",
                "salary": "₹20-30 LPA",
                "tags": ["On-site"],
                "logo": "https://logo.clearbit.com/razorpay.com"
            }
        ]
    }

# ─── Location Endpoint ─────────────────────────────────────────────────────────

@api_router.get("/location/detect", response_model=LocationDetectResponse, tags=["Location"])
async def detect_location(ip: Optional[str] = None):
    """
    Detect user location based on IP for currency and language personalization.
    """
    try:
        # South Asian countries
        SOUTH_ASIA = ['IN', 'BD', 'PK', 'NP', 'LK']
        # Southeast Asian countries
        SOUTHEAST_ASIA = ['PH', 'ID', 'VN', 'MY', 'TH', 'SG']
        # East Asian countries
        EAST_ASIA = ['JP', 'KR', 'TW', 'HK']

        # Default to India
        country_code = 'IN'
        country = 'india'
        currency = 'INR'
        language = 'en'
        region = 'india'

        # In production, use IP Geolocation API
        # For now, return defaults based on IP detection would happen here

        return LocationDetectResponse(
            country=country_code,
            currency=currency,
            language=language,
            region=region
        )
    except Exception as e:
        logger.error(f"Location detection error: {e}")
        # Return defaults on error
        return LocationDetectResponse(
            country='IN',
            currency='INR',
            language='en',
            region='india'
        )

# ─── User Endpoints ─────────────────────────────────────────────────────────────

@api_router.get("/users/{user_id}", response_model=UserProfile, tags=["Users"])
async def get_user(user_id: str):
    """
    Get user profile by ID.
    """
    try:
        user = await db.profiles.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserProfile(**user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users/scans/update", tags=["Users"])
async def update_scans(request: ScanUpdateRequest):
    """
    Update user scan balance.
    """
    try:
        result = await db.profiles.update_one(
            {"id": request.user_id},
            {"$inc": {"scans": request.scans_delta}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {"success": True, "scans_delta": request.scans_delta}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update scans error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}/scans", tags=["Users"])
async def get_user_scans(user_id: str):
    """
    Get user's current scan balance.
    """
    try:
        user = await db.profiles.find_one({"id": user_id}, {"scans": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"user_id": user_id, "scans": user.get("scans", 0)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user scans error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Payment Endpoints ──────────────────────────────────────────────────────────

@api_router.post("/payments/create-order", response_model=PaymentCreateResponse, tags=["Payments"])
async def create_payment_order(request: PaymentCreateRequest):
    """
    Create a Razorpay order for payment.
    """
    try:
        key_id = os.environ.get('RAZORPAY_KEY_ID', '')
        key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')

        if not key_id or not key_secret:
            raise HTTPException(status_code=500, detail="Razorpay not configured")

        # Use Razorpay API directly via httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.razorpay.com/v1/orders",
                auth=(key_id, key_secret),
                json={
                    "amount": request.amount,
                    "currency": request.currency,
                    "receipt": f"rcpt_{request.user_id}_{datetime.now().timestamp()}",
                    "notes": {
                        "user_id": request.user_id,
                        "plan_id": request.plan_id
                    }
                },
                timeout=30.0
            )

            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Razorpay error: {response.text}")

            order = response.json()

        return PaymentCreateResponse(
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            key_id=key_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create payment order error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/verify", tags=["Payments"])
async def verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    user_id: str,
    plan_id: str,
    scans_added: int
):
    """
    Verify Razorpay payment and add scans to user account.
    """
    try:
        # Verify signature
        secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
        expected_signature = hmac.new(
            secret.encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()

        if expected_signature != razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")

        # Update user scans
        await db.profiles.update_one(
            {"id": user_id},
            {
                "$inc": {"scans": scans_added},
                "$set": {"plan": plan_id}
            }
        )

        # Log transaction
        transaction = PaymentTransaction(
            user_id=user_id,
            payment_id=razorpay_payment_id,
            order_id=razorpay_order_id,
            plan_id=plan_id,
            scans_added=scans_added,
            amount=0,  # Would get from order
            currency="INR",
            status="completed"
        )
        await db.payment_transactions.insert_one(transaction.model_dump())

        # Log scan usage
        scan_log = ScanLog(
            user_id=user_id,
            action_type=f"purchase_{plan_id}",
            scans_used=-scans_added  # Negative because it's a purchase
        )
        await db.scan_logs.insert_one(scan_log.model_dump())

        return {"success": True, "scans_added": scans_added}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Analytics Endpoints ────────────────────────────────────────────────────────

@api_router.post("/analytics/event", tags=["Analytics"])
async def track_event(
    event_name: str,
    user_id: Optional[str] = None,
    properties: Optional[Dict[str, Any]] = None
):
    """
    Track analytics event.
    """
    try:
        event = {
            "event_name": event_name,
            "user_id": user_id,
            "properties": properties or {},
            "timestamp": datetime.now(timezone.utc)
        }
        await db.analytics_events.insert_one(event)
        return {"success": True}
    except Exception as e:
        logger.error(f"Analytics event error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/stats", tags=["Analytics"])
async def get_analytics_stats():
    """
    Get platform analytics stats.
    """
    try:
        total_users = await db.profiles.count_documents({})
        total_resumes = await db.resumes.count_documents({})
        total_interviews = await db.interview_sessions.count_documents({"status": "completed"})
        total_scans_used = await db.scan_logs.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$scans_used"}}}
        ]).to_list(1)

        return {
            "total_users": total_users,
            "total_resumes": total_resumes,
            "total_interviews": total_interviews,
            "total_scans_used": total_scans_used[0]["total"] if total_scans_used else 0
        }
    except Exception as e:
        logger.error(f"Analytics stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── Include Router in App ─────────────────────────────────────────────────────

app.include_router(api_router)

# ─── Startup/Shutdown Events ────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_db_client():
    logger.info("CraftlyCV API starting up...")
    logger.info(f"Connected to MongoDB: {db_name}")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("CraftlyCV API shutting down...")
    client.close()

# ─── Run Server ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=os.environ.get("DEBUG", "false").lower() == "true"
    )
