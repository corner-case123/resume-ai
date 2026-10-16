import React, { useState, useEffect } from 'react';
import { FiCpu, FiCheck, FiLoader } from 'react-icons/fi';

const STEPS = [
  { label: 'Extracting resume content', icon: '📄' },
  { label: 'Analyzing skills & experience', icon: '🔍' },
  { label: 'Scoring ATS compatibility', icon: '🎯' },
  { label: 'Matching job opportunities', icon: '💼' },
  { label: 'Generating recommendations', icon: '✨' },
];

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="loading-section" id="loading-section">
      <div className="loading-spinner-container">
        <div className="loading-spinner" />
        <div className="loading-spinner-inner">
          <FiCpu />
        </div>
      </div>
      <h2 className="loading-title">Analyzing Your Resume</h2>
      <p className="loading-subtitle">
        Gemini AI is processing your resume — this usually takes 10-20 seconds
      </p>
      <div className="loading-steps">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={`loading-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
          >
            <span className="loading-step-icon">
              {i < currentStep ? <FiCheck /> : step.icon}
            </span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
