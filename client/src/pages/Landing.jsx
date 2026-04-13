import { Link } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import { useTheme } from '../utils/theme';

const workflowSteps = [
  {
    id: 'create-job',
    step: 'Step 1',
    title: 'Create a job',
    description: 'Add the role title, requirements, and hiring context before you review candidates.',
    actionLabel: 'Create Job',
    actionTo: '/signup',
  },
  {
    id: 'add-candidates',
    step: 'Step 2',
    title: 'Add candidates',
    description: 'Upload resumes, connect them to the job, and keep candidate details in one place.',
    actionLabel: 'Add Candidates',
    actionTo: '/signup',
  },
  {
    id: 'ai-evaluation',
    step: 'Step 3',
    title: 'Check the score',
    description: 'See which candidates match the job, which skills are missing, and what needs a closer look.',
    actionLabel: 'See Scoring',
    actionTo: '/login',
  },
  {
    id: 'recruiter-decision',
    step: 'Step 4',
    title: 'Make the decision',
    description: 'Shortlist stronger candidates, keep recruiter notes, and schedule the next interview step.',
    actionLabel: 'Review Candidates',
    actionTo: '/login',
  },
];

function Landing() {
  const { isDark } = useTheme();

  return (
    <MainLayout>
      <div className="space-y-16 py-2 lg:space-y-20">
        <section className={`rounded-[32px] border px-6 py-10 sm:px-8 lg:px-12 lg:py-14 ${isDark ? 'border-slate-800 bg-slate-900/92' : 'border-slate-200 bg-white'}`}>
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] xl:items-center xl:gap-14">
            <div className="max-w-[42rem]">
              <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
                Recruiter hiring flow
              </p>
              <h1 className={`mt-5 text-[3rem] font-semibold leading-[0.98] tracking-[-0.05em] sm:text-[3.8rem] lg:text-[4.8rem] ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Review candidates faster and make decisions clearly.
              </h1>
              <p className={`mt-6 max-w-[39rem] text-lg leading-8 sm:text-[1.15rem] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                SmartHire helps you create a job, add candidates, score them, leave recruiter notes, and move interviews forward without jumping between scattered screens.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className="btn-primary min-h-[52px] rounded-full px-8 text-base" to="/signup">
                  Start Free
                </Link>
                <Link className="btn-secondary min-h-[52px] rounded-full px-8 text-base" to="/login">
                  Login
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {['Job setup', 'Candidate review', 'Interview tracking'].map((item) => (
                  <span
                    key={item}
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                      isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className={`rounded-[30px] border p-5 sm:p-6 lg:p-7 ${isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-slate-50 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.2)]'}`}>
              <div className="grid gap-4">
                <div className={`rounded-[24px] border p-5 ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Candidate score</p>
                      <p className={`mt-4 text-5xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>91</p>
                      <p className={`mt-2 text-base ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Strong fit for Product Designer</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                      Shortlist
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className={`rounded-[24px] border p-5 ${isDark ? 'border-slate-800 bg-slate-900/86' : 'border-slate-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Recruiter decision</p>
                    <p className={`mt-4 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>Ready to shortlist</p>
                    <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Strong portfolio match, clear product design experience, and only one visible gap before interview.
                    </p>
                  </div>

                  <div className={`rounded-[24px] border p-5 ${isDark ? 'border-slate-800 bg-slate-900/74' : 'border-slate-200 bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Skill match</p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Matched skills</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>3 / 4</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['UX', 'Research', 'Prototyping'].map((skill) => (
                        <span key={skill} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isDark ? 'bg-cyan-500/12 text-cyan-200' : 'bg-cyan-50 text-cyan-700'}`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                      Missing skill: analytics handoff experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="space-y-6">
          <div className="max-w-3xl">
            <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
              Workflow
            </p>
            <h2 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.9rem] ${isDark ? 'text-white' : 'text-slate-950'}`}>
              A clear path from new role to final decision.
            </h2>
          </div>

          <div className="relative space-y-5">
            <div className="absolute left-5 top-0 hidden h-full w-px bg-gradient-to-b from-emerald-500/40 via-emerald-400/20 to-transparent lg:block" />
            {workflowSteps.map((item, index) => (
              <article
                id={item.id}
                key={item.id}
                className={`relative rounded-[26px] border px-6 py-7 lg:ml-12 lg:px-9 ${
                  index % 2 === 0
                    ? isDark
                      ? 'border-slate-800 bg-slate-900/92'
                      : 'border-slate-200 bg-white'
                    : isDark
                      ? 'border-slate-800 bg-slate-900/72'
                      : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="absolute -left-[2.9rem] top-7 hidden h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/12 text-sm font-semibold text-emerald-300 lg:flex">
                  {index + 1}
                </div>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>{item.step}</p>
                    <h3 className={`mt-3 text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{item.title}</h3>
                    <p className={`mt-3 text-base leading-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.description}</p>
                  </div>
                  <div className="shrink-0">
                    <Link className="btn-primary min-h-[46px] rounded-full px-6" to={item.actionTo}>
                      {item.actionLabel}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className={`rounded-[26px] border px-6 py-7 lg:px-8 lg:py-8 ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'}`}>
            <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>What SmartHire helps with</p>
            <h2 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.9rem] ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Keep the hiring process readable.
            </h2>
            <p className={`mt-4 text-base leading-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Jobs, candidate review, scores, recruiter notes, comparison, and interviews stay connected instead of scattered across separate tools.
            </p>
          </div>

          <div className="space-y-4">
            <div className={`rounded-[26px] border px-6 py-6 ${isDark ? 'border-slate-800 bg-slate-900/92' : 'border-slate-200 bg-white'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>See which candidates actually match your job</h3>
              <p className={`mt-2 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Use the score, matched skills, missing skills, and summary to understand fit more quickly.</p>
            </div>
            <div className={`rounded-[26px] border px-6 py-6 ${isDark ? 'border-slate-800 bg-slate-900/72' : 'border-slate-200 bg-slate-50/80'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>Leave notes and move candidates forward</h3>
              <p className={`mt-2 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Keep recruiter decisions, comments, and interview details next to each candidate.</p>
            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  );
}

export default Landing;
