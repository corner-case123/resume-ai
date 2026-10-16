import React from 'react';
import { FiZap } from 'react-icons/fi';

export default function Navbar() {
  return (
    <nav className="navbar" id="navbar">
      <div className="navbar-inner">
        <a href="/" className="navbar-brand" id="navbar-brand">
          <div className="navbar-logo">
            <FiZap />
          </div>
          <div className="navbar-title">
            Resume<span>AI</span>
          </div>
        </a>
        <div className="navbar-actions">
          <div className="navbar-status" id="navbar-status">
            <span className="dot"></span>
            Powered by Gemini AI
          </div>
        </div>
      </div>
    </nav>
  );
}
