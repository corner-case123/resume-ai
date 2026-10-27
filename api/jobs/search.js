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

async function generateJobsWithAI(query, filters, apiKey) {
  const prompt = `You are a real-time career matching system. Generate 6 to 8 realistic, currently active job postings from top reputable tech and industry companies matching this query.

QUERY: "${query}"
FILTERS:
- Location requested: ${filters.location || 'Remote / Hybrid'}
- Employment type: ${filters.employmentType || 'FULLTIME'}
- Experience level: ${filters.experienceLevel || 'Mid Level'}
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
    "description": "2-sentence overview of the position.",
    "fullDescription": "Detailed 2-3 paragraph job description.",
    "salaryMin": 95000,
    "salaryMax": 140000,
    "salaryCurrency": "USD",
    "salaryPeriod": "YEAR",
    "source": "LinkedIn",
    "requiredSkills": ["Skill A", "Skill B", "Skill C", "Skill D"]
  }
]`;

  const rawText = await callGeminiWithFallback(prompt, apiKey);
  const jobs = JSON.parse(cleanJsonResponse(rawText));
  return jobs.map((job, idx) => ({
    ...job,
    id: job.id || `ai_job_${Date.now()}_${idx}`,
    applyLink: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent((job.title || query) + ' ' + (job.company || ''))}${filters.location ? '&location=' + encodeURIComponent(filters.location) : ''}`,
    postedAt: new Date(Date.now() - (idx * 86400000 + 3600000)).toISOString(),
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { query, filters = {} } = req.body;
    const apiKey = process.env.VITE_GEMINI_API_KEY || '';

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const jobs = await generateJobsWithAI(query, filters, apiKey);

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
}
