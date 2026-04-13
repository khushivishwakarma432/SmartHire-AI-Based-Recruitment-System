import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { uploadCandidate } from '../api/candidates';
import { getJobs } from '../api/jobs';
import AppShell from '../components/AppShell';
import { useNotifications } from '../components/NotificationProvider';
import { useToast } from '../components/ToastProvider';
import { isUnauthorizedError, removeToken } from '../utils/auth';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const uploadFormSkeletonFields = Array.from({ length: 4 }, (_, index) => index);
const createBulkFormData = () => ({
  appliedJob: '',
  candidateSkills: '',
  candidateSummary: '',
});

const createBulkFileId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const isPdfFile = (file) =>
  Boolean(file) &&
  file.type === 'application/pdf' &&
  /\.pdf$/i.test(String(file.name || ''));

const formatFileSize = (size) => {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const inferFullNameFromFileName = (fileName) => {
  const baseName = String(fileName || '')
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!baseName) {
    return '';
  }

  return baseName
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getBulkFileFingerprint = (file) =>
  `${String(file?.name || '').toLowerCase()}-${file?.size || 0}-${file?.lastModified || 0}`;

const getRequestErrorMessage = (requestError) =>
  [requestError?.message, requestError?.details].filter(Boolean).join(' ') || 'Upload failed.';

const validateCandidateInput = ({ fullName, email, phone, appliedJob, resumeFile }) => {
  const normalizedFullName = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();
  const normalizedAppliedJob = String(appliedJob || '').trim();

  if (!normalizedFullName || !normalizedEmail || !normalizedPhone || !normalizedAppliedJob) {
    return 'Full name, email, phone, and job selection are required.';
  }

  if (!isValidEmail(normalizedEmail)) {
    return 'Please enter a valid candidate email address.';
  }

  if (!resumeFile) {
    return 'Please upload a PDF resume.';
  }

  if (!isPdfFile(resumeFile)) {
    return 'Only PDF files are allowed.';
  }

  return '';
};

const buildUploadPayload = ({
  fullName,
  email,
  phone,
  appliedJob,
  candidateSkills,
  candidateSummary,
  resumeFile,
}) => {
  const payload = new FormData();
  payload.append('fullName', String(fullName || '').trim());
  payload.append('email', String(email || '').trim().toLowerCase());
  payload.append('phone', String(phone || '').trim());
  payload.append('appliedJob', String(appliedJob || '').trim());
  payload.append('candidateSkills', String(candidateSkills || '').trim());
  payload.append('candidateSummary', String(candidateSummary || '').trim());
  payload.append('resume', resumeFile);
  return payload;
};

const getParsingWarningMessage = (candidate, parsing) => {
  const parsingStatus = candidate?.resumeParsingStatus || parsing?.status || '';

  if (!parsingStatus || parsingStatus === 'parsed') {
    return '';
  }

  return (
    candidate?.resumeParsingDetails ||
    parsing?.details ||
    'Resume parsing quality was limited, but the candidate was still saved successfully.'
  );
};

const createBulkFileEntry = (file, seenFingerprints) => {
  const fingerprint = getBulkFileFingerprint(file);
  let error = '';

  if (!isPdfFile(file)) {
    error = 'Only PDF files are allowed.';
  } else if (seenFingerprints.has(fingerprint)) {
    error = 'This file is already in the current batch.';
  }

  seenFingerprints.add(fingerprint);

  return {
    id: createBulkFileId(),
    fingerprint,
    file,
    fullName: inferFullNameFromFileName(file?.name),
    email: '',
    phone: '',
    progress: 0,
    status: error ? 'failed' : 'queued',
    error,
    parsingWarning: '',
    candidate: null,
    isBlocked: Boolean(error),
  };
};

const getBulkStatusMeta = (entry, appliedJob) => {
  if (entry.status === 'uploading') {
    return { label: 'Uploading', tone: 'uploading' };
  }

  if (entry.status === 'success') {
    return {
      label: entry.parsingWarning ? 'Uploaded with warning' : 'Success',
      tone: 'success',
    };
  }

  if (entry.status === 'failed') {
    return { label: 'Failed', tone: 'failed' };
  }

  if (validateCandidateInput({ ...entry, appliedJob, resumeFile: entry.file })) {
    return { label: 'Needs details', tone: 'pending' };
  }

  return { label: 'Ready', tone: 'pending' };
};

const yieldToBrowser = () =>
  new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });

