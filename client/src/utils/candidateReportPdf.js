import { jsPDF } from 'jspdf';

const PAGE = {
  width: 210,
  height: 297,
  marginX: 18,
  marginTop: 18,
  marginBottom: 16,
};

const COLORS = {
  text: [15, 23, 42],
  muted: [71, 85, 105],
  soft: [100, 116, 139],
  border: [226, 232, 240],
  accent: [3, 105, 161],
  accentSoft: [241, 245, 249],
  successSoft: [240, 253, 244],
  slateSoft: [248, 250, 252],
  white: [255, 255, 255],
};

const sanitizeFilenamePart = (value) =>
  String(value || 'Candidate')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'Candidate';

const formatDisplayValue = (value, fallback = 'Not available') => {
  const normalizedValue = String(value || '').trim();
  return normalizedValue || fallback;
};

const formatListValue = (values = [], fallback = 'None noted') => {
  const normalizedValues = Array.isArray(values)
    ? values.map((value) => String(value || '').trim()).filter(Boolean)
    : [];

  return normalizedValues.length ? normalizedValues.join(', ') : fallback;
};

const normalizeLineBreaks = (value) => String(value || '').replace(/\r\n/g, '\n').trim();

const addWrappedText = (doc, text, x, y, maxWidth, options = {}) => {
  const {
    fontSize = 10,
    color = COLORS.text,
    lineGap = 4.8,
    font = 'helvetica',
    style = 'normal',
  } = options;
  const content = String(text || '').trim();

  if (!content) {
    return y;
  }

  doc.setFont(font, style);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);

  const paragraphs = normalizeLineBreaks(content)
    .split('\n')
    .flatMap((paragraph) => doc.splitTextToSize(paragraph || ' ', maxWidth));
  const lines = paragraphs.length ? paragraphs : [''];
  doc.text(lines, x, y);
  return y + Math.max(lines.length, 1) * lineGap;
};

const ensurePageSpace = (doc, y, neededHeight = 16) => {
  if (y + neededHeight <= PAGE.height - PAGE.marginBottom) {
    return y;
  }

  doc.addPage();
  return PAGE.marginTop;
};

const getWrappedLineCount = (doc, text, maxWidth) => {
  const content = normalizeLineBreaks(text);

  if (!content) {
    return 1;
  }

  return content
    .split('\n')
    .reduce((count, paragraph) => count + Math.max(doc.splitTextToSize(paragraph || ' ', maxWidth).length, 1), 0);
};

const getFieldHeight = (doc, label, value, width) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.1);
  const labelLines = getWrappedLineCount(doc, label, width);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.1);
  const valueLines = getWrappedLineCount(doc, value, width);

  return labelLines * 4 + valueLines * 4.6 + 4.2;
};

const measureSectionHeight = (doc, title, fields) => {
  const innerWidth = PAGE.width - PAGE.marginX * 2 - 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const titleHeight = getWrappedLineCount(doc, title, innerWidth) * 5.2;

  const fieldsHeight = fields.reduce(
    (total, field) => total + getFieldHeight(doc, field.label, field.value, innerWidth),
    0,
  );

  return Math.max(24, 9 + titleHeight + 3 + fieldsHeight + 3);
};

const drawSection = (doc, title, fields, y, options = {}) => {
  const boxWidth = PAGE.width - PAGE.marginX * 2;
  const innerX = PAGE.marginX + 5;
  const innerWidth = boxWidth - 10;
  const boxHeight = measureSectionHeight(doc, title, fields);
  const safeY = ensurePageSpace(doc, y, boxHeight);

  if (safeY !== y) {
    return drawSection(doc, title, fields, safeY, options);
  }

  doc.setDrawColor(...(options.borderColor || COLORS.border));
  doc.setFillColor(...(options.fillColor || COLORS.white));
  doc.roundedRect(PAGE.marginX, y, boxWidth, boxHeight, 5, 5, 'FD');

  let cursorY = y + 8;

  cursorY = addWrappedText(doc, title, innerX, cursorY, innerWidth, {
    fontSize: 12,
    color: COLORS.accent,
    lineGap: 5.2,
    style: 'bold',
  });

  cursorY += 2;

  fields.forEach((field) => {
    cursorY = addWrappedText(doc, field.label, innerX, cursorY, innerWidth, {
      fontSize: 9.1,
      color: COLORS.soft,
      lineGap: 4,
      style: 'bold',
    });
    cursorY = addWrappedText(doc, field.value, innerX, cursorY, innerWidth, {
      fontSize: field.emphasis ? 10.6 : 10.1,
      color: field.color || COLORS.text,
      lineGap: 4.6,
      style: field.emphasis ? 'bold' : 'normal',
    });
    cursorY += 2.6;
  });

  return y + boxHeight + 7;
};

