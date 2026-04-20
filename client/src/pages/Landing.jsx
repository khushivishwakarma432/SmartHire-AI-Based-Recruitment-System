import { Link } from 'react-router-dom';

import RevealOnScroll from '../components/marketing/RevealOnScroll';
import MainLayout from '../layouts/MainLayout';

const displayFontStyle = {
  fontFamily: '"Space Grotesk", "Aptos", "Segoe UI", sans-serif',
};

const heroMetrics = [
  { label: 'Roles live', value: '24' },
  { label: 'Qualified this week', value: '186' },
  { label: 'Avg. review time', value: '17m' },
];

const stats = [
  { value: '4.7x', label: 'Faster Shortlisting', detail: 'From first upload to interview-ready shortlist.' },
  { value: '93%', label: 'Match Accuracy', detail: 'Richer AI scoring with resume and JD compatibility.' },
  { value: '120K+', label: 'Resumes Processed', detail: 'Built for growing hiring pipelines and repeatable review.' },
  { value: '68%', label: 'Hiring Efficiency', detail: 'Less manual sorting and stronger candidate prioritization.' },
];

const steps = [
  {
    number: '01',
    title: 'Upload Resume / Job Description',
    description: 'Drop a JD, import a role, or upload candidate resumes in minutes without changing your hiring flow.',
    detail: 'Bulk uploads, structured candidate records, and recruiter-friendly role setup.',
  },
  {
    number: '02',
    title: 'AI Analysis and Matching',
    description: 'SmartHire parses resumes, compares skills, and evaluates compatibility against the job requirements.',
    detail: 'Skills, gaps, role fit, and decision-ready scoring all in one view.',
  },
  {
    number: '03',
    title: 'Shortlist Top Candidates',
    description: 'Surface the strongest matches, add recruiter notes, and move qualified talent into the next stage faster.',
    detail: 'Shortlist status, team collaboration, and interview handoff from the same workspace.',
  },
];

const features = [
  { id: 'resume-parsing', tag: 'RP', title: 'Resume Parsing', description: 'Turn raw CVs into structured candidate profiles with job history, skills, and role context.' },
  { id: 'skill-matching', tag: 'SM', title: 'Skill Matching', description: 'Map candidate capabilities to role requirements and highlight skill overlap instantly.' },
  { id: 'candidate-ranking', tag: 'CR', title: 'Candidate Ranking', description: 'Rank applicants by fit, urgency, and recruiter-ready confidence scores.' },
  { id: 'jd-compatibility', tag: 'JD', title: 'JD Compatibility', description: 'Measure how closely each resume aligns with the job description and hiring goals.' },
  { id: 'smart-shortlisting', tag: 'SS', title: 'Smart Shortlisting', description: 'Move top talent into your shortlist with clear status markers and next-step ownership.' },
  { id: 'hiring-analytics', tag: 'HA', title: 'Hiring Analytics', description: 'Track pipeline velocity, decision distribution, and score trends without another dashboard tool.' },
];

const dashboardRows = [
  { name: 'Aarav Sharma', role: 'ML Engineer', score: 96, status: 'Shortlisted', stage: 'Interview' },
  { name: 'Riya Patel', role: 'Product Designer', score: 91, status: 'Review', stage: 'Portfolio' },
  { name: 'Dev Mehta', role: 'Data Analyst', score: 88, status: 'Shortlisted', stage: 'Panel' },
  { name: 'Nisha Rao', role: 'Full Stack Developer', score: 84, status: 'Pending', stage: 'Screening' },
];

const shortlistSignals = [
  { label: 'Communication', value: 92 },
  { label: 'Relevant skills', value: 96 },
  { label: 'Domain fit', value: 84 },
];

const dashboardInsights = [
  { label: 'Qualified candidates', value: '42', trend: '+12%' },
  { label: 'Shortlist rate', value: '31%', trend: '+7%' },
  { label: 'Interview scheduled', value: '18', trend: '+4%' },
];

