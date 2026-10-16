# ResumeAI — AI-Powered Resume Analyzer & Job Matcher

![ResumeAI Banner](https://img.shields.io/badge/ResumeAI-Powered%20by%20Gemini%20AI-6c5ce7?style=for-the-badge&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 📋 Project Description

**ResumeAI** is an AI-powered web application that analyzes resumes and provides comprehensive career insights. Users can upload a PDF resume or paste raw text, and the app leverages Google's Gemini AI to deliver an in-depth analysis including: overall resume score, ATS (Applicant Tracking System) compatibility rating, skill extraction and categorization, strengths and weaknesses assessment, personalized job role recommendations with match percentages, skill gap analysis with learning recommendations, actionable improvement tips, and a resume format checklist. The tool helps job seekers optimize their resumes and identify career opportunities they're best suited for.

## 👥 Team Members

| Name | Student ID | Role |
|------|-----------|------|
| Mubtasim Hasan Ahan | 220041123 | Full-Stack Developer |

## 🚀 Features

- **📄 Resume Upload**: Drag & drop PDF upload or paste raw text
- **🤖 AI Analysis**: Powered by Google Gemini 3.8 Flash for fast, accurate analysis
- **📊 Scoring Dashboard**: Overall score, ATS compatibility, skills score, and impact score
- **🎯 Skill Assessment**: Categorizes skills as strong, moderate, or missing
- **💼 Job Matching**: Suggests 5 matching job roles with match percentages
- **📈 Skill Gap Analysis**: Identifies missing skills with learning recommendations
- **💡 Improvement Tips**: Actionable suggestions to improve your resume
- **✅ Format Checklist**: Checks for contact info, summary, education, experience, etc.
- **🌙 Dark Mode UI**: Premium glassmorphism design with smooth animations
- **🔒 Privacy-First**: API key stays in your browser (localStorage), never sent to any server

## 🛠️ Technologies Used

| Technology | Purpose |
|-----------|---------|
| **React 19** | Frontend UI framework |
| **Vite 8** | Build tool and dev server |
| **Google Gemini AI** | AI-powered resume analysis (Gemini 3.8 Flash) |
| **PDF.js** | PDF text extraction in the browser |
| **Framer Motion** | Smooth animations and transitions |
| **React Dropzone** | Drag & drop file upload |
| **React Icons** | Icon library (Feather Icons) |
| **Vanilla CSS** | Custom design system with CSS variables |

## 📦 Setup & Installation

### Prerequisites
- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **Gemini API Key** (free) from [Google AI Studio](https://aistudio.google.com/apikey)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/resume-ai.git
cd resume-ai

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

4. Open `http://localhost:5173` in your browser
5. Enter your Gemini API key in the app
6. Upload a resume (PDF or text) and click **"Analyze Resume with AI"**

### Build for Production

```bash
npm run build
npm run preview
```

## 🎮 How to Test

1. **Get a free Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)
2. **Run the app** locally (`npm run dev`) or visit the live link
3. **Enter your API key** in the input field
4. **Upload a resume** (drag & drop a PDF, or paste text)
5. **Click "Analyze Resume with AI"** and wait ~15 seconds
6. **View the results** — scores, skills, job matches, improvements, and more

## 📸 Screenshots

The app features:
- A **premium dark mode** interface with glassmorphism effects
- **Animated score cards** showing overall, ATS, skills, and impact scores
- **Color-coded skill tags** (green = strong, blue = moderate, red = missing)
- **Job match cards** with match percentages and required skills
- **Step-by-step loading animation** during AI analysis

## 📁 Project Structure

```
resume-ai/
├── index.html              # Entry HTML with SEO meta tags
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration with React plugin
├── README.md               # This file
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Main app component (state management)
    ├── index.css           # Complete design system (CSS variables, components)
    ├── components/
    │   ├── Navbar.jsx      # Navigation bar with brand
    │   ├── Hero.jsx        # Hero section with features
    │   ├── UploadZone.jsx  # File upload + text input
    │   ├── ApiKeyInput.jsx # Gemini API key input
    │   ├── LoadingState.jsx# Animated loading with steps
    │   └── ResultsDashboard.jsx # Full results display
    └── services/
        ├── geminiService.js # Gemini AI API integration
        └── pdfService.js    # PDF text extraction
```

## 🔑 API Key Security

Your Gemini API key is stored **only in your browser's localStorage** and is sent directly from your browser to Google's API. It is never transmitted to any third-party server.

## 📄 License

MIT License — free to use, modify, and distribute.
