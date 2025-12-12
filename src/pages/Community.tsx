import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import '../styles/ManikantLanding.css';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function Community() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manikant-container">
      <nav className="manikant-nav">
        <Link to="/" className="manikant-logo">
          Manikant<span className="logo-highlight">.com.np</span>
        </Link>
        <div className="manikant-links">
          <Link to="/">Home</Link>
          <Link to="/prajols-web">Prajol's Web</Link>
        </div>
      </nav>

      <div className="manikant-bg-shape shape-1"></div>
      <div className="manikant-bg-shape shape-2"></div>

      <header className="manikant-hero" style={{ padding: '50px 20px 40px' }}>
        <h1>🤝 Our <span className="highlight">Community</span></h1>
        <p>Meet the amazing sub-electrical engineers who make this community great.</p>
      </header>

      <section style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {loading ? (
          <div className="manikant-loading">
            <div className="spinner"></div>
            <p>Loading community members...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="manikant-empty">
            <span className="empty-icon">👥</span>
            <h3>No members yet</h3>
            <p>Be the first to join our community!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {profiles.map((profile) => (
              <div key={profile.id} className="manikant-post instagram-style" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: '#000',
                    flexShrink: 0,
                    border: '3px solid var(--accent)'
                  }}>
                    {!profile.avatar_url && '👤'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {profile.full_name || profile.username || 'Anonymous'}
                    </h3>
                    {profile.bio && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{profile.bio.length > 80 ? profile.bio.substring(0, 80) + '...' : profile.bio}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