const comparisonColumns = [
  {
    title: 'Traditional Hiring',
    label: 'Manual and fragmented',
    tone: 'muted',
    points: [
      'Resume review happens across spreadsheets, inboxes, and disconnected trackers.',
      'Candidate scoring depends on subjective notes and slow back-and-forth.',
      'Shortlists take longer because skill gaps are manually discovered.',
      'Recruiters have limited visibility into pipeline health and match quality.',
    ],
  },
  {
    title: 'Smart Hire',
    label: 'AI-guided and decision-ready',
    tone: 'accent',
    points: [
      'Candidate profiles, role context, and recruiter notes stay in one workspace.',
      'AI ranking and JD compatibility make the strongest applicants obvious earlier.',
      'Shortlist decisions are faster because skills, gaps, and summaries are pre-surfaced.',
      'Analytics reveal how the funnel is moving and where recruiters should act next.',
    ],
  },
];

const audienceCards = [
  {
    title: 'Recruiters',
    kicker: 'Faster hiring decisions',
    description: 'Spend less time sorting resumes and more time moving qualified candidates into interviews.',
    bullets: [
      'Centralized job, candidate, and score management',
      'Shortlist-ready AI summaries and fit signals',
      'Cleaner collaboration between sourcing and interview teams',
    ],
    metrics: [
      { label: 'Pipeline clarity', value: 'High' },
      { label: 'Manual work', value: '-58%' },
    ],
  },
  {
    title: 'Candidates',
    kicker: 'Fairer evaluation signals',
    description: 'Profiles are evaluated against real job criteria so strong applicants do not get buried in volume.',
    bullets: [
      'Better visibility into skill alignment and role fit',
      'Faster feedback loops from upload to shortlist',
      'Cleaner handoff into interviews and next steps',
    ],
    metrics: [
      { label: 'Response speed', value: '2.3x' },
      { label: 'Profile context', value: 'Richer' },
    ],
  },
];

const sectionShellClass = 'border-white/10 bg-white/[0.04] shadow-[0_32px_120px_-60px_rgba(6,182,212,0.45)]';
const softPanelClass = 'border-white/10 bg-[#081120]/88';
const innerCardClass = 'border-white/8 bg-slate-950/80';
const nestedCardClass = 'border-white/8 bg-white/[0.03]';
const detailPanelClass = 'border-white/8 bg-white/[0.03] text-slate-300';
const dividerClass = 'border-white/10';
const tableShellClass = 'border-white/10';
const tableHeadClass = 'bg-white/[0.03] text-slate-400';
const tableBodyClass = 'bg-slate-950/70';
const progressTrackClass = 'bg-white/8';
const mutedCopyClass = 'text-slate-300';
const subtleCopyClass = 'text-slate-400';
const strongTextClass = 'text-white';
const accentBadgeClass = 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100';
const secondaryActionClass = 'border-white/12 bg-white/[0.03] text-white hover:border-cyan-400/30 hover:bg-cyan-400/10';

function SectionIntro({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem]" style={displayFontStyle}>
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-slate-300 sm:text-lg">{description}</p>
    </div>
  );
}

