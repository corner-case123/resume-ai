import React from 'react';
import { FiTarget, FiCpu, FiBriefcase, FiTrendingUp, FiSearch } from 'react-icons/fi';

export default function Hero() {
  return (
    <section className="hero" id="hero-section">
      <div className="hero-badge">
        <span className="hero-badge-icon">✨</span>
        AI-Powered Resume Analysis & Job Matching
      </div>
      <h1>
        Unlock Your Career<br />
        <span className="gradient-text">Potential with AI</span>
      </h1>
      <p className="hero-subtitle">
        Upload your resume and get instant AI-powered analysis, skill assessment, 
        ATS compatibility score — then discover <strong>real job listings</strong> from 
        LinkedIn, Indeed & more, matched to your skills. Plus, auto-generate tailored cover letters!
      </p>
      <div className="hero-features">
        <div className="hero-feature">
          <div className="hero-feature-icon purple">
            <FiTarget />
          </div>
          <span>Skill Analysis</span>
        </div>
        <div className="hero-feature">
          <div className="hero-feature-icon blue">
            <FiCpu />
          </div>
          <span>ATS Scoring</span>
        </div>
        <div className="hero-feature">
          <div className="hero-feature-icon green">
            <FiSearch />
          </div>
          <span>AI Job Finder</span>
        </div>
        <div className="hero-feature">
          <div className="hero-feature-icon orange">
            <FiBriefcase />
          </div>
          <span>Cover Letters</span>
        </div>
      </div>
    </section>
  );
}
