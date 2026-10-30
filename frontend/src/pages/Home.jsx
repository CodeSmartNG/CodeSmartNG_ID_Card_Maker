import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav__logo">
          <span style={{ color: '#6366f1', fontWeight: 800 }}>CodeSmart</span>NG
        </div>
        <div className="landing-nav__actions">
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="landing-hero">
        <div className="landing-hero__content">
          <div className="landing-badge">🚀 The #1 ID Card Maker in Nigeria</div>
          <h1 className="landing-title">
            Create & Issue <span className="text-gradient">Professional ID Cards</span> in Minutes.
          </h1>
          <p className="landing-subtitle">
            Design custom ID cards for your organization, collect payments securely via Paystack, 
            and generate high-quality PDF cards instantly.
          </p>
          <div className="landing-hero__cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account
            </Link>
            <Link to="/verify/12345" className="btn btn-secondary btn-lg">
              Verify a Card
            </Link>
          </div>
        </div>
        <div className="landing-hero__visual">
          {/* A decorative placeholder card */}
          <div className="mock-card">
            <div className="mock-card__header">
              <div className="mock-card__logo" />
              <div className="mock-card__org">Acme Corporation</div>
            </div>
            <div className="mock-card__body">
              <div className="mock-card__photo" />
              <div className="mock-card__info">
                <div className="mock-card__name">John Doe</div>
                <div className="mock-card__role">Senior Software Engineer</div>
                <div className="mock-card__id">ID: ACME-2026-0001</div>
              </div>
            </div>
            <div className="mock-card__footer">
              <div>Valid Until: 2028</div>
              <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>OFFICIAL ID</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Features Section ── */}
      <section className="landing-features">
        <h2 className="landing-features__title">Everything you need to manage ID cards</h2>
        <div className="landing-features__grid">
          
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Custom Templates</h3>
            <p>Choose from multiple beautifully designed templates or customize your own colors and logos.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Seamless Payments</h3>
            <p>Collect payments securely via Paystack. Automated receipts and instant card generation.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Secure Verification</h3>
            <p>Every card gets a unique QR code so employers and security can verify its authenticity instantly.</p>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} CodeSmartNG. All rights reserved.</p>
      </footer>
    </div>
  );
}
