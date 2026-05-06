import { useState } from 'react';

const suggestionChips = [
  {
    id: 'platform',
    label: 'What does this platform do?',
    answer:
      'SmartHire helps teams post jobs, upload candidates, review resumes, compare fit, and use AI-assisted scoring to move from screening to shortlist faster.',
  },
  {
    id: 'screen-candidates',
    label: 'How can I screen candidates?',
    answer:
      'Open Candidates to review uploaded profiles, filter by role, compare applicants side by side, and use recruiter decisions plus AI summaries to narrow the shortlist quickly.',
  },
  {
    id: 'ai-scoring',
    label: 'Show AI scoring',
    answer:
      'The AI scoring flow compares a candidate against the selected job and returns a match score, matched skills, missing skills, and a short recommendation so you can review faster.',
  },
  {
    id: 'features',
    label: 'Explain features',
    answer:
      'SmartHire includes job management, candidate uploads, resume parsing support, recruiter review statuses, interview tracking, dashboard analytics, and AI-based scoring in one workflow.',
  },
];

const fallbackReply =
  'SmartGuide can explain the product flow, candidate screening, AI scoring, dashboard areas, and core features. Try one of the suggestion chips for a faster answer.';

function SmartGuideLogo() {
  return (
    <span className="smartguide-logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M8.25 10.25a3.75 3.75 0 0 1 7.5 0v.5a2 2 0 0 0 .42 1.22l.57.74a.95.95 0 0 1-.75 1.54H8a.95.95 0 0 1-.75-1.54l.57-.74a2 2 0 0 0 .43-1.22v-.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path d="M10.35 16.35a1.8 1.8 0 0 0 3.3 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        <path d="M18.15 4.65v2.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        <path d="M17.05 5.75h2.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    </span>
  );
}

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 11.25h12v1.5H6z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.06 8.12 8.12 7.06 12 10.94l3.88-3.88 1.06 1.06L13.06 12l3.88 3.88-1.06 1.06L12 13.06l-3.88 3.88-1.06-1.06L10.94 12 7.06 8.12Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3.75 11.98 15.74-6.43c.72-.29 1.46.45 1.17 1.17l-6.43 15.74c-.31.77-1.43.68-1.63-.14l-1.62-6.52-6.52-1.62c-.82-.2-.91-1.32-.14-1.63Zm8.15 2.12 1.08 4.35 4.57-11.18-11.18 4.57 4.35 1.08 3.95-3.95 1.06 1.06-3.83 4.07Z" fill="currentColor" />
    </svg>
  );
}

function HelpAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [activeAnswer, setActiveAnswer] = useState(suggestionChips[0].answer);
  const [activeChipId, setActiveChipId] = useState(suggestionChips[0].id);

  const greeting = 'Hi! I can help you understand how SmartHire works.';

  const handleSuggestionClick = (chip) => {
    setActiveChipId(chip.id);
    setActiveAnswer(chip.answer);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    const normalized = draft.trim().toLowerCase();
    const matchedChip = suggestionChips.find((chip) => {
      const normalizedLabel = chip.label.toLowerCase().replace(/[?]/g, '');
      return normalized.includes(normalizedLabel) || normalizedLabel.includes(normalized);
    });

    setActiveChipId(matchedChip?.id || '');
    setActiveAnswer(matchedChip?.answer || fallbackReply);
    setDraft('');
  };

  const handleMinimize = () => {
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <div className="smartguide-shell" aria-live="polite">
      {isOpen ? (
        <section id="smartguide-panel" className="smartguide-card" aria-label="SmartGuide assistant">
          <div className="smartguide-card-top">
            <div className="smartguide-badge-icon">
              <SmartGuideLogo />
            </div>
            <div className="smartguide-head-copy">
              <p className="smartguide-kicker">SmartGuide</p>
              <h2 className="smartguide-title">Product guide</h2>
            </div>
            <div className="smartguide-head-actions">
              <button
                type="button"
                className="smartguide-icon-button"
                onClick={handleMinimize}
                aria-label="Minimize SmartGuide"
              >
                <MinimizeIcon />
              </button>
              <button
                type="button"
                className="smartguide-icon-button"
                onClick={handleClose}
                aria-label="Close SmartGuide"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="smartguide-body">
            <div className="smartguide-message smartguide-message-primary">
              <p className="smartguide-message-title">Hi there</p>
              <p className="smartguide-message-copy">{greeting}</p>
            </div>

            <div className="smartguide-chip-wrap" role="list" aria-label="Suggested questions">
              {suggestionChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={`smartguide-chip ${activeChipId === chip.id ? 'smartguide-chip-active' : ''}`}
                  onClick={() => handleSuggestionClick(chip)}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="smartguide-message smartguide-message-secondary">
              <p className="smartguide-answer-label">Quick answer</p>
              <p className="smartguide-message-copy">{activeAnswer}</p>
            </div>

            <form className="smartguide-input-wrap" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="smartguide-input">
                Ask about SmartHire
              </label>
              <input
                id="smartguide-input"
                className="smartguide-input"
                type="text"
                placeholder="Ask about SmartHire"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button className="smartguide-send" type="submit" aria-label="Send SmartGuide message">
                <SendIcon />
              </button>
            </form>
          </div>
        </section>
      ) : (
        <button
          type="button"
          className="smartguide-trigger"
          onClick={handleOpen}
          aria-expanded="false"
          aria-controls="smartguide-panel"
        >
          <span className="smartguide-trigger-mark">
            <SmartGuideLogo />
          </span>
          <span className="smartguide-trigger-copy">
            <span className="smartguide-trigger-title">SmartGuide</span>
            <span className="smartguide-trigger-text">Open assistant</span>
          </span>
        </button>
      )}
    </div>
  );
}

export default HelpAssistant;
