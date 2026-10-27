export default function handler(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!process.env.VITE_GEMINI_API_KEY,
    },
  });
}
