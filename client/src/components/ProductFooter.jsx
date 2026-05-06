import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Candidates', to: '/candidates' },
  { label: 'Upload Candidate', to: '/candidates/upload' },
  { label: 'Login', to: '/login' },
  { label: 'Signup', to: '/signup' },
  { label: 'Contact', href: '#footer-contact' },
];

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.94 8.5v8.56H4.09V8.5h2.85ZM5.51 4.25a1.66 1.66 0 1 1 0 3.32 1.66 1.66 0 0 1 0-3.32ZM19.91 12.17v4.89h-2.84v-4.56c0-1.15-.41-1.94-1.45-1.94-.79 0-1.26.53-1.46 1.04-.07.18-.09.43-.09.68v4.78h-2.85s.04-7.76 0-8.56h2.85v1.21c.38-.58 1.07-1.4 2.6-1.4 1.9 0 3.24 1.24 3.24 3.86Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.88 4.5h2.87l-6.27 7.16 7.38 9.84h-5.78l-4.52-5.95-5.2 5.95H3.49l6.7-7.67L3.11 4.5h5.92l4.09 5.42 4.76-5.42Zm-1.01 15.27h1.59L8.17 6.14H6.46l10.41 13.63Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5A9.5 9.5 0 0 0 9 21.02c.47.09.64-.2.64-.46 0-.23-.01-.98-.01-1.78-2.46.45-2.98-1.04-2.98-1.04-.4-1.03-.99-1.31-.99-1.31-.81-.55.06-.54.06-.54.89.06 1.36.92 1.36.92.8 1.36 2.09.97 2.6.74.08-.58.31-.97.57-1.19-1.96-.22-4.02-.98-4.02-4.39 0-.97.35-1.76.92-2.38-.09-.22-.4-1.11.09-2.31 0 0 .76-.24 2.48.91A8.6 8.6 0 0 1 12 7.33c.76 0 1.53.1 2.25.3 1.72-1.15 2.48-.91 2.48-.91.49 1.2.18 2.09.09 2.31.57.62.92 1.41.92 2.38 0 3.42-2.06 4.16-4.03 4.38.31.27.6.8.6 1.62 0 1.17-.01 2.12-.01 2.41 0 .26.17.56.65.46A9.5 9.5 0 0 0 12 2.5Z" fill="currentColor" />
      </svg>
    ),
  },
];

const legalLinks = [
  { label: 'Terms & Conditions', href: 'mailto:support@smarthire.ai?subject=SmartHire%20Terms%20and%20Conditions' },
  { label: 'Privacy Policy', href: 'mailto:support@smarthire.ai?subject=SmartHire%20Privacy%20Policy' },
];

function FooterNavItem({ item }) {
  if (item.to) {
    return (
      <Link className="product-footer-link" to={item.to}>
        {item.label}
      </Link>
    );
  }

  return (
    <a className="product-footer-link" href={item.href}>
      {item.label}
    </a>
  );
}

function ProductFooter() {
  return (
    <footer className="product-footer mt-16">
      <div className="product-footer-inner">
        <div className="product-footer-grid">
          <div className="product-footer-brand">
            <div className="product-footer-brand-lockup">
              <span className="product-footer-brand-mark">SH</span>
              <div>
                <p className="product-footer-brand-title">SmartHire</p>
                <p className="product-footer-brand-copy">AI-powered recruitment system</p>
              </div>
            </div>

            <p className="product-footer-tagline">
              AI-powered recruitment system for smarter hiring workflows, from job posting to candidate screening and AI-based scoring.
            </p>
          </div>

          <div className="product-footer-column product-footer-links">
            <p className="product-footer-heading">Quick Links</p>
            <div className="product-footer-link-list">
              {quickLinks.map((item) => (
                <FooterNavItem key={item.label} item={item} />
              ))}
            </div>
          </div>

          <div className="product-footer-column product-footer-contact" id="footer-contact">
            <p className="product-footer-heading">Contact</p>
            <div className="product-footer-contact-list">
              <a className="product-footer-link" href="mailto:support@smarthire.ai">
                support@smarthire.ai
              </a>
              <a className="product-footer-link" href="tel:+917338464293">
                +917338464293
              </a>
            </div>
          </div>

          <div className="product-footer-column product-footer-social">
            <p className="product-footer-heading">Follow Us</p>
            <div className="product-footer-social-row">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  className="product-footer-social-link"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  title={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
            <div className="product-footer-legal-list">
              {legalLinks.map((item) => (
                <a key={item.label} className="product-footer-link" href={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="product-footer-rule" />

        <div className="product-footer-bottom">
          <p>&copy; 2026 SmartHire. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default ProductFooter;
