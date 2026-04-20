import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Login', to: '/login' },
  { label: 'Signup', to: '/signup' },
];

function ProductFooter() {
  return (
    <footer className="product-footer mt-16">
      <div className="product-footer-inner">
        <div className="product-footer-grid">
          <div className="product-footer-brand">
            <div className="product-footer-brand-lockup">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/12 text-sm font-semibold tracking-[0.18em] text-cyan-200">
                SH
              </span>
              <div>
                <p className="text-[15px] font-semibold text-white">SmartHire</p>
                <p className="text-sm text-slate-400">AI-powered recruitment platform</p>
              </div>
            </div>

            <p className="product-footer-tagline">
              Screen resumes, match candidates, and shortlist faster with AI.
            </p>
          </div>

          <div className="product-footer-column product-footer-links">
            <p className="product-footer-heading">Quick Links</p>
            <div className="product-footer-link-list">
              {quickLinks.map((item) => (
                <Link key={item.label} className="product-footer-link" to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="product-footer-column product-footer-contact">
            <p className="product-footer-heading">Contact</p>
            <div className="product-footer-contact-row">
              <a className="product-footer-link" href="mailto:support@smarthire.ai">
                support@smarthire.ai
              </a>
            </div>
          </div>
        </div>

        <div className="product-footer-rule" />

        <div className="product-footer-bottom">
          <p>© 2026 SmartHire. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default ProductFooter;
