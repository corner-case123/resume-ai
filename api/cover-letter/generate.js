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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { resumeText, jobTitle, company, jobDescription } = req.body;
    const apiKey = process.env.VITE_GEMINI_API_KEY || '';

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

    const coverLetter = (await callGeminiWithFallback(prompt, apiKey)).trim();

    res.json({
      success: true,
      coverLetter,
    });
  } catch (err) {
    console.error('Cover letter generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate cover letter' });
  }
}
