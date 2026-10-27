import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '../.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Config ────────────────────────────────────────────────────────────────────
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || '';
const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';

// Supported models with cascading fallback
const CANDIDATE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

function hasValidJSearchKey() {
  return Boolean(
    JSEARCH_API_KEY &&
    JSEARCH_API_KEY.trim() &&
    JSEARCH_API_KEY !== 'your_jsearch_api_key_here'
  );
}

// ─── Reusable Gemini Invocation with Cascading Fallback ─────────────────────────
async function callGeminiWithFallback(prompt, customApiKey = null) {
  const activeKey = customApiKey || GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(activeKey);
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      lastError = err;
      const isRecoverable = err.message && (
        err.message.includes('404') ||
        err.message.includes('not found') ||
        err.message.includes('no longer available') ||
        err.message.includes('503') ||
        err.message.includes('high demand') ||
        err.message.includes('429') ||
        err.message.includes('quota') ||
        err.message.includes('resource exhausted')
      );

      if (isRecoverable) {
        console.warn(`[Backend Gemini] Model ${modelName} returned recoverable error (${err.message}). Trying fallback...`);
        continue;
      }
      throw err;
    }
  }

  if (lastError) throw lastError;
  throw new Error('No response from Gemini models');
}

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      jsearch: hasValidJSearchKey(),
      gemini: !!GEMINI_API_KEY,
    },
    defaultModel: CANDIDATE_MODELS[0],
  });
});

// ─── Extract Skills from Resume (via Gemini) ──────────────────────────────────
async function extractSkillsFromResume(resumeText, customApiKey = null) {
  const prompt = `Analyze this resume and extract key information for job searching.

RESUME:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown, no code fences) with this structure:
{
  "candidateName": "Name from resume",
  "title": "Most likely job title (e.g., 'Frontend Developer', 'Data Scientist')",
  "skills": ["skill1", "skill2"],
  "experience_level": "entry|mid|senior",
  "preferred_roles": ["role1", "role2", "role3", "role4", "role5"],
  "search_queries": ["optimized search query 1", "optimized search query 2", "optimized search query 3"],
  "industries": ["industry1", "industry2"]
}

Rules:
- "search_queries" should be optimized for job board search APIs (e.g., "React developer", "Full stack engineer JavaScript")
- "preferred_roles" should be the 5 most suitable job titles based on the resume
- Extract ALL technical and soft skills mentioned
- Be accurate about experience_level based on years of experience and project complexity`;

  const rawText = await callGeminiWithFallback(prompt, customApiKey);
  let text = rawText.trim();

  // Clean markdown fences
  if (text.startsWith('```json')) text = text.slice(7);
  else if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);

  return JSON.parse(text.trim());
}

