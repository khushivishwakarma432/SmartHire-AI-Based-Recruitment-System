import { Link } from 'react-router-dom';

import { useTheme } from '../utils/theme';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Candidates', to: '/candidates' },
  { label: 'Upload Candidate', to: '/candidates/upload' },
];

const followLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com',
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A1.97 1.97 0 0 0 3.28 4.97c0 1.08.88 1.97 1.94 1.97h.03a1.97 1.97 0 1 0 0-3.94ZM20.72 13.02c0-3.48-1.86-5.1-4.34-5.1-2 0-2.9 1.1-3.4 1.87V8.5H9.6c.04.86 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.12-.92.27-.68.88-1.38 1.9-1.38 1.34 0 1.88 1.03 1.88 2.53V20H20.7v-6.98Z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com',
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.2-3.37-1.2-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .08 1.53 1.05 1.53 1.05.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.36-2.22-.26-4.56-1.15-4.56-5.13 0-1.13.39-2.05 1.03-2.77-.1-.26-.45-1.32.1-2.74 0 0 .84-.27 2.75 1.06A9.32 9.32 0 0 1 12 6.84c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.06 2.74-1.06.56 1.42.21 2.48.1 2.74.64.72 1.03 1.64 1.03 2.77 0 3.99-2.35 4.87-4.59 5.12.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .28.18.61.69.5A10.25 10.25 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: 'https://x.com',
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.27l-4.91-7.43L5.5 22H2.38l7.24-8.28L1.8 2h6.43l4.44 6.77L18.9 2Zm-1.1 18h1.74L7.3 3.9H5.44L17.8 20Z" />
      </svg>
    ),
  },
];

function FooterLink({ item, className }) {
  if (item.to) {
    return (
      <Link className={className} to={item.to}>
        {item.label}
      </Link>
    );
  }

  return (
    <a className={className} href={item.href}>
      {item.label}
    </a>
  );
}

function ProductFooter() {
  const { isDark } = useTheme();

  const mutedClassName = `product-footer-muted ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <footer className="product-footer mt-16">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 text-center sm:text-left lg:grid-cols-[1.45fr_0.8fr_0.95fr] lg:gap-10">
          <div className="mx-auto max-w-xl sm:mx-0">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold tracking-[0.18em] ${
                  isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                SH
              </span>
              <div>
                <p className={`text-[15px] font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>SmartHire</p>
                <p className={`text-sm ${mutedClassName}`}>Recruitment workspace</p>
              </div>
            </div>

            <div className="mt-3 flex justify-center sm:justify-start">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                AI Hiring Workspace
              </span>
            </div>

            <p className={`mt-3 max-w-lg text-[13px] leading-6 sm:text-sm ${mutedClassName}`}>
              SmartHire is a recruitment workspace that helps teams manage jobs, evaluate candidates, and make faster hiring decisions with AI.
            </p>
          </div>

          <div>
            <p className="product-footer-heading">Quick Links</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {quickLinks.map((item) => (
                <FooterLink key={item.label} item={item} className="product-footer-link" />
              ))}
            </div>
          </div>

          <div>
            <div className="space-y-5">
              <div>
                <p className="product-footer-heading">Contact</p>
                <div className="mt-2.5 flex flex-col items-start gap-2 text-left">
                  <a className="product-footer-link" href="mailto:support@smarthire.ai">
                    support@smarthire.ai
                  </a>
                  <a className="product-footer-link" href="tel:+917338464292">
                    +91 7338464292
                  </a>
                </div>
              </div>

              <div>
                <p className="product-footer-heading">Follow Us</p>
                <div className="mt-2.5 flex items-center justify-center gap-2 sm:justify-start">
                  {followLinks.map((item) => (
                    <a
                      key={item.label}
                      aria-label={item.label}
                      className="product-footer-icon"
                      href={item.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2.5 border-t border-[var(--app-border)] pt-4 text-[13px] xl:grid-cols-[1fr_auto_1fr] xl:items-center">
          <p className="text-center xl:text-left">© 2026 SmartHire. All rights reserved.</p>
          <p className="text-center">Built for modern hiring teams</p>
          <div className="flex flex-wrap items-center justify-center gap-2 xl:justify-end">
            <a className="product-footer-link" href="#">
              Privacy
            </a>
            <span className={mutedClassName}>·</span>
            <a className="product-footer-link" href="#">
              Terms
            </a>
            <span className={mutedClassName}>·</span>
            <a className="product-footer-link" href="mailto:support@smarthire.ai">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default ProductFooter;

