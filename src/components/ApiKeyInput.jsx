import React from 'react';
import { FiKey } from 'react-icons/fi';

export default function ApiKeyInput({ apiKey, onApiKeyChange }) {
  return (
    <section className="api-key-section" id="api-key-section">
      <div className="api-key-card">
        <div className="api-key-header">
          <FiKey className="api-key-header-icon" />
          <h3>Gemini API Key</h3>
        </div>
        <p className="api-key-description">
          Enter your Google Gemini API key to enable AI analysis. 
          Get a free key from{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
            Google AI Studio
          </a>. Your key stays in your browser and is never sent to our servers.
        </p>
        <div className="api-key-input-wrapper">
          <input
            type="password"
            className="api-key-input"
            id="api-key-input"
            placeholder="Enter your Gemini API key..."
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>
    </section>
  );
}
