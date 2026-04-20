import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const guideTopics = [
  {
    id: 'overview',
    label: 'What does SmartHire do?',
    answer:
      'SmartHire helps recruiters manage jobs, review candidates, generate AI evaluations, save hiring decisions, and keep interview steps in one workflow.',
    actionLabel: 'Open dashboard',
    actionTo: '/dashboard',
  },
  {
    id: 'create-job',
    label: 'How do I create a job?',
    answer:
      'Open Jobs, choose Create Job, add the role details, required skills, and description, then save. That job becomes the base for candidate uploads and AI scoring.',
    actionLabel: 'Create job',
    actionTo: '/jobs/create',
  },
  {
    id: 'upload',
    label: 'How do I upload a candidate?',
    answer:
      'Open Upload Candidate, choose the job, enter the candidate details, and upload a PDF resume. If the resume is weak or partially readable, the manual candidate fields still help scoring.',
    actionLabel: 'Go to upload',
    actionTo: '/candidates/upload',
  },
  {
    id: 'scoring',
    label: 'How does AI scoring work?',
    answer:
      'SmartHire compares the candidate profile with the selected job and returns a score, fit tag, matched skills, missing skills, and a short summary so recruiters can review faster.',
    actionLabel: 'View candidates',
    actionTo: '/candidates',
  },
];

const supportTopics = [
  {
    id: 'login-issue',
    label: 'Login issue',
    answer:
      'First confirm the backend is running and your credentials are correct. If the page keeps returning to login, try signing out fully, then log back in so SmartHire can refresh the saved session token.',
    actionLabel: 'Open login',
    actionTo: '/login',
  },
  {
    id: 'upload-failed',
    label: 'Resume upload failed',
    answer:
      'Use a readable PDF and make sure a job already exists before uploading. If parsing quality is weak, SmartHire can still use the manual candidate skills and summary fields during scoring.',
    actionLabel: 'Upload candidate',
    actionTo: '/candidates/upload',
  },
  {
    id: 'score-failed',
    label: 'AI score not generating',
    answer:
      'AI scoring can pause if the model is busy, the resume text is missing, or the candidate does not have a valid job attached. Try again from the candidate list after checking the uploaded candidate details.',
    actionLabel: 'Open candidates',
    actionTo: '/candidates',
  },
  {
    id: 'theme-issue',
    label: 'Theme not switching properly',
    answer:
      'Use the theme toggle in the header or sidebar. SmartHire saves the chosen mode locally, so a quick refresh should keep the same theme unless browser storage is cleared.',
    actionLabel: 'Open settings',
    actionTo: '/settings',
  },
  {
    id: 'page-issue',
    label: 'Page not loading correctly',
    answer:
      'If a page looks stuck, refresh first. If the issue only affects protected pages, check whether your login session is still valid and whether the frontend and backend are both running.',
    actionLabel: 'Open dashboard',
    actionTo: '/dashboard',
  },
  {
    id: 'contact-support',
    label: 'Contact support',
    answer:
      'For direct help, use the support contact in the footer. Include the page name, what action you tried, and the exact error message so the issue is easier to trace.',
    actionLabel: 'Contact support',
    actionHref: 'mailto:support@smarthire.ai',
  },
];

const assistantConfig = {
  guide: {
    title: 'SmartGuide',
    subtitle: 'Hiring workflow guide',
    panelLabel: 'Quick answer',
    intro: 'Need help using SmartHire? I can guide you through jobs, candidates, AI scoring, and recruiter actions.',
    inputPlaceholder: 'Ask about SmartHire',
    inputButtonLabel: 'Send SmartGuide question',
    triggerTitle: 'SmartGuide',
    triggerText: 'Open hiring guide',
  },
  support: {
    title: 'Support Desk',
    subtitle: 'Customer help assistant',
    panelLabel: 'Support answer',
    intro: 'Use support topics for login, upload, scoring, theme, and general troubleshooting help.',
    inputPlaceholder: 'Describe the issue for a future support flow',
    inputButtonLabel: 'Send support question',
    triggerTitle: 'Support',
    triggerText: 'Get help with common SmartHire issues.',
  },
};

function HelpAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openAssistant, setOpenAssistant] = useState(null);
  const [selectedGuideTopicId, setSelectedGuideTopicId] = useState('overview');
  const [selectedSupportTopicId, setSelectedSupportTopicId] = useState('login-issue');
  const [guideDraftMessage, setGuideDraftMessage] = useState('');
  const [supportDraftMessage, setSupportDraftMessage] = useState('');

  const activeTopics = openAssistant === 'support' ? supportTopics : guideTopics;
  const activeTopicId = openAssistant === 'support' ? selectedSupportTopicId : selectedGuideTopicId;
  const activeTopic = useMemo(
    () => activeTopics.find((topic) => topic.id === activeTopicId) || activeTopics[0],
    [activeTopicId, activeTopics]
  );

  const activeConfig = assistantConfig[openAssistant || 'guide'];
  const activeDraftMessage = openAssistant === 'support' ? supportDraftMessage : guideDraftMessage;

  const contextualAction = useMemo(() => {
    if (openAssistant === 'support') {
      return { label: 'Close panel', action: () => setOpenAssistant(null) };
    }

    if (location.pathname.startsWith('/candidates')) {
      return { label: 'Go to Candidates', to: '/candidates' };
    }

    if (location.pathname.startsWith('/jobs')) {
      return { label: 'Go to Jobs', to: '/jobs' };
    }

    return { label: 'Go to Dashboard', to: '/dashboard' };
  }, [openAssistant, location.pathname]);

  const handleOpenAssistant = (assistantId) => {
    setOpenAssistant((current) => (current === assistantId ? null : assistantId));
  };

  const handleTopicSelect = (topicId) => {
    if (openAssistant === 'support') {
      setSelectedSupportTopicId(topicId);
      return;
    }

    setSelectedGuideTopicId(topicId);
  };

  const handleAction = (topic) => {
    setOpenAssistant(null);

    if (topic.actionHref) {
      window.location.href = topic.actionHref;
      return;
    }

    if (topic.actionTo) {
      navigate(topic.actionTo);
    }
  };

  const handleContextualAction = () => {
    if (contextualAction.action) {
      contextualAction.action();
      return;
    }

    if (contextualAction.to) {
      setOpenAssistant(null);
      navigate(contextualAction.to);
    }
  };

  const handleDraftSubmit = (event) => {
    event.preventDefault();

    if (!activeDraftMessage.trim()) {
      return;
    }

    if (openAssistant === 'support') {
      setSupportDraftMessage('');
      return;
    }

    setGuideDraftMessage('');
  };

  const handleDraftChange = (value) => {
    if (openAssistant === 'support') {
      setSupportDraftMessage(value);
      return;
    }

    setGuideDraftMessage(value);
  };

  return (
    <div className="smartguide-shell" aria-live="polite">
      <div
        id="smartguide-panel"
        className={`smartguide-panel ${openAssistant ? 'smartguide-panel-open' : 'smartguide-panel-closed'}`}
      >
        {openAssistant ? (
          <div className="smartguide-panel-inner">
            <div className="smartguide-head">
              <div>
                <p className="smartguide-kicker">{activeConfig.title}</p>
                <h2 className="smartguide-title">{activeConfig.subtitle}</h2>
                <p className="smartguide-copy">{activeConfig.intro}</p>
              </div>
              <div className="smartguide-head-actions">
                <button
                  type="button"
                  className="smartguide-icon-button"
                  onClick={() => setOpenAssistant(null)}
                  aria-label={`Close ${activeConfig.title}`}
                >
                  <span className="smartguide-icon-glyph">x</span>
                </button>
              </div>
            </div>

            {openAssistant === 'guide' ? (
              <div className="smartguide-welcome-bubble">
                <p className="smartguide-welcome-title">Need help using SmartHire?</p>
                <p className="smartguide-welcome-copy">
                  I can guide you through jobs, candidates, AI scoring, and recruiter actions.
                </p>
              </div>
            ) : null}

            <div className={`smartguide-topic-list ${openAssistant === 'guide' ? 'smartguide-topic-grid' : ''}`}>
              {activeTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  className={`smartguide-topic ${topic.id === activeTopic.id ? 'smartguide-topic-active' : ''}`}
                  onClick={() => handleTopicSelect(topic.id)}
                >
                  {topic.label}
                </button>
              ))}
            </div>

            <div className="smartguide-answer">
              <p className="smartguide-answer-label">{activeConfig.panelLabel}</p>
              <p className="smartguide-answer-title">{activeTopic.label}</p>
              <p className="smartguide-answer-copy">{activeTopic.answer}</p>
            </div>

            <form className="smartguide-input-wrap" onSubmit={handleDraftSubmit}>
              <label className="sr-only" htmlFor="smartguide-input">
                Ask {activeConfig.title}
              </label>
              <input
                id="smartguide-input"
                className="smartguide-input"
                type="text"
                placeholder={activeConfig.inputPlaceholder}
                value={activeDraftMessage}
                onChange={(event) => handleDraftChange(event.target.value)}
              />
              <button className="smartguide-send" type="submit" aria-label={activeConfig.inputButtonLabel}>
                <span aria-hidden="true">↗</span>
              </button>
            </form>

            <div className="smartguide-foot">
              <button type="button" className="btn-primary btn-compact" onClick={() => handleAction(activeTopic)}>
                {activeTopic.actionLabel}
              </button>
              <button type="button" className="smartguide-text-button" onClick={handleContextualAction}>
                {contextualAction.label}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="smartguide-launch-group">
        <button
          type="button"
          className={`smartguide-trigger ${openAssistant === 'guide' ? 'smartguide-trigger-active' : ''}`}
          onClick={() => handleOpenAssistant('guide')}
          aria-expanded={openAssistant === 'guide'}
          aria-controls="smartguide-panel"
        >
          <span className="smartguide-trigger-mark">G</span>
          <span className="smartguide-trigger-copy">
            <span className="smartguide-trigger-title">SmartGuide</span>
            <span className="smartguide-trigger-text">Learn how SmartHire works step by step.</span>
          </span>
        </button>

        <button
          type="button"
          className={`smartguide-trigger ${openAssistant === 'support' ? 'smartguide-trigger-active' : ''}`}
          onClick={() => handleOpenAssistant('support')}
          aria-expanded={openAssistant === 'support'}
          aria-controls="smartguide-panel"
        >
          <span className="smartguide-trigger-mark">S</span>
          <span className="smartguide-trigger-copy">
            <span className="smartguide-trigger-title">Support</span>
            <span className="smartguide-trigger-text">Get help with common SmartHire issues.</span>
          </span>
        </button>
      </div>
    </div>
  );
}

export default HelpAssistant;
