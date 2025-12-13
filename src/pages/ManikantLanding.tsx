import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, memo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SmartImage from '../components/SmartImage';
import '../styles/ManikantLanding.css';
import '../styles/SpiderWeb.css';

// Lazy load heavy components
const UserProfileModal = lazy(() => import('../components/manikant/UserProfileModal'));
const SpiderWebLogo = lazy(() => import('../components/SpiderWeb').then(m => ({ default: m.SpiderWebLogo })));
const SpiderWebCorner = lazy(() => import('../components/SpiderWeb').then(m => ({ default: m.SpiderWebCorner })));

// Lazy load R2 upload only when needed
const loadR2Upload = () => import('../utils/r2Storage').then(m => m.uploadToR2);

// Lazy load heic2any for HEIC/HEIF conversion
const loadHeic2Any = () => import('heic2any');

// Convert HEIC/HEIF to JPEG if needed
const convertHeicIfNeeded = async (file: File): Promise<File> => {
  const isHeic = file.type === 'image/heic' || 
                 file.type === 'image/heif' || 
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');
  
  if (!isHeic) return file;
  
  try {
    const heic2any = (await loadHeic2Any()).default;
    const convertedBlob = await heic2any({ 
      blob: file, 
      toType: 'image/jpeg', 
      quality: 0.9 
    });
    
    // heic2any can return a single blob or array of blobs
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    
    return new File([blob], newFileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw new Error('Could not convert HEIC image. Please convert to JPEG/PNG first.');
  }
};

// Memoized placeholder for SpiderWeb components during load
const SpiderWebPlaceholder = memo(() => <span style={{ width: 20, height: 20, display: 'inline-block' }} />);
const CornerPlaceholder = memo(() => <div style={{ position: 'absolute', width: 80, height: 80 }} />);

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

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
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
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

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

  // Create Post Dropdown State
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Likes and Comments State
  const [postLikes, setPostLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingLike, setLoadingLike] = useState<string | null>(null);
  const [loadingComment, setLoadingComment] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Memoized post stats to avoid recalculating on every render
  const postStats = useMemo(() => ({
    materials: posts.filter(p => p.type === 'material').length,
    photos: posts.filter(p => p.type === 'photo').length,
    videos: posts.filter(p => p.type === 'video').length,
    total: posts.length
  }), [posts]);

  // Memoized notification handler
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  }, []);

  // Fetch all user profiles for footer
  const fetchAllProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio');
      
      if (!error && data) {
        setAllProfiles(data);
      }
    } catch (error) {
      // Silent fail - not critical
    }
  }, []);

  // Initialize data on mount - run auth and posts in parallel
  useEffect(() => {
    const initializeData = async () => {
      // Run auth check and posts fetch in PARALLEL for faster loading
      const [authResult, postsResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('manikant_posts')
          .select('*, profiles(avatar_url, bio)')
          .order('created_at', { ascending: false })
          .limit(20) // Limit initial load for faster response
      ]);

      const currentUser = authResult.data?.user;
      setUser(currentUser);

      if (postsResult.data) {
        setPosts(postsResult.data);
        // Fetch likes/comments in background (non-blocking)
        if (postsResult.data.length > 0) {
          fetchLikesAndComments(postsResult.data.map(p => p.id), currentUser?.id);
        }
      }

      // Fetch profile in background if user exists
      if (currentUser) {
        fetchProfile(currentUser.id);
      }

      // Fetch all profiles for footer
      fetchAllProfiles();

      setLoading(false);
    };

    initializeData();

    // Auth state listener
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

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('bio, avatar_url') // Only select needed fields
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      // Silent fail for profile - not critical
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('manikant_posts')
        .select('*, profiles(avatar_url, bio)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);

      if (data && data.length > 0) {
        fetchLikesAndComments(data.map(p => p.id), user?.id);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Optimized: Run all queries in PARALLEL
  const fetchLikesAndComments = useCallback(async (postIds: string[], userId?: string) => {
    if (postIds.length === 0) return;

    try {
      // Run ALL queries in parallel - much faster!
      const likesPromise = supabase.from('manikant_likes').select('post_id').in('post_id', postIds);
      const commentsPromise = supabase.from('manikant_comments').select('post_id').in('post_id', postIds);
      const userLikesPromise = userId 
        ? supabase.from('manikant_likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
        : Promise.resolve({ data: null });

      const [likesResult, commentsResult, userLikesResult] = await Promise.all([
        likesPromise,
        commentsPromise,
        userLikesPromise
      ]);

      // Process likes count
      const likesCount: Record<string, number> = {};
      likesResult.data?.forEach((like: any) => {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
      });
      setPostLikes(likesCount);

      // Process user likes
      if (userLikesResult?.data) {
        const userLikesMap: Record<string, boolean> = {};
        userLikesResult.data.forEach((like: any) => {
          userLikesMap[like.post_id] = true;
        });
        setUserLikes(userLikesMap);
      }

      // Process comments count
      const commentsCount: Record<string, number> = {};
      commentsResult.data?.forEach((comment: any) => {
        commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
      });

      // Store as postComments length placeholder
      const commentsPlaceholder: Record<string, Comment[]> = {};
      Object.keys(commentsCount).forEach(postId => {
        commentsPlaceholder[postId] = new Array(commentsCount[postId]).fill({} as Comment);
      });
      setPostComments(prev => ({ ...commentsPlaceholder, ...prev }));

    } catch (error) {
      // Silent fail - likes/comments are not critical for initial render
    }
  }, []);

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

  const handleCreatePost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showNotification('You must be logged in to create a post', 'error');
      return;
    }

    setUploading(true);
    try {
      let mediaUrl = '';

      if (file) {
        // Convert HEIC/HEIF to JPEG if needed
        const processedFile = await convertHeicIfNeeded(file);
        
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `manikant_files/${user.id}/${fileName}`;

        // Lazy load R2 upload only when needed
        const uploadToR2 = await loadR2Upload();
        const { success, url, error: uploadError } = await uploadToR2(processedFile, filePath);

        if (!success || !url) {
          throw new Error(uploadError || 'File upload to R2 failed');
        }

        mediaUrl = url;
      }

      const { error } = await supabase.from('manikant_posts').insert({
        user_id: user.id,
        title: newTitle,
        content: newContent,
        type: newType,
        media_url: mediaUrl
      }).select();

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
  }, [user, file, newTitle, newContent, newType, showNotification]);

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditType(post.type);
    setEditFile(null);
  };

  const handleUpdatePost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingPost) return;

    setUploading(true);
    try {
      let mediaUrl = editingPost.media_url || '';

      if (editFile) {
        // Convert HEIC/HEIF to JPEG if needed
        const processedFile = await convertHeicIfNeeded(editFile);
        
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `manikant_files/${user.id}/${fileName}`;

        // Lazy load R2 upload only when needed
        const uploadToR2 = await loadR2Upload();
        const { success, url, error: uploadError } = await uploadToR2(processedFile, filePath);

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
        .eq('user_id', user.id);

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
  }, [user, editingPost, editFile, editTitle, editContent, editType, showNotification]);

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
        <Suspense fallback={<div className="manikant-loading"><div className="spinner"></div></div>}>
          <UserProfileModal
            user={user}
            onClose={() => setShowProfileModal(false)}
            onUpdate={() => {
              fetchProfile(user.id);
              fetchPosts();
            }}
            showNotification={showNotification}
          />
        </Suspense>
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
        <Suspense fallback={<CornerPlaceholder />}>
          <SpiderWebCorner className="spider-web-top-left" size={80} />
        </Suspense>
        <Link to="/" className="manikant-logo">Manikant<span className="logo-highlight">.com.np</span></Link>
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
        <Suspense fallback={null}>
          <SpiderWebCorner className="spider-web-top-left" size={100} />
          <SpiderWebCorner className="spider-web-top-right" size={100} />
        </Suspense>
        <h1>Sub-Electrical Engineers <span className="highlight">Hub</span></h1>
        <p>A place to share project memories, photos, videos, and study materials.</p>
        <div className="manikant-scroll-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <Suspense fallback={null}>
          <SpiderWebCorner className="spider-web-bottom-left" size={100} />
          <SpiderWebCorner className="spider-web-bottom-right" size={100} />
        </Suspense>
      </header>

      <section className="manikant-features">
        <Suspense fallback={null}>
          <SpiderWebCorner className="spider-web-top-left" size={80} />
        </Suspense>
        <div className="manikant-feature-card">
          <Suspense fallback={null}><SpiderWebCorner className="spider-web-top-right" size={60} /></Suspense>
          <span className="manikant-feature-icon">📚</span>
          <h3>Study Materials</h3>
          <p>Access a vast collection of notes, past papers, and reference books.</p>
        </div>

        <div className="manikant-feature-card">
          <Suspense fallback={null}><SpiderWebCorner className="spider-web-top-right" size={60} /></Suspense>
          <span className="manikant-feature-icon">🤝</span>
          <h3>Community</h3>
          <p>Connect with fellow sub-engineers, share experiences and grow together.</p>
        </div>
        <Suspense fallback={null}>
          <SpiderWebCorner className="spider-web-bottom-right" size={80} />
        </Suspense>
      </section>

      {/* Posts Section */}
      <section className="manikant-posts-section">
        <Suspense fallback={null}>
          <SpiderWebCorner className="spider-web-top-left" size={120} />
          <SpiderWebCorner className="spider-web-top-right" size={120} />
        </Suspense>
        <div className="posts-section-header">
          <span className="section-icon">📝</span>
          <h2>Community <span className="highlight">Posts</span></h2>
          <p>Explore shared memories, study materials, and experiences from fellow engineers</p>
          <div className="posts-section-divider">
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Posts Filter/Stats Bar */}
        <div className="posts-stats-bar">
          <div className="posts-stat">
            <span className="stat-icon">📚</span>
            <span className="stat-count">{postStats.materials}</span>
            <span className="stat-label">Materials</span>
          </div>
          <div className="posts-stat">
            <span className="stat-icon">📷</span>
            <span className="stat-count">{postStats.photos}</span>
            <span className="stat-label">Photos</span>
          </div>
          <div className="posts-stat">
            <span className="stat-icon">🎥</span>
            <span className="stat-count">{postStats.videos}</span>
            <span className="stat-label">Videos</span>
          </div>
          <div className="posts-stat total">
            <span className="stat-icon">✨</span>
            <span className="stat-count">{postStats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <Suspense fallback={null}>
          <SpiderWebCorner className="spider-web-bottom-left" size={80} />
          <SpiderWebCorner className="spider-web-bottom-right" size={80} />
        </Suspense>
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
                        loading="lazy"
                        decoding="async"
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
                      <video src={post.media_url} controls className="post-media" preload="metadata" />
                    ) : post.type === 'photo' ? (
                      <SmartImage src={post.media_url || ''} alt={post.title} className="post-media" loading="lazy" decoding="async" />
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
              <div 
                className="create-post-header"
                onClick={() => setIsCreatePostOpen(!isCreatePostOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '10px 0',
                  marginBottom: isCreatePostOpen ? '15px' : '0'
                }}
              >
                <h3 style={{ margin: 0, background: 'var(--accent)', color: '#000', padding: '6px 14px', borderRadius: '6px', fontWeight: 600 }}>Create Post</h3>
                <span 
                  style={{
                    transform: isCreatePostOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '1.2rem'
                  }}
                >
                  ▼
                </span>
              </div>
              
              <div 
                className="create-post-content"
                style={{
                  maxHeight: isCreatePostOpen ? '500px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out',
                  opacity: isCreatePostOpen ? 1 : 0
                }}
              >
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
        <div className="footer-glow"></div>
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-icon">⚡</span>
              <span className="footer-logo-text">Manikant</span>
            </div>
            <p className="footer-tagline">Empowering Sub-Electrical Engineers with resources, community, and shared knowledge.</p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://mail.google.com/mail/?view=cm&to=imserv67@gmail.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </a>
            </div>
          </div>
          
          <div className="footer-links-grid">
            <div className="footer-section">
              <h4>Navigation</h4>
              <Link to="/">Home</Link>
              <Link to="/prajols-web">Prajol's Web</Link>
              <Link to="/prajols-web">Study Notes</Link>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <Link to="/prajols-web">PDF Library</Link>
              <Link to="/community">Community</Link>
              <Link to="/about">About Us</Link>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <a href="https://mail.google.com/mail/?view=cm&to=imserv67@gmail.com" target="_blank" rel="noopener noreferrer">imserv67@gmail.com</a>
              <span className="footer-location">📍 Nepal</span>
            </div>
          </div>

          {/* Community Members Section - Right Side */}
          {allProfiles.length > 0 && (
            <div className="footer-members">
              <h4>👥 Community Members</h4>
              <div className="footer-members-list">
                {allProfiles.map((userProfile) => (
                  <div key={userProfile.id} className="footer-member-card">
                    <div className="footer-member-avatar">
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt={userProfile.username || 'User'} loading="lazy" />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div className="footer-member-info">
                      <span className="footer-member-name">
                        {userProfile.full_name || userProfile.username || 'Anonymous'}
                      </span>
                      {userProfile.bio && (
                        <span className="footer-member-bio">
                          {userProfile.bio.length > 40 ? userProfile.bio.substring(0, 40) + '...' : userProfile.bio}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">&copy; {new Date().getFullYear()} Manikant. All rights reserved.</p>
            <p className="footer-credit">Built with ⚡ for Sub-Engineers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
