import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFileText, FiX } from 'react-icons/fi';
import { formatFileSize } from '../services/pdfService';

export default function UploadZone({ file, onFileSelect, onFileRemove, rawText, onRawTextChange }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <section className="upload-section" id="upload-section">
      {/* File drop zone */}
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'active' : ''}`}
        id="upload-dropzone"
      >
        <input {...getInputProps()} id="upload-input" />
        <div className="upload-zone-content">
          <div className="upload-icon-wrapper">
            <FiUploadCloud />
          </div>
          <h3 className="upload-title">
            {isDragActive ? 'Drop your resume here...' : 'Drag & drop your resume'}
          </h3>
          <p className="upload-subtitle">
            or click to browse files from your computer
          </p>
          <div className="upload-formats">
            <span className="format-tag">PDF</span>
            <span className="format-tag">TXT</span>
            <span className="format-tag">MD</span>
          </div>
        </div>
      </div>

      {/* File preview */}
      {file && (
        <div className="file-preview" id="file-preview">
          <div className="file-preview-icon">
            <FiFileText />
          </div>
          <div className="file-preview-info">
            <div className="file-preview-name">{file.name}</div>
            <div className="file-preview-size">{formatFileSize(file.size)}</div>
          </div>
          <button
            className="file-preview-remove"
            onClick={(e) => {
              e.stopPropagation();
              onFileRemove();
            }}
            id="file-remove-btn"
            aria-label="Remove file"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Or paste text */}
      <div className="text-input-section">
        <div className="text-input-divider">or paste your resume text</div>
        <textarea
          className="text-input-area"
          id="resume-text-input"
          placeholder="Paste your resume content here..."
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          rows={8}
        />
      </div>
    </section>
  );
}