function InsightBar({ label, value }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className={`h-2 rounded-full ${progressTrackClass}`}>
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.85),rgba(59,130,246,0.95))]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Landing() {
  return (
    <MainLayout>
      <div className="relative isolate space-y-6 pb-4 sm:space-y-8 lg:space-y-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
          <div className="mx-auto h-[26rem] max-w-[82rem] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.22),transparent_44%),radial-gradient(circle_at_78%_18%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_20%_32%,rgba(14,165,233,0.12),transparent_28%)]" />
        </div>

        <RevealOnScroll as="section" className={`overflow-hidden rounded-[36px] border px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12 ${sectionShellClass}`}>
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)] xl:items-center">
            <div className="max-w-[42rem]">
              <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] ${accentBadgeClass}`}>
                AI Hiring Command Center
              </span>

              <h1 className="mt-6 text-[2.95rem] font-semibold leading-[0.95] tracking-[-0.07em] text-white sm:text-[4rem] lg:text-[5.3rem]" style={displayFontStyle}>
                Hire Smarter with AI-Powered Candidate Intelligence
              </h1>

              <p className={`mt-6 max-w-[38rem] text-base leading-8 sm:text-lg ${mutedCopyClass}`}>
                Smart Hire helps recruiters screen resumes, rank candidates, and move from role intake to shortlist with faster, more confident hiring decisions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-cyan-400/40 bg-[linear-gradient(135deg,#06b6d4_0%,#2563eb_100%)] px-7 text-sm font-semibold text-white shadow-[0_20px_45px_-25px_rgba(37,99,235,0.65)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-26px_rgba(37,99,235,0.82)]" to="/signup">
                  Start Free
                </Link>
                <Link className={`inline-flex min-h-[54px] items-center justify-center rounded-full border px-7 text-sm font-semibold transition duration-300 hover:-translate-y-1 ${secondaryActionClass}`} to="/login">
                  Watch Product Flow
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {heroMetrics.map((item) => (
                  <div key={item.label} className={`rounded-[22px] border px-4 py-4 ${softPanelClass}`}>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${subtleCopyClass}`}>{item.label}</p>
                    <p className={`mt-3 text-2xl font-semibold tracking-tight ${strongTextClass}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -left-6 top-10 h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute bottom-6 right-4 h-28 w-28 rounded-full bg-blue-500/20 blur-3xl" />

              <div className={`relative overflow-hidden rounded-[30px] border p-4 sm:p-5 lg:p-6 ${sectionShellClass}`}>
                <div className={`rounded-[26px] border p-4 sm:p-5 ${softPanelClass}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${subtleCopyClass}`}>Recruiter dashboard preview</p>
                      <p className={`mt-2 text-xl font-semibold ${strongTextClass}`}>Top candidates surfaced instantly</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${accentBadgeClass}`}>Live AI ranking</span>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className={`rounded-[22px] border p-4 ${innerCardClass}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${subtleCopyClass}`}>Candidate queue</p>
                          <p className={`mt-2 text-lg font-semibold ${strongTextClass}`}>Shortlist recommendations</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold text-emerald-200">3 ready</span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {dashboardRows.slice(0, 3).map((row) => (
                          <div key={row.name} className={`grid gap-2 rounded-[18px] border px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center ${nestedCardClass}`}>
                            <div className="min-w-0">
                              <p className={`truncate font-semibold ${strongTextClass}`}>{row.name}</p>
                              <p className={`truncate text-xs ${subtleCopyClass}`}>{row.role}</p>
                            </div>
                            <span className="text-xs font-semibold text-cyan-200">{row.score}% match</span>
                            <span className={`inline-flex justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.status === 'Shortlisted' ? 'bg-emerald-500/12 text-emerald-200' : 'bg-white/8 text-slate-200'}`}>
                              {row.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={`rounded-[22px] border p-4 ${innerCardClass}`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${subtleCopyClass}`}>Match snapshot</p>
                        <p className={`mt-2 text-4xl font-semibold tracking-tight ${strongTextClass}`}>96%</p>
                        <p className={`mt-2 text-sm ${mutedCopyClass}`}>Role fit for Senior ML Engineer</p>
                        <div className="mt-4 space-y-3">
                          {shortlistSignals.map((item) => (
                            <InsightBar key={item.label} label={item.label} value={item.value} />
                          ))}
                        </div>
                      </div>

                      <div className={`rounded-[22px] border p-4 ${innerCardClass}`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${subtleCopyClass}`}>Weekly throughput</p>
                        <div className="mt-4 flex items-end gap-2">
                          {[42, 58, 64, 81, 74, 88, 96].map((height, index) => (
                            <div key={height} className="flex-1">
                              <div className="rounded-t-full bg-[linear-gradient(180deg,rgba(34,211,238,0.9),rgba(37,99,235,0.82))]" style={{ height: `${height}px` }} />
                              <p className={`mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] ${subtleCopyClass}`}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="stats" className={`rounded-[32px] border px-5 py-6 sm:px-8 sm:py-8 lg:px-10 ${sectionShellClass}`} delay={50}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <article key={item.label} className={`rounded-[24px] border px-5 py-5 transition duration-300 hover:-translate-y-1 ${softPanelClass}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${subtleCopyClass}`}>{item.label}</p>
                <p className={`mt-4 text-4xl font-semibold tracking-tight ${strongTextClass}`}>{item.value}</p>
                <p className={`mt-3 text-sm leading-7 ${mutedCopyClass}`}>{item.detail}</p>
              </article>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="workflow" className={`rounded-[32px] border px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 ${sectionShellClass}`} delay={90}>
          <SectionIntro eyebrow="How it works" title="From upload to shortlist without the usual manual drag." description="A three-step system designed to compress hiring effort while keeping recruiter judgment in control." />

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {steps.map((step, index) => (
              <RevealOnScroll key={step.number} as="article" className={`rounded-[26px] border px-5 py-6 transition duration-300 hover:-translate-y-1 ${softPanelClass}`} delay={index * 70}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold ${accentBadgeClass}`}>{step.number}</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${subtleCopyClass}`}>Step {index + 1}</span>
                </div>
                <h3 className={`mt-6 text-2xl font-semibold tracking-tight ${strongTextClass}`} style={displayFontStyle}>{step.title}</h3>
                <p className={`mt-4 text-sm leading-7 ${mutedCopyClass}`}>{step.description}</p>
                <p className={`mt-5 rounded-[18px] border px-4 py-3 text-sm leading-7 ${detailPanelClass}`}>{step.detail}</p>
              </RevealOnScroll>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="features" className={`rounded-[32px] border px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 ${sectionShellClass}`} delay={120}>
          <SectionIntro eyebrow="AI features" title="Premium product building blocks for modern hiring teams." description="Every card focuses on what a real recruiting team needs to move faster while keeping decision quality high." />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <RevealOnScroll key={feature.id} as="article" className={`rounded-[24px] border px-5 py-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 ${softPanelClass}`} delay={index * 50}>
                <span className={`inline-flex rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${accentBadgeClass}`}>{feature.tag}</span>
                <h3 className={`mt-5 text-xl font-semibold ${strongTextClass}`}>{feature.title}</h3>
                <p className={`mt-3 text-sm leading-7 ${mutedCopyClass}`}>{feature.description}</p>
              </RevealOnScroll>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="dashboard-preview" className={`rounded-[34px] border px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 ${sectionShellClass}`} delay={140}>
          <SectionIntro eyebrow="Dashboard preview" title="A dashboard that feels like a real AI hiring startup product." description="A recruiter-facing command center that combines candidate tables, match percentages, shortlist states, scorecards, and analytics in one product surface." />

          <div className="mt-8 grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
            <div className={`rounded-[28px] border p-4 sm:p-5 ${softPanelClass}`}>
              <div className={`flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between ${dividerClass}`}>
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${subtleCopyClass}`}>Candidate command list</p>
                  <p className={`mt-2 text-xl font-semibold ${strongTextClass}`}>AI-ranked talent across open roles</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${accentBadgeClass}`}>JD match</span>
                  <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold text-emerald-200">Shortlist status</span>
                </div>
              </div>

              <div className={`mt-4 overflow-hidden rounded-[22px] border ${tableShellClass}`}>
                <div className={`grid grid-cols-[minmax(0,1.3fr)_0.7fr_0.6fr_0.65fr] gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${tableHeadClass}`}>
                  <span>Candidate</span>
                  <span>Match</span>
                  <span>Status</span>
                  <span>Stage</span>
                </div>
                <div className={tableBodyClass}>
                  {dashboardRows.map((row) => (
                    <div key={row.name} className="grid grid-cols-[minmax(0,1.3fr)_0.7fr_0.6fr_0.65fr] gap-3 border-t border-white/8 px-4 py-4 text-sm text-slate-300">
                      <div className="min-w-0">
                        <p className={`truncate font-semibold ${strongTextClass}`}>{row.name}</p>
                        <p className={`truncate text-xs ${subtleCopyClass}`}>{row.role}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-cyan-200">{row.score}%</p>
                        <div className={`h-1.5 rounded-full ${progressTrackClass}`}>
                          <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.95),rgba(59,130,246,0.9))]" style={{ width: `${row.score}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.status === 'Shortlisted' ? 'bg-emerald-500/12 text-emerald-200' : row.status === 'Pending' ? 'bg-amber-500/12 text-amber-100' : 'bg-white/8 text-slate-200'}`}>
                          {row.status}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className={`truncate text-xs font-semibold ${subtleCopyClass}`}>{row.stage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className={`rounded-[28px] border p-5 ${softPanelClass}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${subtleCopyClass}`}>Hiring analytics</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  {dashboardInsights.map((item) => (
                    <div key={item.label} className={`rounded-[20px] border px-4 py-4 ${nestedCardClass}`}>
                      <p className={`text-xs ${subtleCopyClass}`}>{item.label}</p>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <p className={`text-3xl font-semibold tracking-tight ${strongTextClass}`}>{item.value}</p>
                        <span className="text-xs font-semibold text-cyan-200">{item.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-[28px] border p-5 ${softPanelClass}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${subtleCopyClass}`}>Skill match bars</p>
                <div className="mt-5 space-y-4">
                  {[
                    { label: 'Python / ML stack', value: 94 },
                    { label: 'System design', value: 82 },
                    { label: 'Product thinking', value: 76 },
                    { label: 'Stakeholder communication', value: 88 },
                  ].map((item) => (
                    <InsightBar key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="comparison" className={`rounded-[32px] border px-5 py-6 sm:px-8 sm:py-8 lg:px-10 ${sectionShellClass}`} delay={160}>
          <SectionIntro align="center" eyebrow="Comparison" title="Traditional Hiring vs Smart Hire" description="The difference is not just aesthetics. Smart Hire changes how quickly teams move from resume volume to confident hiring decisions." />

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {comparisonColumns.map((column) => (
              <article key={column.title} className={`rounded-[26px] border px-5 py-6 ${column.tone === 'accent' ? `${softPanelClass} ring-1 ring-cyan-400/20` : softPanelClass}`}>
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${column.tone === 'accent' ? 'text-cyan-300' : subtleCopyClass}`}>{column.label}</p>
                <h3 className={`mt-3 text-2xl font-semibold ${strongTextClass}`} style={displayFontStyle}>{column.title}</h3>
                <div className="mt-5 space-y-3">
                  {column.points.map((point) => (
                    <div key={point} className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 ${nestedCardClass}`}>
                      <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${column.tone === 'accent' ? 'bg-cyan-400/12 text-cyan-200' : 'bg-white/8 text-slate-300'}`}>
                        {column.tone === 'accent' ? 'AI' : 'M'}
                      </span>
                      <p className={`text-sm leading-7 ${mutedCopyClass}`}>{point}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="audience" className={`rounded-[32px] border px-5 py-6 sm:px-8 sm:py-8 lg:px-10 ${sectionShellClass}`} delay={180}>
          <SectionIntro eyebrow="Who it helps" title="Built for recruiters and candidates, not just dashboards." description="Smart Hire creates value on both sides of the workflow: recruiters move faster and candidates are reviewed with stronger context." />

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {audienceCards.map((card, index) => (
              <RevealOnScroll key={card.title} as="article" className={`rounded-[28px] border px-5 py-6 ${softPanelClass}`} delay={index * 70}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{card.kicker}</p>
                    <h3 className={`mt-3 text-2xl font-semibold ${strongTextClass}`} style={displayFontStyle}>{card.title}</h3>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${accentBadgeClass}`}>Product-ready</span>
                </div>

                <p className={`mt-4 text-sm leading-7 ${mutedCopyClass}`}>{card.description}</p>

                <div className="mt-5 space-y-3">
                  {card.bullets.map((bullet) => (
                    <div key={bullet} className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 ${nestedCardClass}`}>
                      <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accentBadgeClass}`}>
                        {card.title === 'Recruiters' ? 'R' : 'C'}
                      </span>
                      <p className={`text-sm leading-7 ${mutedCopyClass}`}>{bullet}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {card.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-[18px] border border-white/8 bg-slate-950/70 px-4 py-4">
                      <p className={`text-xs ${subtleCopyClass}`}>{metric.label}</p>
                      <p className={`mt-2 text-2xl font-semibold ${strongTextClass}`}>{metric.value}</p>
                    </div>
                  ))}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="cta" className={`rounded-[34px] border px-5 py-8 sm:px-8 sm:py-10 lg:px-12 ${sectionShellClass}`} delay={200}>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Final CTA</p>
              <h2 className={`mt-4 text-3xl font-semibold tracking-[-0.05em] ${strongTextClass} sm:text-4xl lg:text-[3.15rem]`} style={displayFontStyle}>
                Make Smart Hire feel like a real recruitment product from the first screen.
              </h2>
              <p className={`mt-4 text-base leading-8 sm:text-lg ${mutedCopyClass}`}>
                Create an account, explore the product flow, and turn candidate review into a cleaner, faster hiring operation.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
              <Link className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-cyan-400/40 bg-[linear-gradient(135deg,#06b6d4_0%,#2563eb_100%)] px-7 text-sm font-semibold text-white shadow-[0_20px_45px_-25px_rgba(37,99,235,0.65)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-26px_rgba(37,99,235,0.82)]" to="/signup">
                Create Workspace
              </Link>
              <Link className={`inline-flex min-h-[54px] items-center justify-center rounded-full border px-7 text-sm font-semibold transition duration-300 hover:-translate-y-1 ${secondaryActionClass}`} to="/login">
                Go to Login
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </MainLayout>
  );
}

export default Landing;
