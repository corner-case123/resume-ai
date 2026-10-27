import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBriefcase, FiSearch, FiMapPin, FiClock, FiDollarSign,
  FiExternalLink, FiBookmark, FiFilter, FiLoader, FiZap,
  FiChevronDown, FiChevronUp, FiX, FiGlobe, FiStar,
  FiFileText, FiCopy, FiCheck, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';
import { smartJobSearch, searchJobs, generateCoverLetter } from '../services/jobService';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

// ─── Filter Panel ──────────────────────────────────────────────────────────────
function FilterPanel({ filters, onFilterChange, onReset }) {
  return (
    <motion.div
      className="jf-filters-panel"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="jf-filters-grid">
        <div className="jf-filter-group">
          <label className="jf-filter-label">
            <FiMapPin /> Location
          </label>
          <input
            type="text"
            className="jf-filter-input"
            placeholder="e.g., New York, Remote, London..."
            value={filters.location || ''}
            onChange={(e) => onFilterChange('location', e.target.value)}
          />
        </div>

        <div className="jf-filter-group">
          <label className="jf-filter-label">
            <FiClock /> Date Posted
          </label>
          <select
            className="jf-filter-select"
            value={filters.datePosted || 'all'}
            onChange={(e) => onFilterChange('datePosted', e.target.value)}
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="3days">Last 3 days</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
        </div>

        <div className="jf-filter-group">
          <label className="jf-filter-label">
            <FiBriefcase /> Employment Type
          </label>
          <select
            className="jf-filter-select"
            value={filters.employmentType || ''}
            onChange={(e) => onFilterChange('employmentType', e.target.value)}
          >
            <option value="">All types</option>
            <option value="FULLTIME">Full-time</option>
            <option value="PARTTIME">Part-time</option>
            <option value="CONTRACTOR">Contract</option>
            <option value="INTERN">Internship</option>
          </select>
        </div>

        <div className="jf-filter-group">
          <label className="jf-filter-label">
            <FiStar /> Experience Level
          </label>
          <select
            className="jf-filter-select"
            value={filters.experienceLevel || ''}
            onChange={(e) => onFilterChange('experienceLevel', e.target.value)}
          >
            <option value="">All levels</option>
            <option value="under_3_years_experience">Entry Level (0-3 yrs)</option>
            <option value="more_than_3_years_experience">Mid Level (3+ yrs)</option>
            <option value="no_experience">No experience required</option>
          </select>
        </div>

        <div className="jf-filter-group">
          <label className="jf-filter-label">
            <FiGlobe /> Remote Only
          </label>
          <label className="jf-toggle-wrapper">
            <input
              type="checkbox"
              checked={filters.remoteOnly || false}
              onChange={(e) => onFilterChange('remoteOnly', e.target.checked)}
            />
            <span className="jf-toggle-slider"></span>
            <span className="jf-toggle-label">{filters.remoteOnly ? 'Yes' : 'No'}</span>
          </label>
        </div>
      </div>

      <button className="jf-filter-reset" onClick={onReset}>
        <FiRefreshCw /> Reset Filters
      </button>
    </motion.div>
  );
}

