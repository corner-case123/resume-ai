import { GoogleGenerativeAI } from '@google/generative-ai';

const CANDIDATE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

async function callGeminiWithFallback(prompt, apiKey) {
  if (!apiKey) throw new Error('Gemini API key not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
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
      if (isRecoverable) continue;
      throw err;
    }
  }

  if (lastError) throw lastError;
  throw new Error('No response from Gemini models');
}

function cleanJsonResponse(rawText) {
  let text = rawText.trim();
  if (text.startsWith('```json')) text = text.slice(7);
  else if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  return text.trim();
}

async function extractSkillsFromResume(resumeText, apiKey) {
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
- "search_queries" should be optimized for job board search APIs
- "preferred_roles" should be the 5 most suitable job titles based on the resume
- Extract ALL technical and soft skills mentioned
- Be accurate about experience_level based on years of experience and project complexity`;

  const rawText = await callGeminiWithFallback(prompt, apiKey);
  return JSON.parse(cleanJsonResponse(rawText));
}

async function generateJobsWithAI(query, profile, filters, apiKey) {
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
    const rawText = await callGeminiWithFallback(prompt, apiKey);
    const jobs = JSON.parse(cleanJsonResponse(rawText));
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

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { resumeText, filters = {}, analysisResults = null } = req.body;
    const apiKey = process.env.VITE_GEMINI_API_KEY || '';

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    // Step 1: Extract skills from resume using Gemini
    let profile = null;
    try {
      profile = await extractSkillsFromResume(resumeText, apiKey);
    } catch (extractErr) {
      console.warn('Skills extraction failed:', extractErr.message);
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

    // Step 2: Generate AI-matched jobs
    const searchQueries = profile.search_queries?.slice(0, 3) || [profile.title || 'Developer'];
    const jobs = await generateJobsWithAI(searchQueries[0] || profile.title, profile, filters, apiKey);

    res.json({
      success: true,
      profile,
      jobs,
      totalResults: jobs.length,
      queries: searchQueries,
    });
  } catch (err) {
    console.error('Smart search error:', err);
    res.status(500).json({ error: err.message || 'Failed to perform smart job search' });
  }
}
