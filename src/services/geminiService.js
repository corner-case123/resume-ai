import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Analyze a resume using Google Gemini AI.
 * Returns structured JSON with scores, skills, job matches, improvements, etc.
 */
export async function analyzeResume(apiKey, resumeText) {
  const activeKey = (apiKey && apiKey.trim()) || DEFAULT_API_KEY;
  const genAI = new GoogleGenerativeAI(activeKey);

  const prompt = `You are an expert career counselor and resume analyst. Analyze the following resume text and return a comprehensive JSON analysis.

RESUME TEXT:
"""
${resumeText}
"""

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "candidateName": "Name from resume or 'Unknown'",
  "overallScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "skillsScore": <number 0-100>,
  "impactScore": <number 0-100>,
  "summary": "2-3 sentence summary of the candidate's profile",
  "skills": {
    "strong": ["skill1", "skill2", ...],
    "moderate": ["skill1", "skill2", ...],
    "missing": ["skill1", "skill2", ...]
  },
  "strengths": [
    "Strength description 1",
    "Strength description 2",
    "Strength description 3"
  ],
  "weaknesses": [
    "Weakness description 1",
    "Weakness description 2",
    "Weakness description 3"
  ],
  "improvements": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3",
    "Specific actionable improvement 4",
    "Specific actionable improvement 5"
  ],
  "jobMatches": [
    {
      "title": "Job Title",
      "matchPercentage": <number 0-100>,
      "description": "Why this role is a good match",
      "requiredSkills": ["skill1", "skill2", "skill3"]
    }
  ],
  "skillGaps": [
    {
      "skill": "Skill Name",
      "importance": "high|medium|low",
      "recommendation": "How to acquire this skill"
    }
  ],
  "formatFeedback": {
    "hasContactInfo": true/false,
    "hasSummary": true/false,
    "hasEducation": true/false,
    "hasExperience": true/false,
    "hasProjects": true/false,
    "usesActionVerbs": true/false,
    "hasQuantifiedAchievements": true/false,
    "lengthFeedback": "Feedback about resume length"
  }
}

Rules:
- "missing" skills should be high-demand skills the candidate SHOULD add based on their profile
- Provide exactly 5 job matches, sorted by match percentage (highest first)
- Provide 3-5 skill gaps with actionable recommendations
- Be specific and actionable in improvements
- atsScore measures ATS (Applicant Tracking System) compatibility
- impactScore measures how well achievements are quantified and impactful
- overallScore is a weighted average: 40% skills + 30% ATS + 30% impact`;

  const candidateModels = [
    'gemini-3.8-flash',        // Latest & fastest
    'gemini-3.5-flash',        // Stable fallback
    'gemini-2.5-flash',        // Older fallback
    'gemini-flash-latest',     // Alias fallback
  ];
  let lastError = null;
  let responseText = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
      if (responseText) break;
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
        console.warn(`Model ${modelName} encountered recoverable error (${err.message}). Attempting fallback...`);
        continue;
      }
      throw err;
    }
  }

  if (!responseText && lastError) {
    throw lastError;
  }

  // Clean the response - remove markdown code fences if present
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Gemini response:', e);
    console.error('Raw response:', responseText);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
