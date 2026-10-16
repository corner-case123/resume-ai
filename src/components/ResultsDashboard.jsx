import React from 'react';
import { motion } from 'framer-motion';
import {
  FiAward, FiCpu, FiTarget, FiTrendingUp,
  FiCheckCircle, FiAlertCircle, FiArrowUpRight,
  FiBriefcase, FiZap, FiAlertTriangle,
  FiCheck, FiX, FiMinus
} from 'react-icons/fi';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

function ScoreCard({ label, value, type, icon, index }) {
  return (
    <motion.div
      className={`score-card ${type}`}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      <div className="score-card-header">
        <span className="score-card-label">{label}</span>
        <span className="score-card-icon">{icon}</span>
      </div>
      <div className="score-card-value">
        {value}<span className="out-of">/100</span>
      </div>
      <div className="score-card-bar">
        <div
          className="score-card-bar-fill"
          style={{ width: `${value}%` }}
        />
      </div>
    </motion.div>
  );
}

function FormatCheckItem({ label, passed }) {
  return (
    <div className="improvement-item">
      <span className="improvement-item-icon" style={{ color: passed ? '#00cec9' : '#ff6b6b' }}>
        {passed ? <FiCheck /> : <FiX />}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function ResultsDashboard({ results, onReset }) {
  if (!results) return null;

  const {
    candidateName,
    overallScore,
    atsScore,
    skillsScore,
    impactScore,
    summary,
    skills,
    strengths,
    weaknesses,
    improvements,
    jobMatches,
    skillGaps,
    formatFeedback,
  } = results;

  return (
    <section className="results-section" id="results-section">
      {/* Header */}
      <div className="results-header">
        <h2>Analysis Results{candidateName && candidateName !== 'Unknown' ? ` for ${candidateName}` : ''}</h2>
        <p>{summary}</p>
      </div>

      {/* Score Cards */}
      <div className="score-grid" id="score-grid">
        <ScoreCard
          label="Overall Score"
          value={overallScore}
          type="overall"
          icon={<FiAward />}
          index={0}
        />
        <ScoreCard
          label="ATS Compatibility"
          value={atsScore}
          type="ats"
          icon={<FiCpu />}
          index={1}
        />
        <ScoreCard
          label="Skills Score"
          value={skillsScore}
          type="skills"
          icon={<FiTarget />}
          index={2}
        />
        <ScoreCard
          label="Impact Score"
          value={impactScore}
          type="impact"
          icon={<FiTrendingUp />}
          index={3}
        />
      </div>

      {/* Skills + Strengths/Weaknesses */}
      <div className="detail-grid">
        {/* Skills Panel */}
        <motion.div
          className="detail-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="detail-panel-header">
            <div className="detail-panel-icon purple">
              <FiTarget />
            </div>
            <h3 className="detail-panel-title">Skills Assessment</h3>
          </div>

          {skills?.strong?.length > 0 && (
            <>
              <p style={{ fontSize: '0.8rem', color: '#9e9eb8', marginBottom: '8px', fontWeight: 500 }}>Strong Skills</p>
              <div className="skills-list" style={{ marginBottom: '16px' }}>
                {skills.strong.map((skill, i) => (
                  <span key={i} className="skill-tag strong">{skill}</span>
                ))}
              </div>
            </>
          )}

          {skills?.moderate?.length > 0 && (
            <>
              <p style={{ fontSize: '0.8rem', color: '#9e9eb8', marginBottom: '8px', fontWeight: 500 }}>Moderate Skills</p>
              <div className="skills-list" style={{ marginBottom: '16px' }}>
                {skills.moderate.map((skill, i) => (
                  <span key={i} className="skill-tag moderate">{skill}</span>
                ))}
              </div>
            </>
          )}

          {skills?.missing?.length > 0 && (
            <>
              <p style={{ fontSize: '0.8rem', color: '#9e9eb8', marginBottom: '8px', fontWeight: 500 }}>Recommended to Add</p>
              <div className="skills-list">
                {skills.missing.map((skill, i) => (
                  <span key={i} className="skill-tag missing">{skill}</span>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Strengths & Weaknesses */}
        <motion.div
          className="detail-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="detail-panel-header">
            <div className="detail-panel-icon green">
              <FiZap />
            </div>
            <h3 className="detail-panel-title">Strengths & Weaknesses</h3>
          </div>

          {strengths?.length > 0 && (
            <div className="sw-list" style={{ marginBottom: '16px' }}>
              {strengths.map((item, i) => (
                <div key={i} className="sw-item strength">
                  <span className="sw-item-icon"><FiCheckCircle /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {weaknesses?.length > 0 && (
            <div className="sw-list">
              {weaknesses.map((item, i) => (
                <div key={i} className="sw-item weakness">
                  <span className="sw-item-icon"><FiAlertCircle /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Job Matches */}
      {jobMatches?.length > 0 && (
        <motion.div
          className="full-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="detail-panel-header">
            <div className="detail-panel-icon blue">
              <FiBriefcase />
            </div>
            <h3 className="detail-panel-title">Job Matches</h3>
          </div>
          <div className="job-list" id="job-list">
            {jobMatches.map((job, i) => {
              const matchLevel = job.matchPercentage >= 80 ? 'high' : job.matchPercentage >= 60 ? 'medium' : 'low';
              return (
                <div key={i} className="job-card">
                  <div className="job-card-header">
                    <h4 className="job-card-title">{job.title}</h4>
                    <span className={`job-card-match ${matchLevel}`}>
                      {job.matchPercentage}% Match
                    </span>
                  </div>
                  <p className="job-card-description">{job.description}</p>
                  {job.requiredSkills?.length > 0 && (
                    <div className="job-card-skills">
                      {job.requiredSkills.map((skill, j) => (
                        <span key={j} className="job-card-skill">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Improvements + Skill Gaps */}
      <div className="detail-grid">
        {/* Improvements */}
        {improvements?.length > 0 && (
          <motion.div
            className="detail-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="detail-panel-header">
              <div className="detail-panel-icon orange">
                <FiArrowUpRight />
              </div>
              <h3 className="detail-panel-title">Improvement Tips</h3>
            </div>
            <div className="improvement-list" id="improvement-list">
              {improvements.map((tip, i) => (
                <div key={i} className="improvement-item">
                  <span className="improvement-item-icon"><FiAlertTriangle /></span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Skill Gaps */}
        {skillGaps?.length > 0 && (
          <motion.div
            className="detail-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <div className="detail-panel-header">
              <div className="detail-panel-icon red">
                <FiAlertCircle />
              </div>
              <h3 className="detail-panel-title">Skill Gaps to Fill</h3>
            </div>
            <div className="improvement-list">
              {skillGaps.map((gap, i) => (
                <div key={i} className="improvement-item">
                  <span className="improvement-item-icon" style={{
                    color: gap.importance === 'high' ? '#ff6b6b' : gap.importance === 'medium' ? '#fdcb6e' : '#74b9ff'
                  }}>
                    {gap.importance === 'high' ? '🔴' : gap.importance === 'medium' ? '🟡' : '🔵'}
                  </span>
                  <span>
                    <strong>{gap.skill}</strong>: {gap.recommendation}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Format Feedback */}
      {formatFeedback && (
        <motion.div
          className="full-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <div className="detail-panel-header">
            <div className="detail-panel-icon yellow">
              <FiCheckCircle />
            </div>
            <h3 className="detail-panel-title">Resume Format Checklist</h3>
          </div>
          <div className="improvement-list" id="format-checklist">
            <FormatCheckItem label="Contact Information" passed={formatFeedback.hasContactInfo} />
            <FormatCheckItem label="Professional Summary" passed={formatFeedback.hasSummary} />
            <FormatCheckItem label="Education Section" passed={formatFeedback.hasEducation} />
            <FormatCheckItem label="Work Experience" passed={formatFeedback.hasExperience} />
            <FormatCheckItem label="Projects Section" passed={formatFeedback.hasProjects} />
            <FormatCheckItem label="Uses Action Verbs" passed={formatFeedback.usesActionVerbs} />
            <FormatCheckItem label="Quantified Achievements" passed={formatFeedback.hasQuantifiedAchievements} />
            {formatFeedback.lengthFeedback && (
              <div className="improvement-item">
                <span className="improvement-item-icon" style={{ color: '#74b9ff' }}>
                  <FiMinus />
                </span>
                <span>{formatFeedback.lengthFeedback}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* New Analysis */}
      <div className="new-analysis-wrapper">
        <button
          className="btn btn-secondary btn-lg"
          onClick={onReset}
          id="new-analysis-btn"
        >
          ← Analyze Another Resume
        </button>
      </div>
    </section>
  );
}