// ─── Search Jobs via JSearch API ───────────────────────────────────────────────
async function searchJobs(query, options = {}) {
  if (!hasValidJSearchKey()) {
    throw new Error('JSearch API key not configured or invalid');
  }

  const {
    page = 1,
    num_pages = 1,
    date_posted = 'all',
    remote_jobs_only = false,
    employment_types = '',
    job_requirements = '',
    country = '',
  } = options;

  const params = new URLSearchParams({
    query: query,
    page: String(page),
    num_pages: String(num_pages),
    date_posted,
  });

  if (remote_jobs_only) params.set('remote_jobs_only', 'true');
  if (employment_types) params.set('employment_types', employment_types);
  if (job_requirements) params.set('job_requirements', job_requirements);
  if (country) params.set('country', country);

  const url = `https://${JSEARCH_HOST}/search?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': JSEARCH_API_KEY,
      'x-rapidapi-host': JSEARCH_HOST,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('JSearch API error:', response.status, errText);
    throw new Error(`JSearch API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// ─── Format Job Results from JSearch ──────────────────────────────────────────
function formatJobResults(jsearchData) {
  if (!jsearchData?.data) return [];

  return jsearchData.data.map((job) => ({
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    companyLogo: job.employer_logo,
    location: job.job_city
      ? `${job.job_city}${job.job_state ? ', ' + job.job_state : ''}${job.job_country ? ', ' + job.job_country : ''}`
      : job.job_country || 'Not specified',
    isRemote: job.job_is_remote,
    employmentType: job.job_employment_type,
    description: job.job_description?.substring(0, 500) + (job.job_description?.length > 500 ? '...' : ''),
    fullDescription: job.job_description,
    applyLink: job.job_apply_link,
    postedAt: job.job_posted_at_datetime_utc,
    salaryMin: job.job_min_salary,
    salaryMax: job.job_max_salary,
    salaryCurrency: job.job_salary_currency || 'USD',
    salaryPeriod: job.job_salary_period,
    source: job.job_publisher || 'Web',
    highlights: job.job_highlights || {},
    requiredSkills: job.job_highlights?.Qualifications?.slice(0, 5) || [],
  }));
}

// ─── AI Job Generator Fallback ────────────────────────────────────────────────
// When JSearch API is not configured or fails, generate realistic matching job postings with direct LinkedIn search links
async function generateJobsWithAI(query, profile = null, filters = {}, customApiKey = null) {
  const prompt = `You are a real-time career matching system. Generate 6 to 8 realistic, currently active job postings from top reputable tech and industry companies (e.g. Google, Microsoft, Amazon, Meta, Stripe, Spotify, Netflix, top remote tech companies) matching this query and candidate.

QUERY: "${query}"
CANDIDATE INFO: ${profile ? JSON.stringify(profile) : 'Skilled professional'}
FILTERS:
- Location requested: ${filters.location || 'Remote / Hybrid'}
- Employment type: ${filters.employmentType || 'FULLTIME'}
- Experience level: ${filters.experienceLevel || profile?.experience_level || 'Mid Level'}
- Remote only: ${filters.remoteOnly ? 'Yes' : 'Any'}

Return ONLY valid JSON (no markdown, no code fences) with an array of objects matching this exact format:
[
  {
    "id": "job_1",
    "title": "Software Engineer",
    "company": "Company Name",
    "location": "San Francisco, CA (or Remote)",
    "isRemote": true,
    "employmentType": "FULLTIME",
    "description": "2-sentence overview of the position, team, and main responsibilities.",
    "fullDescription": "Detailed 2-3 paragraph job description covering responsibilities, day-to-day work, engineering culture, and growth opportunities.",
    "salaryMin": 95000,
    "salaryMax": 140000,
    "salaryCurrency": "USD",
    "salaryPeriod": "YEAR",
    "source": "LinkedIn",
    "requiredSkills": ["Skill A", "Skill B", "Skill C", "Skill D"]
  }
]`;

  try {
    const rawText = await callGeminiWithFallback(prompt, customApiKey);
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    const jobs = JSON.parse(cleaned);
    return jobs.map((job, idx) => ({
      ...job,
      id: job.id || `ai_job_${Date.now()}_${idx}`,
      applyLink: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent((job.title || query) + ' ' + (job.company || ''))}${filters.location ? '&location=' + encodeURIComponent(filters.location) : ''}`,
      postedAt: new Date(Date.now() - (idx * 86400000 + 3600000)).toISOString(),
    }));
  } catch (err) {
    console.error('Failed to generate AI jobs fallback:', err);
    return [];
  }
}

// ─── API: Search Jobs ──────────────────────────────────────────────────────────
app.post('/api/jobs/search', async (req, res) => {
  try {
    const { query, filters = {}, apiKey = null } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let jobs = [];

    // Try JSearch if configured
    if (hasValidJSearchKey()) {
      try {
        let searchQuery = query;
        if (filters.location && filters.location.trim()) {
          searchQuery = `${query} in ${filters.location}`;
        }

        const options = {
          page: filters.page || 1,
          num_pages: 1,
          date_posted: filters.datePosted || 'all',
          remote_jobs_only: filters.remoteOnly || false,
          employment_types: filters.employmentType || '',
          job_requirements: filters.experienceLevel || '',
        };

        const data = await searchJobs(searchQuery, options);
        jobs = formatJobResults(data);
      } catch (err) {
        console.warn('JSearch failed, falling back to AI job matching:', err.message);
      }
    }

    // Fall back to AI job generation if JSearch is unconfigured or returned no jobs
    if (jobs.length === 0) {
      jobs = await generateJobsWithAI(query, null, filters, apiKey);
    }

    res.json({
      success: true,
      jobs,
      totalResults: jobs.length,
      query,
    });
  } catch (err) {
    console.error('Job search error:', err);
    res.status(500).json({ error: err.message || 'Failed to search jobs' });
  }
});

// ─── API: AI-Powered Job Search (Resume → Skills → Jobs) ──────────────────────
app.post('/api/jobs/smart-search', async (req, res) => {
  try {
    const { resumeText, filters = {}, analysisResults = null, apiKey = null } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    // Step 1: Extract skills from resume using Gemini
    let profile = null;
    try {
      profile = await extractSkillsFromResume(resumeText, apiKey);
    } catch (extractErr) {
      console.warn('Skills extraction via Gemini had an issue:', extractErr.message);
      // Fallback: If frontend already sent analysisResults, extract profile from it
      if (analysisResults) {
        const strongSkills = analysisResults.skills?.strong || [];
        const moderateSkills = analysisResults.skills?.moderate || [];
        const topJob = analysisResults.jobMatches?.[0]?.title || 'Software Developer';
        profile = {
          candidateName: analysisResults.candidateName || 'Candidate',
          title: topJob,
          skills: [...strongSkills, ...moderateSkills],
          experience_level: 'mid',
          preferred_roles: analysisResults.jobMatches?.map(m => m.title) || [topJob],
          search_queries: [topJob, ...strongSkills.slice(0, 2).map(s => `${s} Developer`)],
          industries: ['Technology'],
        };
      } else {
        throw extractErr;
      }
    }

    // Step 2: Search jobs for queries
    const allJobs = [];
    const searchQueries = profile.search_queries?.slice(0, 3) || [profile.title || 'Developer'];

    // Try live search via JSearch if valid API key is present
    if (hasValidJSearchKey()) {
      for (const query of searchQueries) {
        try {
          let searchQuery = query;
          if (filters.location && filters.location.trim()) {
            searchQuery = `${query} in ${filters.location}`;
          }

          const data = await searchJobs(searchQuery, {
            page: filters.page || 1,
            num_pages: 1,
            date_posted: filters.datePosted || 'month',
            remote_jobs_only: filters.remoteOnly || false,
            employment_types: filters.employmentType || '',
            job_requirements: filters.experienceLevel || profile.experience_level || '',
          });

          const jobs = formatJobResults(data);
          allJobs.push(...jobs);
        } catch (err) {
          console.warn(`Search failed for query "${query}":`, err.message);
        }
      }
    }

    // If JSearch is unconfigured or returned no jobs, generate AI-matched jobs based on the profile
    if (allJobs.length === 0) {
      console.log('Generating AI-matched jobs for profile:', profile.title);
      const aiJobs = await generateJobsWithAI(searchQueries[0] || profile.title, profile, filters, apiKey);
      allJobs.push(...aiJobs);
    }

    // Deduplicate jobs by ID
    const uniqueJobs = [];
    const seenIds = new Set();
    for (const job of allJobs) {
      if (!seenIds.has(job.id)) {
        seenIds.add(job.id);
        uniqueJobs.push(job);
      }
    }

    res.json({
      success: true,
      profile,
      jobs: uniqueJobs,
      totalResults: uniqueJobs.length,
      queries: searchQueries,
    });
  } catch (err) {
    console.error('Smart search error:', err);
    res.status(500).json({ error: err.message || 'Failed to perform smart job search' });
  }
});

// ─── API: Generate Cover Letter ────────────────────────────────────────────────
app.post('/api/cover-letter/generate', async (req, res) => {
  try {
    const { resumeText, jobTitle, company, jobDescription, apiKey = null } = req.body;

    if (!resumeText || !jobTitle) {
      return res.status(400).json({ error: 'Resume text and job title are required' });
    }

    const prompt = `Write a professional, compelling cover letter based on the following:

CANDIDATE'S RESUME:
"""
${resumeText.substring(0, 3000)}
"""

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${company || 'the company'}
${jobDescription ? `- Description: ${jobDescription.substring(0, 2000)}` : ''}

Requirements:
1. Make it personal and tailored to the specific job
2. Highlight relevant skills and experiences from the resume
3. Show enthusiasm for the role and company
4. Keep it concise (3-4 paragraphs)
5. Use professional but warm tone
6. Include specific examples from the resume that match the job requirements
7. Do NOT include placeholder text like [Your Name] — use the actual name from the resume
8. Format it as a ready-to-send cover letter

Return ONLY the cover letter text, no additional commentary.`;

    const rawText = await callGeminiWithFallback(prompt, apiKey);
    const coverLetter = rawText.trim();

    res.json({
      success: true,
      coverLetter,
    });
  } catch (err) {
    console.error('Cover letter generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate cover letter' });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 ResumeAI Backend running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n🔑 API Keys Status:`);
  console.log(`   Gemini AI: ${GEMINI_API_KEY ? '✅ Configured (Default Model: ' + CANDIDATE_MODELS[0] + ')' : '❌ Missing'}`);
  console.log(`   JSearch:   ${hasValidJSearchKey() ? '✅ Configured' : 'ℹ️ Using smart AI job generator (add RapidAPI key in .env.local to enable live scraping)'}`);
  console.log('');
});
