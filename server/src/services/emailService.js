const nodemailer = require('nodemailer');

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      console.warn('Email configuration is missing. Skipping email notification.');
      return;
    }

    if (!to) {
      console.warn('Email recipient is missing. Skipping email notification.');
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.warn(`Email notification failed: ${error.message}`);
  }
};

const sendCandidateUploadedEmail = async ({ to, candidateName, jobTitle }) => {
  const safeCandidateName = escapeHtml(candidateName);
  const safeJobTitle = escapeHtml(jobTitle);

  await sendEmail({
    to,
    subject: 'SmartHire: Candidate Uploaded',
    text: `A new candidate has been uploaded.\n\nCandidate: ${candidateName}\nJob: ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">Candidate Uploaded</h2>
        <p style="margin: 0 0 8px;">A new candidate has been uploaded in SmartHire.</p>
        <p style="margin: 0 0 6px;"><strong>Candidate:</strong> ${safeCandidateName}</p>
        <p style="margin: 0;"><strong>Job:</strong> ${safeJobTitle}</p>
      </div>
    `,
  });
};

const sendScoreGeneratedEmail = async ({ to, candidateName, jobTitle, score }) => {
  const safeCandidateName = escapeHtml(candidateName);
  const safeJobTitle = escapeHtml(jobTitle);

  await sendEmail({
    to,
    subject: 'SmartHire: AI Score Generated',
    text: `An AI score has been generated.\n\nCandidate: ${candidateName}\nJob: ${jobTitle}\nScore: ${score}/100`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 12px;">AI Score Generated</h2>
        <p style="margin: 0 0 8px;">A new AI screening score is available in SmartHire.</p>
        <p style="margin: 0 0 6px;"><strong>Candidate:</strong> ${safeCandidateName}</p>
        <p style="margin: 0 0 6px;"><strong>Job:</strong> ${safeJobTitle}</p>
        <p style="margin: 0;"><strong>Score:</strong> ${escapeHtml(`${score}/100`)}</p>
      </div>
    `,
  });
};

module.exports = {
  sendCandidateUploadedEmail,
  sendScoreGeneratedEmail,
};
