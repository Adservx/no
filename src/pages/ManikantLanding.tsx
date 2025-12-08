import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { uploadToR2 } from '../utils/r2Storage';
import UserProfileModal from '../components/manikant/UserProfileModal';
import { SpiderWebLogo, SpiderWebCorner } from '../components/SpiderWeb';
import '../styles/ManikantLanding.css';
import '../styles/SpiderWeb.css';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    avatar_url: string;
    bio: string;
  };
}

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
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
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

  // Edit Post State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<'photo' | 'video' | 'material'>('material');
  const [editFile, setEditFile] = useState<File | null>(null);

  // Likes and Comments State
  const [postLikes, setPostLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingLike, setLoadingLike] = useState<string | null>(null);
  const [loadingComment, setLoadingComment] = useState<string | null>(null);

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
      const { data, error } = await supabase
        .from('manikant_posts')
        .select('*, profiles(avatar_url, bio)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);

      // Fetch likes and comments for all posts
      if (data && data.length > 0) {
        await fetchLikesAndComments(data.map(p => p.id));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikesAndComments = async (postIds: string[]) => {
    try {
      // Fetch likes count for each post
      const { data: likesData } = await supabase
        .from('manikant_likes')
        .select('post_id')
        .in('post_id', postIds);

      // Count likes per post
      const likesCount: Record<string, number> = {};
      likesData?.forEach(like => {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
      });
      setPostLikes(likesCount);

      // Check which posts the current user has liked
      if (user) {
        const { data: userLikesData } = await supabase
          .from('manikant_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const userLikesMap: Record<string, boolean> = {};
        userLikesData?.forEach(like => {
          userLikesMap[like.post_id] = true;
        });
        setUserLikes(userLikesMap);
      }

      // Fetch comments count (we'll fetch full comments when expanded)
      const { data: commentsData } = await supabase
        .from('manikant_comments')
        .select('post_id')
        .in('post_id', postIds);

      const commentsCount: Record<string, number> = {};
      commentsData?.forEach(comment => {
        commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
      });

      // Store as postComments length placeholder
      const commentsPlaceholder: Record<string, Comment[]> = {};
      Object.keys(commentsCount).forEach(postId => {
        commentsPlaceholder[postId] = new Array(commentsCount[postId]).fill({} as Comment);
      });
      setPostComments(prev => ({ ...commentsPlaceholder, ...prev }));

    } catch (error) {
      console.error('Error fetching likes/comments:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      showNotification('Please login to like posts', 'error');
      setIsLogin(true);
      return;
    }

    setLoadingLike(postId);
    try {
      if (userLikes[postId]) {
        // Unlike
        const { error } = await supabase
          .from('manikant_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserLikes(prev => ({ ...prev, [postId]: false }));
        setPostLikes(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }));
      } else {
        // Like
        const { error } = await supabase
          .from('manikant_likes')
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        setUserLikes(prev => ({ ...prev, [postId]: true }));
        setPostLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      }
    } catch (error: any) {
      console.error('Error liking post:', error);
      showNotification('Failed to update like', 'error');
    } finally {
      setLoadingLike(null);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('manikant_comments')
        .select('*, profiles(avatar_url, bio)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPostComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleComments = async (postId: string) => {
    const isExpanding = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanding }));

    if (isExpanding) {
      await fetchComments(postId);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      showNotification('Please login to comment', 'error');
      setIsLogin(true);
      return;
    }

    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    setLoadingComment(postId);
    try {
      const { data, error } = await supabase
        .from('manikant_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentText
        })
        .select('*, profiles(avatar_url, bio)')
        .single();

      if (error) throw error;

      // Add the new comment to the list
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      showNotification('Comment added!', 'success');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      showNotification('Failed to add comment', 'error');
    } finally {
      setLoadingComment(null);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('manikant_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPostComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(c => c.id !== commentId)
      }));
      showNotification('Comment deleted', 'success');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      showNotification('Failed to delete comment', 'error');
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
    if (!user) {
      showNotification('You must be logged in to create a post', 'error');
      return;
    }

    setUploading(true);
    try {
      let mediaUrl = '';

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        // Use a folder prefix for organization in R2
        const filePath = `manikant_files/${user.id}/${fileName}`;

        console.log('Uploading file to R2:', filePath);
        const { success, url, error: uploadError } = await uploadToR2(file, filePath);
        console.log('R2 upload result:', { success, url, error: uploadError });

        if (!success || !url) {
          throw new Error(uploadError || 'File upload to R2 failed');
        }

        mediaUrl = url;
      }

      console.log('Inserting post to database:', { user_id: user.id, title: newTitle, type: newType, media_url: mediaUrl });

      const { data, error } = await supabase.from('manikant_posts').insert({
        user_id: user.id,
        title: newTitle,
        content: newContent,
        type: newType,
        media_url: mediaUrl
      }).select();

      console.log('Database insert result:', { data, error });

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      setNewTitle('');
      setNewContent('');
      setFile(null);
      fetchPosts();
      showNotification('Post created successfully!', 'success');
    } catch (error: any) {
      console.error('Error creating post:', error);
      showNotification('Error creating post: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditType(post.type);
    setEditFile(null);
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingPost) return;

    setUploading(true);
    try {
      let mediaUrl = editingPost.media_url || '';

      // If a new file is selected, upload it
      if (editFile) {
        const fileExt = editFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `manikant_files/${user.id}/${fileName}`;

        const { success, url, error: uploadError } = await uploadToR2(editFile, filePath);

        if (!success || !url) {
          throw new Error(uploadError || 'File upload failed');
        }
        mediaUrl = url;
      }

      const { error } = await supabase
        .from('manikant_posts')
        .update({
          title: editTitle,
          content: editContent,
          type: editType,
          media_url: mediaUrl
        })
        .eq('id', editingPost.id)
        .eq('user_id', user.id); // Ensure user can only update their own posts

      if (error) throw error;

      setEditingPost(null);
      setEditTitle('');
      setEditContent('');
      setEditFile(null);
      fetchPosts();
      showNotification('Post updated successfully!', 'success');
    } catch (error: any) {
      showNotification('Error updating post: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('manikant_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // Ensure user can only delete their own posts

      if (error) throw error;

      fetchPosts();
      showNotification('Post deleted successfully!', 'success');
    } catch (error: any) {
      showNotification('Error deleting post: ' + error.message, 'error');
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

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="manikant-modal-overlay" onClick={() => setEditingPost(null)}>
          <div className="manikant-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="manikant-modal-close" onClick={() => setEditingPost(null)}>×</button>
            <h3>Edit Post</h3>
            <form onSubmit={handleUpdatePost}>
              <input
                type="text"
                placeholder="Title"
                className="manikant-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Content"
                className="manikant-input"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                required
              />
              <select
                className="manikant-input"
                value={editType}
                onChange={(e: any) => setEditType(e.target.value)}
              >
                <option value="material">Study Material</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
              </select>

              {editingPost.media_url && (
                <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--card-bg)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Current file:</p>
                  <a href={editingPost.media_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}>
                    View current file
                  </a>
                </div>
              )}

              <div className="manikant-file-input-wrapper">
                <input
                  type="file"
                  id="edit-file-upload"
                  className="manikant-file-input-hidden"
                  onChange={e => setEditFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="edit-file-upload" className="manikant-file-label">
                  <span className="file-icon">📎</span>
                  {editFile ? editFile.name : 'Replace file (optional)...'}
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="button" className="manikant-btn" style={{ background: 'var(--text-muted)' }} onClick={() => setEditingPost(null)}>
                  Cancel
                </button>
                <button type="submit" className="manikant-btn" disabled={uploading}>
                  {uploading ? 'Updating...' : 'Update Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="manikant-nav">
        <SpiderWebCorner className="spider-web-top-left" size={80} />
        <Link to="/" className="manikant-logo">Manikant.com.np <SpiderWebLogo /></Link>
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
        <SpiderWebCorner className="spider-web-top-left" size={100} />
        <SpiderWebCorner className="spider-web-top-right" size={100} />
        <h1>Sub-Electrical Engineers Hub <SpiderWebLogo /></h1>
        <p>A place to share project memories, photos, videos, and study materials.</p>
        <div className="manikant-scroll-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <SpiderWebCorner className="spider-web-bottom-left" size={100} />
        <SpiderWebCorner className="spider-web-bottom-right" size={100} />
      </header>

      <section className="manikant-features">
        <SpiderWebCorner className="spider-web-top-left" size={80} />
        <div className="manikant-feature-card">
          <SpiderWebCorner className="spider-web-top-right" size={60} />
          <span className="manikant-feature-icon">📚</span>
          <h3>Study Materials</h3>
          <p>Access a vast collection of notes, past papers, and reference books.</p>
        </div>

        <div className="manikant-feature-card">
          <SpiderWebCorner className="spider-web-top-right" size={60} />
          <span className="manikant-feature-icon">🤝</span>
          <h3>Community</h3>
          <p>Connect with fellow sub-engineers, share experiences and grow together.</p>
        </div>
        <SpiderWebCorner className="spider-web-bottom-right" size={80} />
      </section>

      {/* Posts Section */}
      <section className="manikant-posts-section">
        <SpiderWebCorner className="spider-web-top-left" size={120} />
        <SpiderWebCorner className="spider-web-top-right" size={120} />
        <div className="posts-section-header">
          <span className="section-icon">📝</span>
          <h2>Community Posts</h2>
          <p>Explore shared memories, study materials, and experiences from fellow sub-electrical engineers</p>
          <div className="posts-section-divider">
            <span></span>
            <SpiderWebLogo />
            <span></span>
          </div>
        </div>

        {/* Posts Filter/Stats Bar */}
        <div className="posts-stats-bar">
          <div className="posts-stat">
            <span className="stat-icon">📚</span>
            <span className="stat-count">{posts.filter(p => p.type === 'material').length}</span>
            <span className="stat-label">Materials</span>
          </div>
          <div className="posts-stat">
            <span className="stat-icon">📷</span>
            <span className="stat-count">{posts.filter(p => p.type === 'photo').length}</span>
            <span className="stat-label">Photos</span>
          </div>
          <div className="posts-stat">
            <span className="stat-icon">🎥</span>
            <span className="stat-count">{posts.filter(p => p.type === 'video').length}</span>
            <span className="stat-label">Videos</span>
          </div>
          <div className="posts-stat total">
            <span className="stat-icon">✨</span>
            <span className="stat-count">{posts.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <SpiderWebCorner className="spider-web-bottom-left" size={80} />
        <SpiderWebCorner className="spider-web-bottom-right" size={80} />
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
              <article key={post.id} className="manikant-post instagram-style">
                {/* Instagram-style header */}
                <div className="post-header">
                  <div className="post-user-info">
                    {post.profiles?.avatar_url ? (
                      <img
                        src={post.profiles.avatar_url}
                        alt="Author"
                        className="post-avatar"
                      />
                    ) : (
                      <div className="post-avatar post-avatar-placeholder">
                        👤
                      </div>
                    )}
                    <div className="post-user-details">
                      <span className="post-username">{post.title}</span>
                      <span className="post-timestamp">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  {/* Options menu for post owner */}
                  {user && user.id === post.user_id && (
                    <div className="post-options">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="post-option-btn"
                        title="Edit post"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="post-option-btn delete"
                        title="Delete post"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {/* Media Section - Full width like Instagram */}
                {post.media_url && (
                  <div className="post-media-container">
                    {post.type === 'video' ? (
                      <video src={post.media_url} controls className="post-media" />
                    ) : post.type === 'photo' ? (
                      <img src={post.media_url} alt={post.title} className="post-media" />
                    ) : (
                      <div className="post-material">
                        {post.media_url.toLowerCase().endsWith('.pdf') ? (
                          <>
                            <iframe
                              src={`${post.media_url}#toolbar=1&navpanes=0`}
                              className="post-pdf-preview"
                              title={post.title}
                            />
                            <div className="post-material-actions">
                              <a
                                href={post.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="material-btn secondary"
                              >
                                📖 Open
                              </a>
                              <a
                                href={post.media_url}
                                download
                                className="material-btn primary"
                              >
                                📥 Download
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="post-file-display">
                            <div className="file-icon-large">📄</div>
                            <span className="file-name">{post.media_url.split('/').pop()}</span>
                            <a
                              href={post.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="material-btn primary"
                            >
                              📥 Download
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Type badge */}
                    <div className="post-type-badge">
                      {post.type === 'photo' ? '📷' : post.type === 'video' ? '🎥' : '📚'}
                      <span>{post.type}</span>
                    </div>
                  </div>
                )}

                {/* Caption/Content Section */}
                <div className="post-body">
                  <p className="post-caption">{post.content}</p>
                </div>

                {/* Post Footer - Functional engagement */}
                <div className="post-footer">
                  <div className="post-engagement">
                    <button
                      className={`engagement-btn like-btn ${userLikes[post.id] ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id)}
                      disabled={loadingLike === post.id}
                      title={userLikes[post.id] ? 'Unlike' : 'Like'}
                    >
                      {userLikes[post.id] ? '❤️' : '🤍'}
                      {(postLikes[post.id] || 0) > 0 && (
                        <span className="engagement-count">{postLikes[post.id]}</span>
                      )}
                    </button>
                    <button
                      className={`engagement-btn comment-btn ${expandedComments[post.id] ? 'active' : ''}`}
                      onClick={() => toggleComments(post.id)}
                      title="Comments"
                    >
                      💬
                      {(postComments[post.id]?.length || 0) > 0 && (
                        <span className="engagement-count">{postComments[post.id].length}</span>
                      )}
                    </button>
                    <button
                      className="engagement-btn share-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href + '#post-' + post.id);
                        showNotification('Link copied to clipboard!', 'success');
                      }}
                      title="Share"
                    >
                      🔗
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {expandedComments[post.id] && (
                  <div className="comments-section">
                    {/* Comment Input */}
                    <div className="comment-input-wrapper">
                      <input
                        type="text"
                        placeholder={user ? "Write a comment..." : "Login to comment"}
                        className="comment-input"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        disabled={!user || loadingComment === post.id}
                      />
                      <button
                        className="comment-submit-btn"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!user || loadingComment === post.id || !commentInputs[post.id]?.trim()}
                      >
                        {loadingComment === post.id ? '...' : '➤'}
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="comments-list">
                      {postComments[post.id]?.filter(c => c.id).map(comment => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-avatar">
                            {comment.profiles?.avatar_url ? (
                              <img src={comment.profiles.avatar_url} alt="" />
                            ) : (
                              <span>👤</span>
                            )}
                          </div>
                          <div className="comment-content">
                            <p className="comment-text">{comment.content}</p>
                            <span className="comment-time">
                              {new Date(comment.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {user && user.id === comment.user_id && (
                            <button
                              className="comment-delete-btn"
                              onClick={() => handleDeleteComment(comment.id, post.id)}
                              title="Delete comment"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {(!postComments[post.id] || postComments[post.id].filter(c => c.id).length === 0) && (
                        <p className="no-comments">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
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
    </div>
  );
}