export const downloadCandidateReportPdf = async ({
  candidate,
  scoreEntry,
  recommendation,
  recruiterStatus,
}) => {
  if (!candidate || !scoreEntry || !recommendation) {
    throw new Error('Candidate report data is incomplete.');
  }

  const recruiterDecision = formatDisplayValue(recruiterStatus, 'Pending Review');
  const reportSummary = formatDisplayValue(
    scoreEntry.summary,
    'Detailed AI summary was not returned for this score.',
  );
  const matchedSkills = formatListValue(scoreEntry.matchedSkills, 'No matched skills returned');
  const missingSkills = formatListValue(scoreEntry.missingSkills, 'No missing skills returned');

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  let y = PAGE.marginTop;
  const contentWidth = PAGE.width - PAGE.marginX * 2;
  const hasInterviewDetails = Boolean(
    candidate.interviewDate ||
      candidate.interviewTime ||
      candidate.interviewMode ||
      candidate.interviewLocation ||
      candidate.interviewStatus,
  );

  doc.setFillColor(...COLORS.accentSoft);
  doc.roundedRect(PAGE.marginX, y, contentWidth, 24, 5, 5, 'F');
  y += 7;

  y = addWrappedText(doc, 'SMARTHIRE', PAGE.marginX + 5, y, contentWidth - 10, {
    fontSize: 9,
    color: COLORS.accent,
    lineGap: 4.2,
    style: 'bold',
  });

  y = addWrappedText(doc, 'Candidate Evaluation Report', PAGE.marginX + 5, y + 1, contentWidth - 10, {
    fontSize: 17,
    color: COLORS.text,
    lineGap: 6.6,
    style: 'bold',
  });

  y = addWrappedText(
    doc,
    'Production-ready recruiter export generated from the current SmartHire candidate view.',
    PAGE.marginX + 5,
    y + 0.8,
    contentWidth - 10,
    {
      fontSize: 9.4,
      color: COLORS.muted,
      lineGap: 4.4,
    },
  );

  y += 7;

  y = drawSection(
    doc,
    'Candidate Info',
    [
      { label: 'Candidate Name', value: formatDisplayValue(candidate.fullName) },
      { label: 'Email', value: formatDisplayValue(candidate.email) },
      { label: 'Phone', value: formatDisplayValue(candidate.phone, 'Not provided') },
      { label: 'Applied Job', value: formatDisplayValue(candidate.appliedJob?.title) },
    ],
    y,
    { fillColor: COLORS.white },
  );

  y = drawSection(
    doc,
    'AI Evaluation',
    [
      { label: 'AI Score', value: `${scoreEntry.score}/100`, emphasis: true },
      { label: 'Recommendation', value: formatDisplayValue(recommendation.label), emphasis: true },
      {
        label: 'Summary',
        value: reportSummary,
      },
    ],
    y,
    {
      fillColor: COLORS.slateSoft,
    },
  );

  y = drawSection(
    doc,
    'Skills Analysis',
    [
      { label: 'Matched Skills', value: matchedSkills },
      { label: 'Missing Skills', value: missingSkills },
    ],
    y,
    { fillColor: COLORS.white },
  );

  y = drawSection(
    doc,
    'Recruiter Decision',
    [
      { label: 'Recruiter Decision', value: recruiterDecision, emphasis: true },
      {
        label: 'Recruiter Notes',
        value: formatDisplayValue(candidate.recruiterNotes, 'No recruiter notes added.'),
      },
    ],
    y,
    { fillColor: COLORS.slateSoft },
  );

  if (hasInterviewDetails) {
    y = drawSection(
      doc,
      'Interview Details',
      [
        ...(candidate.interviewDate ? [{ label: 'Date', value: candidate.interviewDate }] : []),
        ...(candidate.interviewTime ? [{ label: 'Time', value: candidate.interviewTime }] : []),
        ...(candidate.interviewMode ? [{ label: 'Mode', value: candidate.interviewMode }] : []),
        ...(candidate.interviewLocation ? [{ label: 'Location / Link', value: candidate.interviewLocation }] : []),
        ...(candidate.interviewStatus ? [{ label: 'Status', value: candidate.interviewStatus }] : []),
      ],
      y,
      {
        fillColor: COLORS.successSoft,
      },
    );
  }

  y = ensurePageSpace(doc, y, 14);
  doc.setDrawColor(...COLORS.border);
  doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
  y += 6;

  addWrappedText(doc, 'Generated by SmartHire', PAGE.marginX, y, contentWidth, {
    fontSize: 8.6,
    color: COLORS.soft,
    lineGap: 4,
    style: 'bold',
  });

  const filename = `Candidate-Report-${sanitizeFilenamePart(candidate.fullName)}.pdf`;
  doc.save(filename);
};
