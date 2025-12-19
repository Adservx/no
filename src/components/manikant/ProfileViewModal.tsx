import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import '../../styles/ProfileViewModal.css';

interface Post {
  id: string;
  content: string | null;
  type: string | null;
  media_url: string | null;
  title: string | null;
  created_at: string;
}

// Parse all media URLs from a post
const getAllMediaUrls = (mediaUrl: string | null): string[] => {
  if (!mediaUrl) return [];
  try {
    if (mediaUrl.startsWith('[')) {
      const parsed = JSON.parse(mediaUrl);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    }
    return [mediaUrl];
  } catch {
    return [mediaUrl];
  }
};

interface ProfileData {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  updated_at: string | null;
}

interface ProfileViewModalProps {
  profileId: string;
  onClose: () => void;
}

export default function ProfileViewModal({ profileId, onClose }: ProfileViewModalProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Touch/swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when profileId changes
    setLoading(true);
    setPosts([]);
    setProfile(null);
    setTotalLikes(0);
    setActiveTab('posts');
    fetchProfileData();
  }, [profileId]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile and posts first
      const [profileRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('manikant_posts').select('*').eq('user_id', profileId).order('created_at', { ascending: false })
      ]);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);
      
      const userPosts = postsRes.data || [];
      setPosts(userPosts);

      // Fetch likes count for user's posts
      if (userPosts.length > 0) {
        const postIds = userPosts.map(p => p.id);
        const { data: likesData } = await supabase
          .from('manikant_likes')
          .select('id')
          .in('post_id', postIds);
        setTotalLikes(likesData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatMemberSince = (dateStr: string | null) => {
    if (!dateStr) return 'Recently joined';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getInitials = (name: string | null, username: string | null) => {
    const displayName = name || username || 'U';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Safe media URL parser
  const getMediaUrl = (mediaUrl: string | null): string | null => {
    if (!mediaUrl) return null;
    try {
      if (mediaUrl.startsWith('[')) {
        const parsed = JSON.parse(mediaUrl);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
      }
      return mediaUrl;
    } catch {
      return mediaUrl;
    }
  };

  // Reset media index when post changes
  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [selectedPost?.id]);

  // Get media URLs for selected post
  const mediaUrls = selectedPost ? getAllMediaUrls(selectedPost.media_url) : [];
  const hasMultipleMedia = mediaUrls.length > 1;

  // Navigation handlers
  const goToPrevMedia = useCallback(() => {
    setCurrentMediaIndex(prev => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
  }, [mediaUrls.length]);

  const goToNextMedia = useCallback(() => {
    setCurrentMediaIndex(prev => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
  }, [mediaUrls.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    
    if (Math.abs(diff) > minSwipeDistance && hasMultipleMedia) {
      if (diff > 0) {
        // Swiped left - go to next
        goToNextMedia();
      } else {
        // Swiped right - go to previous
        goToPrevMedia();
      }
    }
  };

  // Handle escape key and arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPost) setSelectedPost(null);
        else onClose();
      } else if (selectedPost && hasMultipleMedia) {
        if (e.key === 'ArrowLeft') {
          goToPrevMedia();
        } else if (e.key === 'ArrowRight') {
          goToNextMedia();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, onClose, hasMultipleMedia, goToPrevMedia, goToNextMedia]);

  if (loading) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal pro-modal" onClick={e => e.stopPropagation()}>
          <div className="profile-loading">
            <div className="profile-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal pro-modal" onClick={e => e.stopPropagation()}>
          <button className="profile-close-btn" onClick={onClose}>×</button>
          <div className="profile-error">
            <span>😕</span>
            <p>Profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal pro-modal" onClick={e => e.stopPropagation()}>
        <button className="profile-close-btn" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        {/* Cover/Banner Area */}
        <div className="profile-cover">
          <div className="cover-pattern"></div>
          <div className="cover-glow"></div>
        </div>

        {/* Avatar Section - Overlapping cover */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <div className="avatar-ring">
              <div 
                className={`profile-avatar-img ${imageLoaded ? 'loaded' : ''}`}
                style={profile.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined}
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="" 
                    onLoad={() => setImageLoaded(true)}
                    style={{ opacity: 0, position: 'absolute' }}
                  />
                ) : (
                  <span className="avatar-initials">{getInitials(profile.full_name, profile.username)}</span>
                )}
              </div>
            </div>
            <div className="online-indicator"></div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="profile-info-section">
          <h2 className="profile-display-name">
            {profile.full_name || profile.username || 'Anonymous'}
          </h2>
          {profile.username && (
            <p className="profile-handle">@{profile.username}</p>
          )}
          
          {/* Stats Row */}
          <div className="profile-stats-row">
            <div className="stat-box">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <span className="stat-value">{totalLikes}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <span className="stat-value">{posts.filter(p => p.media_url).length}</span>
              <span className="stat-label">Media</span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="profile-bio-section">
              <p className="bio-text">"{profile.bio}"</p>
            </div>
          )}

          {/* Member Since Badge */}
          <div className="member-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
            <span>Member since {formatMemberSince(profile.updated_at)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setActiveTab('posts')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ pointerEvents: 'none' }}>
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span style={{ pointerEvents: 'none' }}>Posts</span>
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setActiveTab('about')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ pointerEvents: 'none' }}>
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ pointerEvents: 'none' }}>About</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <>
              {posts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h4>No posts yet</h4>
                  <p>This user hasn't shared anything yet.</p>
                </div>
              ) : (
                <div className="posts-grid-pro">
                  {posts.map(post => {
                    const mediaUrl = getMediaUrl(post.media_url);
                    return (
                      <div 
                        key={post.id} 
                        className="post-card"
                        onClick={() => setSelectedPost(post)}
                      >
                        {mediaUrl ? (
                          <>
                            <div className="post-card-loading">
                              <span className="post-type-icon">
                                {post.type === 'photo' ? '📷' : post.type === 'video' ? '🎬' : '📄'}
                              </span>
                            </div>
                            <img 
                              src={mediaUrl} 
                              alt={post.title || 'Post'}
                              loading="lazy"
                              onLoad={(e) => {
                                const parent = (e.target as HTMLImageElement).parentElement;
                                const loadingDiv = parent?.querySelector('.post-card-loading');
                                if (loadingDiv) loadingDiv.remove();
                              }}
                            />
                          </>
                        ) : (
                          <div className="post-card-text">
                            <span className="post-type-icon">
                              {post.type === 'material' ? '📄' : post.type === 'video' ? '🎬' : '💬'}
                            </span>
                            <p>{post.title || post.content?.substring(0, 40) || 'Post'}</p>
                          </div>
                        )}
                        <div className="post-card-overlay">
                          <span className="overlay-icon">
                            {post.type === 'photo' ? '📷' : post.type === 'video' ? '🎬' : '📄'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="about-section">
              <div className="about-item">
                <div className="about-icon">👤</div>
                <div className="about-content">
                  <span className="about-label">Display Name</span>
                  <span className="about-value">{profile.full_name || 'Not set'}</span>
                </div>
              </div>
              <div className="about-item">
                <div className="about-icon">📝</div>
                <div className="about-content">
                  <span className="about-label">Bio</span>
                  <span className="about-value">{profile.bio || 'No bio added'}</span>
                </div>
              </div>
              <div className="about-item">
                <div className="about-icon">📊</div>
                <div className="about-content">
                  <span className="about-label">Activity</span>
                  <span className="about-value">{posts.length} posts · {totalLikes} likes received</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Post Detail Modal */}
        {selectedPost && (
          <div className="post-detail-overlay" onClick={() => setSelectedPost(null)}>
            <div className="post-detail-modal" onClick={e => e.stopPropagation()}>
              <button className="post-detail-close" onClick={() => setSelectedPost(null)}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              
              {mediaUrls.length > 0 && (
                <div 
                  className="detail-media"
                  ref={mediaContainerRef}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {selectedPost.type === 'video' ? (
                    <video src={mediaUrls[currentMediaIndex]} controls autoPlay />
                  ) : (
                    <img src={mediaUrls[currentMediaIndex]} alt={selectedPost.title || 'Post'} />
                  )}
                  
                  {/* Arrow buttons for desktop */}
                  {hasMultipleMedia && (
                    <>
                      <button 
                        className="media-nav-btn media-nav-prev"
                        onClick={(e) => { e.stopPropagation(); goToPrevMedia(); }}
                        aria-label="Previous image"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        className="media-nav-btn media-nav-next"
                        onClick={(e) => { e.stopPropagation(); goToNextMedia(); }}
                        aria-label="Next image"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {/* Dots indicator */}
                  {hasMultipleMedia && (
                    <div className="media-dots">
                      {mediaUrls.map((_, index) => (
                        <button
                          key={index}
                          className={`media-dot ${index === currentMediaIndex ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(index); }}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="detail-content">
                <div className="detail-header">
                  <div 
                    className="detail-avatar"
                    style={profile.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined}
                  >
                    {!profile.avatar_url && getInitials(profile.full_name, profile.username)}
                  </div>
                  <div className="detail-user-info">
                    <span className="detail-name">{profile.full_name || profile.username}</span>
                    <span className="detail-date">{formatDate(selectedPost.created_at)}</span>
                  </div>
                </div>
                
                {selectedPost.title && <h3 className="detail-title">{selectedPost.title}</h3>}
                {selectedPost.content && <p className="detail-text">{selectedPost.content}</p>}
                
                <div className="detail-meta">
                  <span className="meta-tag">{selectedPost.type}</span>
                  {hasMultipleMedia && (
                    <span className="meta-tag">{currentMediaIndex + 1} / {mediaUrls.length}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
