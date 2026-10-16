import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extract text from a PDF file.
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - The extracted text
 */
export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}

/**
 * Extract text from a plain text file.
 * @param {File} file - The text file
 * @returns {Promise<string>} - The file content
 */
export async function extractTextFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Extract text from an uploaded file (PDF or text).
 * @param {File} file - The uploaded file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractText(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'pdf') {
    return extractTextFromPDF(file);
  } else if (['txt', 'md', 'doc', 'docx'].includes(extension)) {
    // For .doc/.docx, we can only do basic text extraction
    return extractTextFromFile(file);
  } else {
    throw new Error(`Unsupported file format: .${extension}`);
  }
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
