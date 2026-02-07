# QuickResume - Resume & JD Formatter App v0.1

A full-stack application for parsing, formatting, and managing resumes and job descriptions with AI-powered extraction.

## 🚀 Features

### Resume Parser
- **AI Parsing (GPT-5.2)**: Intelligent extraction of resume data using OpenAI's GPT-5.2
- **Simple Parsing**: Fast regex-based parsing for quick formatting
- **Professional Formatting**: Download resumes as PDF or DOCX with:
  - Horizontal lines under section headers
  - Right-aligned dates
  - Narrow margins (1.27cm)
  - Professional typography

### Job Description (JD) Parser
- **AI Parsing (CrewAI/GPT-5.2)**: Extracts structured data from job descriptions
- **Simple Parsing**: Regex-based extraction
- **Extracted Fields**:
  - Job Title, Company, Location
  - **Must Have Skills** (required/mandatory)
  - **Good to Have Skills** (preferred/nice-to-have)
  - Experience Required, Salary Range
  - Job Type (Full-time/Part-time/Contract)

### Telegram Bot Integration
- Connect your own Telegram bot via @BotFather
- Bot workflow:
  1. User sends "hi" or "/start"
  2. Bot asks: Resume or JD?
  3. User sends text
  4. Auto-parsed and saved to dashboard

### User Dashboard
- Sidebar navigation
- Manage saved resumes and job descriptions
- Telegram bot settings

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - Database for storing users, resumes, JDs
- **Emergent Integrations** - LLM integration with GPT-5.2
- **python-telegram-bot** - Telegram bot framework
- **python-docx** - DOCX generation
- **ReportLab** - PDF generation

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI application with all routes
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React app with routes
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── components/
│   │   │   ├── Sidebar.js
│   │   │   └── ui/       # Shadcn components
│   │   └── pages/
│   │       ├── LandingPage.js
│   │       ├── LoginPage.js
│   │       ├── SignupPage.js
│   │       ├── DashboardPage.js
│   │       ├── EditorPage.js
│   │       ├── JDListPage.js
│   │       ├── JDEditorPage.js
│   │       └── TelegramSettingsPage.js
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Resume
- `POST /api/parse/simple` - Simple resume parsing
- `POST /api/parse/ai` - AI resume parsing
- `GET /api/resumes` - List user's resumes
- `POST /api/resumes` - Create resume
- `GET /api/resumes/{id}` - Get resume
- `PUT /api/resumes/{id}` - Update resume
- `DELETE /api/resumes/{id}` - Delete resume

### Job Description
- `POST /api/parse/jd/simple` - Simple JD parsing
- `POST /api/parse/jd/ai` - AI JD parsing (CrewAI)
- `GET /api/jds` - List user's JDs
- `POST /api/jds` - Create JD
- `GET /api/jds/{id}` - Get JD
- `PUT /api/jds/{id}` - Update JD
- `DELETE /api/jds/{id}` - Delete JD

### Download
- `POST /api/download/pdf` - Generate PDF resume
- `POST /api/download/docx` - Generate DOCX resume

### Telegram
- `GET /api/telegram/settings` - Get bot settings
- `PUT /api/telegram/settings` - Update bot settings

## 🔧 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=<your-emergent-key>
JWT_SECRET=<your-jwt-secret>
```

## 📝 Resume Sections Supported
- Name
- Professional Summary
- Email
- LinkedIn
- Technical Skills
- Experiences (with Company, From/To Date, Bullet Points)
- Projects
- Education

## 🎯 JD Fields Extracted
- Job Title
- Company
- Location
- Must Have Skills
- Good to Have Skills
- Experience Required
- Salary Range
- Job Type

## 📱 Telegram Bot Setup
1. Create a bot with @BotFather on Telegram
2. Copy the bot token
3. Go to /telegram settings in the app
4. Paste the token and activate
5. Start chatting with your bot!

## 🚀 Version History

### v0.1 (Baseline)
- Initial release
- Resume parsing (AI + Simple)
- JD parsing (AI + Simple) with Must Have/Good to Have skills
- PDF/DOCX download with professional formatting
- User authentication with MongoDB
- Telegram bot integration
- Sidebar navigation UI

## 📄 License
MIT License

---
Built with ❤️ using Emergent Platform
