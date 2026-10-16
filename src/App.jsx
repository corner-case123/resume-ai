import React, { useState, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import UploadZone from './components/UploadZone.jsx';
import ApiKeyInput from './components/ApiKeyInput.jsx';
import LoadingState from './components/LoadingState.jsx';
import ResultsDashboard from './components/ResultsDashboard.jsx';
import { extractText } from './services/pdfService.js';
import { analyzeResume } from './services/geminiService.js';
import { FiZap, FiAlertTriangle } from 'react-icons/fi';

// App states
const STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  RESULTS: 'results',
};

export default function App() {
  const [appState, setAppState] = useState(STATE.IDLE);
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('resumeai_api_key') || '';
    } catch {
      return '';
    }
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Save API key to localStorage when it changes
  const handleApiKeyChange = useCallback((key) => {
    setApiKey(key);
    try {
      localStorage.setItem('resumeai_api_key', key);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setRawText('');
    setError(null);
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  const handleRawTextChange = useCallback((text) => {
    setRawText(text);
    if (text.trim()) {
      setFile(null);
    }
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    setError(null);

    // Validation
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key to proceed.');
      return;
    }
    if (!file && !rawText.trim()) {
      setError('Please upload a resume file or paste resume text.');
      return;
    }

    setAppState(STATE.LOADING);

    try {
      // Extract text from file or use raw text
      let resumeText = rawText.trim();
      if (file) {
        resumeText = await extractText(file);
      }

      if (!resumeText || resumeText.length < 50) {
        throw new Error('Resume text is too short. Please upload a valid resume.');
      }

      // Analyze with Gemini
      const analysisResults = await analyzeResume(apiKey, resumeText);
      setResults(analysisResults);
      setAppState(STATE.RESULTS);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis. Please try again.');
      setAppState(STATE.IDLE);
    }
  }, [apiKey, file, rawText]);

  const handleReset = useCallback(() => {
    setAppState(STATE.IDLE);
    setFile(null);
    setRawText('');
    setResults(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const canAnalyze = apiKey.trim() && (file || rawText.trim());

  return (
    <>
      <div className="bg-mesh" />
      <div className="bg-grid" />
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          {appState === STATE.IDLE && (
            <>
              <Hero />

              {error && (
                <div className="error-banner" id="error-banner">
                  <FiAlertTriangle />
                  {error}
                </div>
              )}

              <ApiKeyInput apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />

              <UploadZone
                file={file}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                rawText={rawText}
                onRawTextChange={handleRawTextChange}
              />

              <button
                className="btn-analyze"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                id="analyze-btn"
              >
                <FiZap style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                Analyze Resume with AI
              </button>
            </>
          )}

          {appState === STATE.LOADING && <LoadingState />}

          {appState === STATE.RESULTS && (
            <ResultsDashboard results={results} onReset={handleReset} />
          )}
        </main>

        <footer className="footer" id="footer">
          <p>
            Built with ❤️ using React & Google Gemini AI — 
            ResumeAI © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </>
  );
}