// ─── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job, index, isBookmarked, onBookmark, onGenerateCoverLetter, isGenerating }) {
  const [expanded, setExpanded] = useState(false);

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const formatSalary = (min, max, currency, period) => {
    if (!min && !max) return null;
    const fmt = (n) => {
      if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
      return n.toString();
    };
    const cur = currency || 'USD';
    const per = period ? `/${period.toLowerCase()}` : '/yr';
    if (min && max) return `${cur} ${fmt(min)} - ${fmt(max)}${per}`;
    if (min) return `From ${cur} ${fmt(min)}${per}`;
    return `Up to ${cur} ${fmt(max)}${per}`;
  };

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod);

  return (
    <motion.div
      className={`jf-job-card ${expanded ? 'expanded' : ''}`}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      layout
    >
      <div className="jf-job-card-main">
        <div className="jf-job-card-left">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="jf-company-logo" />
          ) : (
            <div className="jf-company-logo-placeholder">
              {job.company?.charAt(0) || '?'}
            </div>
          )}
          <div className="jf-job-info">
            <h4 className="jf-job-title">{job.title}</h4>
            <p className="jf-company-name">{job.company}</p>
            <div className="jf-job-meta">
              <span className="jf-job-meta-item">
                <FiMapPin /> {job.location}
              </span>
              {job.isRemote && (
                <span className="jf-job-meta-item remote">
                  <FiGlobe /> Remote
                </span>
              )}
              {job.employmentType && (
                <span className="jf-job-meta-item">
                  <FiBriefcase /> {job.employmentType.replace('FULLTIME', 'Full-time').replace('PARTTIME', 'Part-time').replace('CONTRACTOR', 'Contract').replace('INTERN', 'Internship')}
                </span>
              )}
              {salary && (
                <span className="jf-job-meta-item salary">
                  <FiDollarSign /> {salary}
                </span>
              )}
              <span className="jf-job-meta-item">
                <FiClock /> {timeAgo(job.postedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="jf-job-card-actions">
          <button
            className={`jf-action-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={() => onBookmark(job.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
          >
            <FiBookmark />
          </button>
          <button
            className="jf-action-btn cover-letter"
            onClick={() => onGenerateCoverLetter(job)}
            disabled={isGenerating}
            title="Generate AI cover letter"
          >
            {isGenerating ? <FiLoader className="spinning" /> : <FiFileText />}
          </button>
          <a
            href={job.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="jf-apply-btn"
          >
            Apply <FiExternalLink />
          </a>
          <button
            className="jf-expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>
      </div>

      {/* Preview description (always shown) */}
      {!expanded && job.description && (
        <p className="jf-job-preview">{job.description.substring(0, 200)}...</p>
      )}

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="jf-job-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {job.fullDescription && (
              <div className="jf-job-description-full">
                <h5>Job Description</h5>
                <p>{job.fullDescription}</p>
              </div>
            )}
            {job.requiredSkills?.length > 0 && (
              <div className="jf-job-qualifications">
                <h5>Key Qualifications</h5>
                <ul>
                  {job.requiredSkills.map((skill, i) => (
                    <li key={i}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}
            {job.source && (
              <p className="jf-job-source">
                Source: <strong>{job.source}</strong>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Cover Letter Modal ────────────────────────────────────────────────────────
function CoverLetterModal({ coverLetter, jobTitle, company, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="jf-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="jf-modal"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="jf-modal-header">
          <div>
            <h3>✨ AI-Generated Cover Letter</h3>
            <p>{jobTitle} at {company}</p>
          </div>
          <button className="jf-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="jf-modal-body">
          <pre className="jf-cover-letter-text">{coverLetter}</pre>
        </div>
        <div className="jf-modal-footer">
          <button className="jf-modal-btn secondary" onClick={handleCopy}>
            {copied ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy to Clipboard</>}
          </button>
          <button className="jf-modal-btn primary" onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main JobFinder Component ──────────────────────────────────────────────────
export default function JobFinder({ resumeText, analysisResults }) {
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resumeai_bookmarks') || '[]');
    } catch {
      return [];
    }
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [coverLetterModal, setCoverLetterModal] = useState(null);
  const [generatingCoverId, setGeneratingCoverId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('resumeai_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Smart search on mount
  useEffect(() => {
    if (resumeText && !hasSearched) {
      handleSmartSearch();
    }
  }, []);

  const handleSmartSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const result = await smartJobSearch(resumeText, filters, analysisResults);
      setJobs(result.jobs || []);
      setProfile(result.profile || null);
    } catch (err) {
      console.error('Smart search failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resumeText, filters, analysisResults]);

  const handleManualSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const result = await searchJobs(searchQuery, filters);
      setJobs(result.jobs || []);
      setProfile(null);
    } catch (err) {
      console.error('Manual search failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({});
  }, []);

  const handleBookmark = useCallback((jobId) => {
    setBookmarks(prev => {
      if (prev.includes(jobId)) {
        return prev.filter(id => id !== jobId);
      }
      return [...prev, jobId];
    });
  }, []);

  const handleGenerateCoverLetter = useCallback(async (job) => {
    setGeneratingCoverId(job.id);
    try {
      const result = await generateCoverLetter(
        resumeText,
        job.title,
        job.company,
        job.fullDescription || job.description
      );
      setCoverLetterModal({
        coverLetter: result.coverLetter,
        jobTitle: job.title,
        company: job.company,
      });
    } catch (err) {
      console.error('Cover letter generation failed:', err);
      setError('Failed to generate cover letter: ' + err.message);
    } finally {
      setGeneratingCoverId(null);
    }
  }, [resumeText]);

  const displayedJobs = showBookmarksOnly
    ? jobs.filter(job => bookmarks.includes(job.id))
    : jobs;

  return (
    <div className="jf-container" id="job-finder">
      {/* Header */}
      <div className="jf-header">
        <div className="jf-header-left">
          <div className="jf-header-icon">
            <FiBriefcase />
          </div>
          <div>
            <h3 className="jf-header-title">AI Job Finder</h3>
            <p className="jf-header-subtitle">
              {profile
                ? `Found ${jobs.length} jobs matching your ${profile.title || 'profile'}`
                : `Search real job listings from LinkedIn, Indeed & more`
              }
            </p>
          </div>
        </div>
        <div className="jf-header-actions">
          <button
            className={`jf-header-btn ${showBookmarksOnly ? 'active' : ''}`}
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          >
            <FiBookmark /> Saved ({bookmarks.length})
          </button>
          <button
            className={`jf-header-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
          </button>
        </div>
      </div>

      {/* AI Profile Summary */}
      {profile && (
        <motion.div
          className="jf-profile-summary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="jf-profile-badge">
            <FiZap /> AI-Detected Profile
          </div>
          <div className="jf-profile-details">
            <span className="jf-profile-title">{profile.title}</span>
            <span className="jf-profile-level">{profile.experience_level} level</span>
            {profile.preferred_roles?.slice(0, 3).map((role, i) => (
              <span key={i} className="jf-profile-role">{role}</span>
            ))}
          </div>
          {profile.skills?.length > 0 && (
            <div className="jf-profile-skills">
              {profile.skills.slice(0, 10).map((skill, i) => (
                <span key={i} className="jf-profile-skill-tag">{skill}</span>
              ))}
              {profile.skills.length > 10 && (
                <span className="jf-profile-skill-tag more">+{profile.skills.length - 10} more</span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="jf-search-bar">
        <div className="jf-search-input-wrap">
          <FiSearch className="jf-search-icon" />
          <input
            type="text"
            className="jf-search-input"
            placeholder="Search jobs manually (e.g., React Developer, Data Analyst)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          />
        </div>
        <button className="jf-search-btn manual" onClick={handleManualSearch} disabled={loading}>
          <FiSearch /> Search
        </button>
        <button className="jf-search-btn smart" onClick={handleSmartSearch} disabled={loading}>
          <FiZap /> AI Search
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="jf-error">
          <FiAlertTriangle />
          <span>{error}</span>
          <button onClick={() => setError(null)}><FiX /></button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="jf-loading">
          <div className="jf-loading-spinner">
            <FiLoader className="spinning" />
          </div>
          <h4>Searching for your perfect jobs...</h4>
          <p>AI is analyzing your skills and finding the best matches</p>
        </div>
      )}

      {/* Job List */}
      {!loading && displayedJobs.length > 0 && (
        <div className="jf-job-list">
          {displayedJobs.map((job, i) => (
            <JobCard
              key={job.id}
              job={job}
              index={i}
              isBookmarked={bookmarks.includes(job.id)}
              onBookmark={handleBookmark}
              onGenerateCoverLetter={handleGenerateCoverLetter}
              isGenerating={generatingCoverId === job.id}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && hasSearched && displayedJobs.length === 0 && (
        <div className="jf-empty">
          <FiBriefcase />
          <h4>{showBookmarksOnly ? 'No saved jobs yet' : 'No jobs found'}</h4>
          <p>
            {showBookmarksOnly
              ? 'Bookmark jobs you\'re interested in and they\'ll appear here'
              : 'Try adjusting your filters or search with different keywords'
            }
          </p>
        </div>
      )}

      {/* Cover Letter Modal */}
      <AnimatePresence>
        {coverLetterModal && (
          <CoverLetterModal
            coverLetter={coverLetterModal.coverLetter}
            jobTitle={coverLetterModal.jobTitle}
            company={coverLetterModal.company}
            onClose={() => setCoverLetterModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
