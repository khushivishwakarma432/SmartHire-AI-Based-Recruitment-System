const fs = require('fs/promises');
const path = require('path');

const { PDFParse } = require('pdf-parse');

const MIN_RELIABLE_TEXT_LENGTH = 120;

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const getSignalRatio = (value, pattern) => {
  if (!value) {
    return 0;
  }

  const matches = value.match(pattern);
  return matches ? matches.length / value.length : 0;
};

const getWeakTextReason = (text) => {
  if (!text) {
    return 'No selectable text was found in the PDF. This often means the file is scanned or image-based.';
  }

  const signalRatio = getSignalRatio(text, /[a-zA-Z0-9]/g);
  const symbolRatio = getSignalRatio(text, /[^a-zA-Z0-9\s.,\-()/]/g);

  if (text.length < MIN_RELIABLE_TEXT_LENGTH) {
    return 'Only a small amount of readable text was extracted from the PDF, so resume quality is considered weak.';
  }

  if (signalRatio < 0.45 || symbolRatio > 0.2) {
    return 'Readable text was extracted, but it appears weak or garbled and may not represent the full resume accurately.';
  }

  return '';
};

const extractResumeText = async (filename) => {
  const normalizedFilename = String(filename || '').trim();

  if (!normalizedFilename) {
    const error = new Error('Resume file is missing. Please upload the resume again.');
    error.statusCode = 400;
    throw error;
  }

  const filePath = path.join(__dirname, '../../uploads', normalizedFilename);
  let fileBuffer;

  try {
    fileBuffer = await fs.readFile(filePath);
  } catch (error) {
    const fileError = new Error('The uploaded resume file could not be found. Please upload the resume again.');
    fileError.statusCode = 404;
    throw fileError;
  }

  let parsedPdf;
  let parser;

  try {
    parser = new PDFParse({ data: fileBuffer });
    parsedPdf = await parser.getText();
  } catch (error) {
    console.warn(`Resume PDF parsing failed for ${normalizedFilename}: ${error.message}`);
    return {
      resumeText: '',
      parsingStatus: 'parse_failed',
      details:
        'We could not confidently parse this PDF. The file may use unsupported formatting, contain only scanned images, or be protected.',
      textLength: 0,
    };
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        console.warn(`Resume PDF parser cleanup failed for ${normalizedFilename}: ${error.message}`);
      }
    }
  }

  const resumeText = normalizeText(parsedPdf.text || '');
  const weakTextReason = getWeakTextReason(resumeText);

  console.info(`Resume text extracted for ${normalizedFilename}: ${resumeText.length} characters`);

  if (!resumeText) {
    console.warn(`Resume PDF contains no selectable text: ${normalizedFilename}`);
    return {
      resumeText: '',
      parsingStatus: 'missing_text',
      details:
        'This PDF appears to have no selectable text. It may be scanned or image-based, so SmartHire could not read resume content directly.',
      textLength: 0,
    };
  }

  if (weakTextReason) {
    console.warn(`Resume text quality is weak for ${normalizedFilename}: ${weakTextReason}`);
    return {
      resumeText,
      parsingStatus: 'weak',
      details: weakTextReason,
      textLength: resumeText.length,
    };
  }

  return {
    resumeText,
    parsingStatus: 'parsed',
    details: '',
    textLength: resumeText.length,
  };
};

module.exports = extractResumeText;