function UploadCandidate() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const isBulkUploadLockedRef = useRef(false);
  const [jobs, setJobs] = useState([]);
  const [uploadMode, setUploadMode] = useState('single');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    appliedJob: '',
    candidateSkills: '',
    candidateSummary: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [bulkFormData, setBulkFormData] = useState(createBulkFormData);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [isBulkDragActive, setIsBulkDragActive] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSummary, setBulkSummary] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [lastUploadedCandidate, setLastUploadedCandidate] = useState(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await getJobs();
        setJobs(data.jobs || []);
      } catch (requestError) {
        if (isUnauthorizedError(requestError)) {
          removeToken();
          navigate('/login', { replace: true });
          return;
        }

        setError(requestError.message);
        setBulkError(requestError.message);
        showToast({
          title: 'Unable to load jobs',
          message: requestError.message,
          type: 'error',
        });
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobs();
  }, [navigate, showToast]);

  const validBulkFiles = bulkFiles.filter((entry) => !entry.isBlocked);
  const uploadableBulkFiles = bulkFiles.filter((entry) => !entry.isBlocked && entry.status !== 'success');
  const blockedBulkFileCount = bulkFiles.filter((entry) => entry.isBlocked).length;
  const completedBulkFileCount = validBulkFiles.filter(
    (entry) => entry.status === 'success' || entry.status === 'failed',
  ).length;
  const successfulBulkFileCount = validBulkFiles.filter((entry) => entry.status === 'success').length;
  const failedBulkFileCount = validBulkFiles.filter((entry) => entry.status === 'failed').length;
  const overallBulkProgress = validBulkFiles.length
    ? Math.round((completedBulkFileCount / validBulkFiles.length) * 100)
    : 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError('');
    setSuccessMessage('');
    setLastUploadedCandidate(null);
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (file && !isPdfFile(file)) {
      setResumeFile(null);
      const message = 'Only PDF files are allowed.';
      setError(message);
      showToast({ title: 'Upload blocked', message, type: 'error' });
      setSuccessMessage('');
      setLastUploadedCandidate(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError('');
    setSuccessMessage('');
    setLastUploadedCandidate(null);
    setResumeFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || isLoadingJobs || jobs.length === 0) {
      return;
    }

    setError('');
    setSuccessMessage('');

    const validationMessage = validateCandidateInput({
      ...formData,
      resumeFile,
    });

    if (validationMessage) {
      setError(validationMessage);
      showToast({ title: 'Upload blocked', message: validationMessage, type: 'error' });
      return;
    }

    const normalizedFullName = formData.fullName.trim();
    const normalizedAppliedJob = formData.appliedJob.trim();
    const payload = buildUploadPayload({
      ...formData,
      resumeFile,
    });

    setIsSubmitting(true);

    try {
      const data = await uploadCandidate(payload);
      setSuccessMessage('Candidate uploaded successfully. You can review the candidate and generate an AI score next.');
      showToast({
        title: 'Candidate uploaded',
        message: 'The candidate has been added to your pipeline.',
        type: 'success',
      });
      addNotification({
        type: 'upload',
        message: `${data.candidate?.fullName || normalizedFullName} was uploaded to your candidate pipeline.`,
        reference: {
          candidateId: data.candidate?._id || '',
          candidateName: data.candidate?.fullName || normalizedFullName,
          jobId: normalizedAppliedJob,
        },
      });
      setLastUploadedCandidate(data.candidate || null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        appliedJob: '',
        candidateSkills: '',
        candidateSummary: '',
      });
      setResumeFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      const message = getRequestErrorMessage(requestError);
      setError(message);
      showToast({
        title: 'Upload failed',
        message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addBulkFiles = (incomingFiles) => {
    const filesToAdd = Array.from(incomingFiles || []);

    if (!filesToAdd.length) {
      return;
    }

    setBulkError('');
    setBulkSummary(null);

    const seenFingerprints = new Set(bulkFiles.map((entry) => entry.fingerprint));
    const nextEntries = filesToAdd.map((file) => createBulkFileEntry(file, seenFingerprints));
    const blockedEntries = nextEntries.filter((entry) => entry.isBlocked);

    setBulkFiles((current) => [...current, ...nextEntries]);

    if (blockedEntries.length) {
      const invalidPdfCount = blockedEntries.filter((entry) => entry.error === 'Only PDF files are allowed.').length;
      const duplicateFileCount = blockedEntries.length - invalidPdfCount;
      const messageParts = [];

      if (invalidPdfCount) {
        messageParts.push(
          `${invalidPdfCount} file${invalidPdfCount === 1 ? ' was' : 's were'} rejected because only PDFs are allowed.`,
        );
      }

      if (duplicateFileCount) {
        messageParts.push(
          `${duplicateFileCount} duplicate file${duplicateFileCount === 1 ? ' was' : 's were'} skipped in this batch.`,
        );
      }

      showToast({
        title: 'Some files need attention',
        message: messageParts.join(' '),
        type: 'error',
      });
    }
  };

  const handleBulkFileChange = (event) => {
    addBulkFiles(event.target.files);

    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const handleBulkDragOver = (event) => {
    event.preventDefault();
    setIsBulkDragActive(true);
  };

  const handleBulkDragLeave = (event) => {
    event.preventDefault();
    setIsBulkDragActive(false);
  };

  const handleBulkDrop = (event) => {
    event.preventDefault();
    setIsBulkDragActive(false);
    addBulkFiles(event.dataTransfer?.files);
  };

  const handleBulkFormChange = (event) => {
    const { name, value } = event.target;
    setBulkError('');
    setBulkSummary(null);
    setBulkFormData((current) => ({ ...current, [name]: value }));
  };

  const handleBulkFileFieldChange = (fileId, field, value) => {
    setBulkError('');
    setBulkSummary(null);
    setBulkFiles((current) =>
      current.map((entry) =>
        entry.id === fileId
          ? {
              ...entry,
              [field]: value,
              status: entry.isBlocked ? entry.status : entry.status === 'success' ? entry.status : 'queued',
              error: entry.isBlocked ? entry.error : '',
              parsingWarning: entry.status === 'success' ? entry.parsingWarning : '',
              progress: entry.status === 'success' ? 100 : 0,
            }
          : entry,
      ),
    );
  };

  const handleRemoveBulkFile = (fileId) => {
    setBulkError('');
    setBulkSummary(null);
    setBulkFiles((current) => current.filter((entry) => entry.id !== fileId));
  };

  const handleClearBulkFiles = () => {
    if (isBulkSubmitting) {
      return;
    }

    setBulkError('');
    setBulkSummary(null);
    setBulkFiles([]);
  };

  const handleBulkSubmit = async (event) => {
    event.preventDefault();

    if (isBulkSubmitting || isBulkUploadLockedRef.current || isLoadingJobs || jobs.length === 0) {
      return;
    }

    const normalizedAppliedJob = String(bulkFormData.appliedJob || '').trim();

    if (!normalizedAppliedJob) {
      const message = 'Please select a job before starting the bulk upload.';
      setBulkError(message);
      showToast({ title: 'Bulk upload blocked', message, type: 'error' });
      return;
    }

    if (!validBulkFiles.length) {
      const message = 'Please add at least one valid PDF resume.';
      setBulkError(message);
      showToast({ title: 'Bulk upload blocked', message, type: 'error' });
      return;
    }

    const filesToUpload = bulkFiles.filter((entry) => !entry.isBlocked && entry.status !== 'success');

    if (!filesToUpload.length) {
      const message = 'All valid files in this batch have already been uploaded.';
      setBulkError(message);
      showToast({ title: 'Nothing to upload', message, type: 'info' });
      return;
    }

    setBulkError('');
    setBulkSummary(null);
    isBulkUploadLockedRef.current = true;
    setIsBulkSubmitting(true);

    let successCount = 0;
    let failedCount = 0;
    let parsingWarningCount = 0;
    const skippedCount = blockedBulkFileCount;

    try {
      for (const entry of filesToUpload) {
        const validationMessage = validateCandidateInput({
          ...entry,
          appliedJob: normalizedAppliedJob,
          resumeFile: entry.file,
        });

        if (validationMessage) {
          failedCount += 1;
          setBulkFiles((current) =>
            current.map((item) =>
              item.id === entry.id
                ? {
                    ...item,
                    status: 'failed',
                    error: validationMessage,
                    parsingWarning: '',
                    progress: 0,
                  }
                : item,
            ),
          );
          continue;
        }

        setBulkFiles((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: 'uploading',
                  error: '',
                  parsingWarning: '',
                  progress: 0,
                }
              : item,
          ),
        );

        await yieldToBrowser();

        try {
          const data = await uploadCandidate(
            buildUploadPayload({
              ...entry,
              appliedJob: normalizedAppliedJob,
              candidateSkills: bulkFormData.candidateSkills,
              candidateSummary: bulkFormData.candidateSummary,
              resumeFile: entry.file,
            }),
            {
              onProgress: (progress) => {
                setBulkFiles((current) =>
                  current.map((item) =>
                    item.id === entry.id
                      ? {
                          ...item,
                          progress: Math.max(item.progress, Math.min(progress, 100)),
                        }
                      : item,
                  ),
                );
              },
            },
          );

          const parsingWarning = getParsingWarningMessage(data.candidate, data.parsing);

          if (parsingWarning) {
            parsingWarningCount += 1;
          }

          successCount += 1;
          setBulkFiles((current) =>
            current.map((item) =>
              item.id === entry.id
                ? {
                    ...item,
                    status: 'success',
                    error: '',
                    parsingWarning,
                    progress: 100,
                    candidate: data.candidate || null,
                  }
                : item,
            ),
          );
        } catch (requestError) {
          if (isUnauthorizedError(requestError)) {
            removeToken();
            navigate('/login', { replace: true });
            return;
          }

          failedCount += 1;
          setBulkFiles((current) =>
            current.map((item) =>
              item.id === entry.id
                ? {
                    ...item,
                    status: 'failed',
                    error: getRequestErrorMessage(requestError),
                    parsingWarning: '',
                    progress: 100,
                  }
                : item,
            ),
          );
        }
      }

      setBulkSummary({
        successCount,
        failedCount,
        skippedCount,
        parsingWarningCount,
      });

      showToast({
        title: 'Bulk upload finished',
        message: `${successCount} uploaded successfully, ${failedCount} failed${skippedCount ? `, ${skippedCount} skipped` : ''}.`,
        type: failedCount ? 'info' : 'success',
      });

      if (successCount) {
        addNotification({
          type: 'upload',
          message: `Bulk upload finished: ${successCount} candidate${successCount === 1 ? '' : 's'} added to your pipeline.`,
          reference: {
            candidateId: '',
            candidateName: '',
            jobId: normalizedAppliedJob,
          },
        });
      }
    } finally {
      isBulkUploadLockedRef.current = false;
      setIsBulkSubmitting(false);
    }
  };

  const modeToggle = (
    <div className="upload-mode-toggle">
      <button
        className={`upload-mode-toggle-button ${uploadMode === 'single' ? 'upload-mode-toggle-button-active' : ''}`}
        type="button"
        onClick={() => setUploadMode('single')}
        disabled={isSubmitting || isBulkSubmitting}
      >
        Single Upload
      </button>
      <button
        className={`upload-mode-toggle-button ${uploadMode === 'bulk' ? 'upload-mode-toggle-button-active' : ''}`}
        type="button"
        onClick={() => setUploadMode('bulk')}
        disabled={isSubmitting || isBulkSubmitting}
      >
        Bulk Upload
      </button>
    </div>
  );

  return (
    <AppShell
      title="Upload Candidate"
      description="Upload one candidate at a time or process a compact PDF batch without changing the rest of the hiring flow."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary btn-compact" to="/jobs">
            View jobs
          </Link>
        </div>
      }
    >
      {isLoadingJobs ? (
        <div className="panel space-y-5">
          <div className="flex flex-col gap-2.5 border-b border-slate-200 pb-4">
            <div className="skeleton-line w-28" />
            <div>
              <div className="skeleton-line h-7 w-52" />
              <div className="mt-3 space-y-2">
                <div className="skeleton-line w-full" />
                <div className="skeleton-line w-10/12" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {uploadFormSkeletonFields.map((field) => (
              <div key={field}>
                <div className="mb-2 skeleton-line w-24" />
                <div className="skeleton h-11 rounded-2xl" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="mb-2 skeleton-line w-36" />
              <div className="skeleton h-11 rounded-2xl" />
              <div className="mt-2 skeleton-line w-48" />
            </div>
            <div>
              <div className="mb-2 skeleton-line w-40" />
              <div className="skeleton h-32 rounded-2xl" />
              <div className="mt-2 skeleton-line w-56" />
            </div>
          </div>

          <div>
            <div className="mb-2 skeleton-line w-28" />
            <div className="skeleton h-14 rounded-2xl" />
            <div className="mt-2 skeleton-line w-64" />
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-2">
            <div className="skeleton-button w-32" />
          </div>
        </div>
      ) : null}

      {!isLoadingJobs && jobs.length === 0 ? (
        <div className="empty-state">
          <p className="kicker">Candidate Intake</p>
          <h2 className="title-lg">Create a job before uploading candidates</h2>
          <p className="body-muted mt-2">
            SmartHire needs an active role before a candidate can be attached to your pipeline.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link className="btn-primary btn-compact" to="/jobs/create">
              Create job
            </Link>
            <Link className="btn-secondary btn-compact" to="/jobs">
              View jobs
            </Link>
          </div>
        </div>
      ) : null}

      {!isLoadingJobs && jobs.length > 0 && uploadMode === 'single' ? (
      <form className="panel space-y-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="kicker">Candidate Intake</p>
            <div>
              <h2 className="title-lg">Candidate details</h2>
              <p className="body-muted mt-2">
                Capture basic applicant information and upload a readable resume for screening.
              </p>
            </div>
          </div>
          {modeToggle}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="field-label">Full Name</span>
            <input
              className="input-field"
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Candidate name"
            />
          </label>

          <label className="block">
            <span className="field-label">Email</span>
            <input
              className="input-field"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="candidate@example.com"
            />
          </label>

          <label className="block">
            <span className="field-label">Phone</span>
            <input
              className="input-field"
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
            />
          </label>

          <label className="block">
            <span className="field-label">Select Job</span>
            <select
              className="input-field"
              name="appliedJob"
              required
              value={formData.appliedJob}
              onChange={handleChange}
              disabled={isLoadingJobs}
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} - {job.department}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <label className="block">
            <span className="field-label">Candidate Skills (Optional)</span>
            <input
              className="input-field"
              type="text"
              name="candidateSkills"
              value={formData.candidateSkills}
              onChange={handleChange}
              placeholder="React, Node.js, Communication"
            />
            <span className="mt-2 block text-xs text-slate-500">
              Add comma-separated skills as a fallback if resume text quality is weak.
            </span>
          </label>

          <label className="block">
            <span className="field-label">Candidate Summary (Optional)</span>
            <textarea
              className="input-field min-h-32 resize-y"
              name="candidateSummary"
              value={formData.candidateSummary}
              onChange={handleChange}
              placeholder="Short recruiter summary of the candidate background, experience, and strengths."
            />
            <span className="mt-2 block text-xs text-slate-500">
              Useful for demo scoring when a PDF is scanned, image-based, or only partially readable.
            </span>
          </label>
        </div>

        <label className="block">
          <span className="field-label">Resume Upload</span>
          <input
            ref={fileInputRef}
            className="input-field input-file-field"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
          />
          <span className="mt-2 block text-xs text-slate-500">
            Only PDF files are allowed. Uploaded resumes stay connected to this candidate profile.
          </span>
        </label>

        {error ? <p className="alert-error">{error}</p> : null}

        {successMessage ? (
          <div className="space-y-2.5">
            <p className="alert-success">{successMessage}</p>
            {lastUploadedCandidate?.resumeParsingStatus &&
            lastUploadedCandidate.resumeParsingStatus !== 'parsed' ? (
              <p className="alert-info">
                Resume parsing quality: {lastUploadedCandidate.resumeParsingStatus}.{' '}
                {lastUploadedCandidate.resumeParsingDetails ||
                  'SmartHire saved the candidate and can still use manual candidate details during scoring.'}
              </p>
            ) : null}
            {lastUploadedCandidate ? (
              <div className="flex flex-wrap gap-2">
                <Link className="btn-secondary btn-compact" to="/candidates">
                  View candidates
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end border-t border-slate-200 pt-2">
          <button
            className="btn-primary btn-compact disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSubmitting || isLoadingJobs || jobs.length === 0}
          >
            {isSubmitting ? 'Uploading...' : 'Upload candidate'}
          </button>
        </div>
      </form>
      ) : null}

      {!isLoadingJobs && jobs.length > 0 && uploadMode === 'bulk' ? (
      <form className="panel space-y-5" onSubmit={handleBulkSubmit}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="kicker">Candidate Intake</p>
            <div>
              <h2 className="title-lg">Bulk resume upload</h2>
              <p className="body-muted mt-2">
                Add multiple PDF resumes, complete the compact candidate list, and SmartHire will upload each file one by one.
              </p>
            </div>
          </div>
          {modeToggle}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="field-label">Select Job</span>
            <select
              className="input-field"
              name="appliedJob"
              required
              value={bulkFormData.appliedJob}
              onChange={handleBulkFormChange}
              disabled={isBulkSubmitting}
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} - {job.department}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              className="btn-secondary btn-compact"
              type="button"
              onClick={() => bulkFileInputRef.current?.click()}
              disabled={isBulkSubmitting}
            >
              Select PDFs
            </button>
            <button
              className="btn-secondary btn-compact"
              type="button"
              onClick={handleClearBulkFiles}
              disabled={isBulkSubmitting || !bulkFiles.length}
            >
              Clear list
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <label className="block">
            <span className="field-label">Shared Candidate Skills (Optional)</span>
            <input
              className="input-field"
              type="text"
              name="candidateSkills"
              value={bulkFormData.candidateSkills}
              onChange={handleBulkFormChange}
              placeholder="React, Node.js, Communication"
              disabled={isBulkSubmitting}
            />
            <span className="mt-2 block text-xs text-slate-500">
              Applied to every file in this batch as fallback evidence if resume text is weak.
            </span>
          </label>

          <label className="block">
            <span className="field-label">Shared Candidate Summary (Optional)</span>
            <textarea
              className="input-field min-h-28 resize-y"
              name="candidateSummary"
              value={bulkFormData.candidateSummary}
              onChange={handleBulkFormChange}
              placeholder="Optional recruiter note applied to each batch upload."
              disabled={isBulkSubmitting}
            />
            <span className="mt-2 block text-xs text-slate-500">
              Keep this short. It is saved alongside each candidate without affecting the existing scoring flow.
            </span>
          </label>
        </div>

        <div
          className={`bulk-dropzone ${isBulkDragActive ? 'bulk-dropzone-active' : ''}`}
          onDragOver={handleBulkDragOver}
          onDragLeave={handleBulkDragLeave}
          onDrop={handleBulkDrop}
        >
          <input
            ref={bulkFileInputRef}
            className="hidden"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleBulkFileChange}
          />
          <div className="bulk-dropzone-copy">
            <p className="bulk-dropzone-title">Drag and drop PDF resumes here</p>
            <p className="bulk-dropzone-text">
              Or browse multiple files at once. Invalid or duplicate files will be flagged without stopping the rest of the batch.
            </p>
          </div>
          <button
            className="btn-primary btn-compact"
            type="button"
            onClick={() => bulkFileInputRef.current?.click()}
            disabled={isBulkSubmitting}
          >
            Add files
          </button>
        </div>

        <div className="panel-muted space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="field-label mb-1">Batch progress</p>
              <p className="text-sm text-slate-600">
                {completedBulkFileCount} of {validBulkFiles.length} valid files completed
                {blockedBulkFileCount ? `, ${blockedBulkFileCount} skipped` : ''}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge-muted">Ready {uploadableBulkFiles.filter((entry) => entry.status === 'queued').length}</span>
              <span className="badge-muted">Success {successfulBulkFileCount}</span>
              <span className="badge-muted">Failed {failedBulkFileCount}</span>
            </div>
          </div>
          <div className="bulk-overall-progress" aria-hidden="true">
            <span style={{ width: `${overallBulkProgress}%` }} />
          </div>
        </div>

        {bulkFiles.length ? (
          <div className="bulk-file-list">
            {bulkFiles.map((entry) => {
              const statusMeta = getBulkStatusMeta(entry, bulkFormData.appliedJob);

              return (
                <div className="bulk-file-row" key={entry.id}>
                  <div className="bulk-file-row-head">
                    <div className="min-w-0">
                      <p className="bulk-file-name" title={entry.file.name}>
                        {entry.file.name}
                      </p>
                      <p className="bulk-file-meta">{formatFileSize(entry.file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`bulk-status-chip bulk-status-chip-${statusMeta.tone}`}>{statusMeta.label}</span>
                      <button
                        className="bulk-file-remove"
                        type="button"
                        onClick={() => handleRemoveBulkFile(entry.id)}
                        disabled={isBulkSubmitting}
                        aria-label={`Remove ${entry.file.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      className="input-field min-w-0"
                      type="text"
                      value={entry.fullName}
                      onChange={(event) => handleBulkFileFieldChange(entry.id, 'fullName', event.target.value)}
                      placeholder="Full name"
                      disabled={isBulkSubmitting || entry.status === 'success'}
                    />
                    <input
                      className="input-field min-w-0"
                      type="email"
                      value={entry.email}
                      onChange={(event) => handleBulkFileFieldChange(entry.id, 'email', event.target.value)}
                      placeholder="candidate@example.com"
                      disabled={isBulkSubmitting || entry.status === 'success'}
                    />
                    <input
                      className="input-field min-w-0"
                      type="text"
                      value={entry.phone}
                      onChange={(event) => handleBulkFileFieldChange(entry.id, 'phone', event.target.value)}
                      placeholder="+91 9876543210"
                      disabled={isBulkSubmitting || entry.status === 'success'}
                    />
                  </div>

                  <div className="bulk-progress-track" aria-hidden="true">
                    <span
                      className={`bulk-progress-fill bulk-progress-fill-${statusMeta.tone}`}
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>

                  {entry.error ? <p className="bulk-row-message bulk-row-message-error">{entry.error}</p> : null}
                  {entry.parsingWarning ? (
                    <p className="bulk-row-message bulk-row-message-warning">{entry.parsingWarning}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="panel-muted py-6 text-center text-sm text-slate-500">
            Add one or more PDF resumes to start building the batch.
          </div>
        )}

        {bulkError ? <p className="alert-error">{bulkError}</p> : null}

        {bulkSummary ? (
          <div className="space-y-2.5">
            <p className={bulkSummary.failedCount ? 'alert-info' : 'alert-success'}>
              {bulkSummary.successCount} uploaded successfully, {bulkSummary.failedCount} failed
              {bulkSummary.skippedCount ? `, ${bulkSummary.skippedCount} skipped` : ''}.
            </p>
            {bulkSummary.parsingWarningCount ? (
              <p className="alert-info">
                {bulkSummary.parsingWarningCount} uploaded candidate
                {bulkSummary.parsingWarningCount === 1 ? '' : 's'} had limited resume parsing quality, but the records were still saved.
              </p>
            ) : null}
            {bulkSummary.successCount ? (
              <div className="flex flex-wrap gap-2">
                <Link className="btn-secondary btn-compact" to="/candidates">
                  View candidates
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end border-t border-slate-200 pt-2">
          <button
            className="btn-primary btn-compact disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isBulkSubmitting || isLoadingJobs || jobs.length === 0 || !bulkFiles.length || !validBulkFiles.length}
          >
            {isBulkSubmitting ? 'Uploading batch...' : 'Start bulk upload'}
          </button>
        </div>
      </form>
      ) : null}
    </AppShell>
  );
}

export default UploadCandidate;
