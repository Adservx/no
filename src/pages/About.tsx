import { Link } from 'react-router-dom';
import '../styles/ManikantLanding.css';

export default function About() {
  return (
    <div className="manikant-container">
      <nav className="manikant-nav">
        <Link to="/" className="manikant-logo">
          manikant<span className="logo-highlight">.com.np</span>
        </Link>
        <div className="manikant-links">
          <Link to="/">Home</Link>
          <Link to="/prajols-web">Prajol's Web</Link>
        </div>
      </nav>

      <div className="manikant-bg-shape shape-1"></div>
      <div className="manikant-bg-shape shape-2"></div>

      <header className="manikant-hero" style={{ padding: '50px 20px 40px' }}>
        <h1>⚡ About <span className="highlight">Us</span></h1>
        <p>Learn more about our mission and what drives us.</p>
      </header>

      <section style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="manikant-post instagram-style" style={{ padding: '24px' }}>
          <h2 style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '1.3rem' }}>Our Mission</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
            Manikant.com.np is a dedicated platform for Sub-Electrical Engineers in Nepal. We believe in the power of community and shared knowledge to help aspiring engineers succeed in their careers.
          </p>

          <h2 style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '1.3rem' }}>What We Offer</h2>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>📚</span>
              <div>
                <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Study Materials</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Access notes, past papers, and reference materials shared by the community.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>🤝</span>
              <div>
                <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Community</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Connect with fellow sub-engineers, share experiences, and grow together.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>📷</span>
              <div>
                <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Memories</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Share photos and videos from projects, events, and memorable moments.
                </p>
              </div>
            </div>
          </div>

          <h2 style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '1.3rem' }}>Contact Us</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Have questions or suggestions? Reach out to us at{' '}
            <a href="https://mail.google.com/mail/?view=cm&to=imserv67@gmail.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              imserv67@gmail.com
            </a>
          </p>
        </div>
      </section>

      <footer className="manikant-footer" style={{ marginTop: '40px' }}>
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">&copy; {new Date().getFullYear()} Manikant. All rights reserved.</p>
            <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
