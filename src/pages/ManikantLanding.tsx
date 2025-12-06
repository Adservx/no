import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { uploadToR2 } from '../utils/r2Storage';
import UserProfileModal from '../components/manikant/UserProfileModal';
import '../styles/ManikantLanding.css';

interface Post {
  id: string;
  created_at: string;
  content: string;
  type: 'photo' | 'video' | 'material';
  media_url?: string;
  title: string;
  user_id: string;
  profiles?: {
    avatar_url: string;
    bio: string;
  };
}

export default function ManikantLanding() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState<boolean | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // New Post State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'photo' | 'video' | 'material'>('material');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    checkUser();
    fetchPosts();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      fetchProfile(user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      // We need to join with profiles to get avatar for post author if we want to show it
      // For now, just fetching posts
      const { data, error } = await supabase
        .from('manikant_posts')
        .select('*, profiles(avatar_url, bio)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsLogin(null); // Close modal on success
        showNotification('Successfully logged in!', 'success');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showNotification('Check your email for confirmation!', 'success');
        setIsLogin(null); // Close modal
      }
    } catch (error: any) {
      showNotification(error.message, 'error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    showNotification('Logged out successfully', 'success');
    setShowProfileMenu(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    try {
      let mediaUrl = '';

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        // Use a folder prefix for organization in R2
        const filePath = `manikant_files/${user.id}/${fileName}`;

        const { success, url, error: uploadError } = await uploadToR2(file, filePath);

        if (!success || !url) throw new Error(uploadError || 'Upload failed');

        mediaUrl = url;
      }

      const { error } = await supabase.from('manikant_posts').insert({
        user_id: user.id,
        title: newTitle,
        content: newContent,
        type: newType,
        media_url: mediaUrl
      });

      if (error) throw error;

      setNewTitle('');
      setNewContent('');
      setFile(null);
      fetchPosts();
      showNotification('Post created successfully!', 'success');
    } catch (error: any) {
      showNotification('Error creating post: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="manikant-container">
      {notification && (
        <div className={`manikant-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      {showProfileModal && user && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdate={() => {
            fetchProfile(user.id);
            fetchPosts();
          }}
          showNotification={showNotification}
        />
      )}

      <nav className="manikant-nav">
        <Link to="/" className="manikant-logo">Manikant.com.np</Link>
        <div className="manikant-links">
          <Link to="/prajols-web">Prajol's Web</Link>
          {user ? (
            <div className="manikant-profile-container">
              <div
                className="manikant-avatar"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={profile?.avatar_url ? {
                  backgroundImage: `url(${profile.avatar_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: 'transparent'
                } : {}}
              >
                {user.email?.charAt(0).toUpperCase()}
              </div>

              {showProfileMenu && (
                <div className="manikant-profile-dropdown">
                  <div className="manikant-dropdown-header">
                    <span className="manikant-user-email">{user.email}</span>
                    {profile?.bio && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                        "{profile.bio.length > 60 ? profile.bio.substring(0, 60) + '...' : profile.bio}"
                      </p>
                    )}
                  </div>
                  <div className="manikant-dropdown-divider"></div>
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="manikant-dropdown-item"
                  >
                    Edit Profile
                  </button>
                  <button onClick={handleLogout} className="manikant-dropdown-item logout">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setIsLogin(true)} className="manikant-nav-btn">
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Login/Signup Modal */}
      {!user && isLogin !== null && (
        <div className="manikant-modal-overlay" onClick={() => setIsLogin(null)}>
          <div className="manikant-modal" onClick={(e) => e.stopPropagation()}>
            <button className="manikant-modal-close" onClick={() => setIsLogin(null)}>×</button>
            <h3>{isLogin ? 'Login' : 'Sign Up'}</h3>
            <form onSubmit={handleAuth}>
              <input
                type="email"
                placeholder="Email"
                className="manikant-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="manikant-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="manikant-btn">
                {isLogin ? 'Login' : 'Sign Up'}
              </button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center', cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
            </p>
          </div>
        </div>
      )}

      <div className="manikant-bg-shape shape-1"></div>
      <div className="manikant-bg-shape shape-2"></div>

      <header className="manikant-hero">
        <h1>Sub-Electrical Engineers Hub</h1>
        <p>A place to share project memories, photos, videos, and study materials.</p>
        <div className="manikant-scroll-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </header>

      <section className="manikant-features">
        <div className="manikant-feature-card">
          <span className="manikant-feature-icon">📚</span>
          <h3>Study Materials</h3>
          <p>Access a vast collection of notes, past papers, and reference books.</p>
        </div>
        <div className="manikant-feature-card">
          <span className="manikant-feature-icon">🎥</span>
          <h3>Video Tutorials</h3>
          <p>Watch in-depth video explanations for complex engineering topics.</p>
        </div>
        <div className="manikant-feature-card">
          <span className="manikant-feature-icon">🤝</span>
          <h3>Community</h3>
          <p>Connect with fellow sub-engineers, share experiences and grow together.</p>
        </div>
      </section>

      <div className="manikant-content">
        <div className="manikant-feed">
          {loading ? (
            <div className="manikant-loading">
              <div className="spinner"></div>
              <p>Loading community posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="manikant-empty">
              <span className="empty-icon">📭</span>
              <h3>No posts yet</h3>
              <p>Be the first to share something with the community!</p>
            </div>
          ) : (
            posts.map(post => (
              <article key={post.id} className="manikant-post">
                <div className="manikant-post-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {post.profiles?.avatar_url ? (
                      <img
                        src={post.profiles.avatar_url}
                        alt="Author"
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="manikant-avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                        ?
                      </div>
                    )}
                    <div>
                      <h3 className="manikant-post-title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>{post.title}</h3>
                      <span className="manikant-post-date" style={{ fontSize: '0.8rem' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="manikant-post-content">{post.content}</div>
                {post.media_url && (
                  <div className="manikant-post-media">
                    {post.type === 'video' ? (
                      <video src={post.media_url} controls />
                    ) : post.type === 'photo' ? (
                      <img src={post.media_url} alt={post.title} />
                    ) : (
                      <a href={post.media_url} target="_blank" rel="noopener noreferrer" className="manikant-btn">
                        Download Material
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <aside className="manikant-sidebar">
          {user ? (
            <div className="manikant-auth-box">
              <h3>Create Post</h3>
              <form onSubmit={handleCreatePost}>
                <input
                  type="text"
                  placeholder="Title"
                  className="manikant-input"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Content"
                  className="manikant-input"
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={4}
                  required
                />
                <select
                  className="manikant-input"
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                >
                  <option value="material">Study Material</option>
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                </select>

                <div className="manikant-file-input-wrapper">
                  <input
                    type="file"
                    id="file-upload"
                    className="manikant-file-input-hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-upload" className="manikant-file-label">
                    <span className="file-icon">📎</span>
                    {file ? file.name : 'Choose a file...'}
                  </label>
                </div>

                <button type="submit" className="manikant-btn" disabled={uploading}>
                  {uploading ? 'Posting...' : 'Post'}
                </button>
              </form>
            </div>
          ) : (
            <div className="manikant-auth-box">
              <h3>Welcome!</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                Login to create and share posts with the community.
              </p>
              <button onClick={() => setIsLogin(true)} className="manikant-btn">
                Login to Post
              </button>
            </div>
          )}
        </aside>
      </div>


      <footer className="manikant-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Manikant.com.np</h4>
            <p>Empowering Sub-Electrical Engineers with resources, community, and shared knowledge.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/prajols-web">Prajol's Web</Link>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <p>Join the conversation and share your journey with us.</p>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>contact@manikant.com.np</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Manikant. All rights reserved.</p>
        </div>
      </footer>
    </div >
  );
}
