import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import '../../styles/ManikantLanding.css';

// Lazy load R2 upload only when needed
const loadR2Upload = () => import('../../utils/r2Storage').then(m => m.uploadToR2);

// Lazy load heic2any for HEIC/HEIF conversion
const loadHeic2Any = () => import('heic2any');

// Convert HEIC/HEIF to JPEG if needed
const convertHeicIfNeeded = async (file: File): Promise<File> => {
    const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

    if (!isHeic) return file;

    try {
        const heic2any = (await loadHeic2Any()).default;
        const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
        });

        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');

        return new File([blob], newFileName, { type: 'image/jpeg' });
    } catch (error) {
        console.error('HEIC conversion failed:', error);
        throw new Error('Could not convert HEIC image. Please convert to JPEG/PNG first.');
    }
};

interface UserProfileModalProps {
    user: any;
    onClose: () => void;
    onUpdate: () => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function UserProfileModal({ user, onClose, onUpdate, showNotification }: UserProfileModalProps) {
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [converting, setConverting] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, bio, avatar_url')
                .eq('id', user.id)
                .single();

            if (data) {
                setFullName(data.full_name || '');
                setBio(data.bio || '');
                setCurrentAvatarUrl(data.avatar_url || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            const isHeic =
                file.type === 'image/heic' ||
                file.type === 'image/heif' ||
                file.name.toLowerCase().endsWith('.heic') ||
                file.name.toLowerCase().endsWith('.heif');

            if (isHeic) {
                setConverting(true);
                showNotification('Converting HEIC image...', 'success');
            }

            try {
                // Convert HEIC/HEIF to JPEG if needed
                const processedFile = await convertHeicIfNeeded(file);
                setAvatarFile(processedFile);
                setPreviewUrl(URL.createObjectURL(processedFile));
                
                if (isHeic) {
                    showNotification('Image converted successfully!', 'success');
                }
            } catch (error: any) {
                console.error('File processing error:', error);
                showNotification(error.message || 'Failed to process image', 'error');
            } finally {
                setConverting(false);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let avatarUrl = currentAvatarUrl;

            if (avatarFile) {
                // avatarFile is already converted from HEIC if needed in handleFileChange
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `avatar_${Math.random()}.${fileExt}`;
                const filePath = `avatars/${user.id}/${fileName}`;

                // Lazy load R2 upload only when actually uploading
                const uploadToR2 = await loadR2Upload();
                const { success, url, error } = await uploadToR2(avatarFile, filePath);

                if (!success || !url) throw new Error(error || 'Failed to upload avatar');
                avatarUrl = url;
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: fullName,
                    bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            showNotification('Profile updated successfully!', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            showNotification('Error updating profile: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="manikant-modal-overlay" onClick={onClose}>
            <div className="manikant-modal" onClick={(e) => e.stopPropagation()}>
                <button className="manikant-modal-close" onClick={onClose}>×</button>
                <h3>Edit Profile</h3>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <img
                                src={previewUrl || currentAvatarUrl || 'https://via.placeholder.com/100?text=User'}
                                alt="Profile"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '3px solid var(--primary-color)',
                                    boxShadow: '0 0 15px rgba(140, 82, 255, 0.3)',
                                    opacity: converting ? 0.5 : 1,
                                }}
                            />
                            {converting && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: 'var(--primary-color)',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                    }}
                                >
                                    Converting...
                                </div>
                            )}
                            <label
                                htmlFor="avatar-upload"
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: converting ? 'wait' : 'pointer',
                                    border: '2px solid var(--card-bg)',
                                }}
                            >
                                ✎
                            </label>
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={converting}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Full Name</label>
                        <input
                            type="text"
                            className="manikant-input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Bio</label>
                        <textarea
                            className="manikant-input"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            style={{ minHeight: '80px' }}
                        />
                    </div>

                    <button type="submit" className="manikant-btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
