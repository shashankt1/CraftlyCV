# CraftlyCV - AI-Powered Career Operating System

**Get Hired or Start Earning in 7 Days**

CraftlyCV is a full-stack career acceleration platform combining AI resume building, mock interviews, job aggregation, and income opportunities — all in one place.

---

## Features

### AI Resume Builder
- **ATS Analyzer** — Score your resume in 30 seconds with actionable improvement suggestions
- **Tailor to Job** — Paste any job description, let AI rewrite your resume to match
- **Bullet Improver** — Transform weak bullets into impact-focused achievement statements
- **20+ Templates** — Professional, ATS-optimized designs

### AI Mock Interview
- **Chat-style Interface** — Practice with voice or text input in realistic interview scenarios
- **STAR Method Feedback** — Get structured feedback after every answer
- **Confidence Scoring** — Rated on clarity, relevance, and impact
- **HR/Tech/Behavioral Modes** — Prepare for any interview round

### Income Hub
- **Freelance Gigs** — Upwork, Fiverr, Toptal opportunities matched to your skills
- **AI Training Jobs** — Earn ₹10-45K/month labeling AI data on Outlier, Scale AI
- **YouTube Automation** — Build a faceless channel with AI tools
- **Online Tutoring** — Teach globally on Preply, Wyzant

### Job Finder
- **Aggregated Jobs** — Naukri, LinkedIn, Indeed aggregated in one place
- **Role Matching** — AI matches you to roles based on your resume
- **Direct Apply** — Apply with your CraftlyCV-optimized resume

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI, Framer Motion, Supabase Auth |
| **Backend** | FastAPI (Python), MongoDB, Google Gemini AI |
| **Payments** | Razorpay (India), Stripe (Global) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Gemini API key

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # Add your API keys
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env     # Add your API keys
uvicorn server:app --reload
```

---

## Project Structure

```
craftlycv/
├── frontend/                 # Next.js 14 application
│   ├── src/
│   │   ├── app/            # App Router pages & API routes
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities, AI integration, Supabase client
│   └── public/              # Static assets
├── backend/                  # FastAPI server
│   ├── server.py            # Main application with all routes
│   ├── prompts.py           # AI system prompts
│   └── requirements.txt      # Python dependencies
└── README.md
```

---

## API Endpoints

### AI Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze` | ATS resume analysis |
| POST | `/api/ai/tailor` | Tailor resume to job description |
| POST | `/api/ai/interview-questions` | Generate interview questions |
| POST | `/api/ai/mock-interview/start` | Start mock interview session |
| POST | `/api/ai/roadmap` | Generate career roadmap |
| POST | `/api/ai/linkedin` | LinkedIn profile optimization |

### Jobs & Income
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/income/paths` | Get income path recommendations |
| POST | `/api/jobs/search` | Search aggregated job listings |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |

---

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | 10 scans, ATS Analyzer, Basic templates |
| **Starter** | ₹49/day | 30 scans, Tailor to Job, PDF download |
| **Pro** | ₹149/mo | 200 scans, Mock Interview, All features |
| **Lifetime** | ₹399 | All Pro features, one-time payment |

Global (USD): $2/Starter, $5/Pro, $10/Lifetime

---

## Environment Variables

### Frontend (.env)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
```

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
GEMINI_API_KEY=your-gemini-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

---

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (Railway/Render/Fly.io)
```bash
cd backend
# Deploy via Railway, Render, or Fly.io dashboards
```

---

## License

MIT License — free to use for personal and commercial projects.

---

Built with ❤️ for job seekers worldwide.