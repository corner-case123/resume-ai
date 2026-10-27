/**
 * Job Search Service — connects to our Express.js backend
 * which proxies requests to the JSearch API (RapidAPI)
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

/**
 * Smart search: send resume text → backend extracts skills via Gemini → searches real jobs
 */
export async function smartJobSearch(resumeText, filters = {}, analysisResults = null) {
  const response = await fetch(`${API_BASE}/api/jobs/smart-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, filters, analysisResults }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Manual search: search jobs by a custom query with filters
 */
export async function searchJobs(query, filters = {}) {
  const response = await fetch(`${API_BASE}/api/jobs/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, filters }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Generate a tailored cover letter for a specific job
 */
export async function generateCoverLetter(resumeText, jobTitle, company, jobDescription) {
  const response = await fetch(`${API_BASE}/api/cover-letter/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jobTitle, company, jobDescription }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Check backend health
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
