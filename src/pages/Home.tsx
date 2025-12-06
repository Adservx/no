import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PDFContactSheet } from '../components/PDFContactSheet';
import { HorizontalPDFContactSheet } from '../components/HorizontalPDFContactSheet';
import { CustomOrderPDFContactSheet } from '../components/CustomOrderPDFContactSheet';
import { PDFStore } from '../components/PDFStore';
import { ConfigPanel } from '../components/ConfigPanel';
import { TwoNTConfigPanel } from '../components/TwoNTConfigPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SpiderWebLogo, SpiderWebCorner } from '../components/SpiderWeb';
import { SecretLogin, SecretLoginButton } from '../components/SecretLogin';
import { AdminFileUpload } from '../components/AdminFileUpload';
import { AdminFileManager } from '../components/AdminFileManager';
import { authHelpers } from '../utils/supabase';
import '../styles/SpiderWeb.css';
import '../styles/SecretLogin.css';
import '../App.css';

export interface Config {
    columns: number;
    rows: number;
    spacing: number;
    pageSize: 'A4' | 'A3' | 'Letter';
    resolution: number;
    layoutDirection: 'across' | 'down';
}

export interface TwoNTConfig {
    spacing: number;
    resolution: number;
}

function Home() {
    const [standardConfig, setStandardConfig] = useState<Config>({
        columns: 3,
        rows: 3,
        spacing: 0.2,
        pageSize: 'A4',
        resolution: 600,
        layoutDirection: 'down'
    });

    const [twoNTConfig, setTwoNTConfig] = useState<TwoNTConfig>({
        spacing: 0.2,
        resolution: 600
    });

    const [activeTab, setActiveTab] = useState<'standard' | 'horizontal' | 'custom' | 'pdfstore'>('pdfstore');
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [isStandalone, setIsStandalone] = useState<boolean>(false);
    const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
    const [showLogin, setShowLogin] = useState<boolean>(false);
    const [showAdminUpload, setShowAdminUpload] = useState<boolean>(false);
    const [showAdminManage, setShowAdminManage] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);
    const [refreshPDFStore, setRefreshPDFStore] = useState<number>(0);

    // Check if app is running in standalone mode (PWA)
    useEffect(() => {
        const isInStandaloneMode = () => {
            return (
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://')
            );
        };

        setIsStandalone(isInStandaloneMode());

        // Check URL parameters for PWA source
        const urlParams = new URLSearchParams(window.location.search);
        const isPwaSource = urlParams.get('source') === 'pwa';

        // When in standalone mode or launched from PWA, ensure sidebar is visible on mobile
        if (isInStandaloneMode() || isPwaSource) {
            setSidebarOpen(true);

            // Force the app to show proper layout in standalone mode
            document.documentElement.classList.add('pwa-mode');

            // Add meta viewport settings for better mobile display
            const metaViewport = document.querySelector('meta[name="viewport"]');
            if (metaViewport) {
                metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            }

            // Ensure sidebar is always visible in PWA mode on mobile
            const handleResize = () => {
                if (window.innerWidth <= 768) {
                    setSidebarOpen(true);
                }
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }

        // Fix for desktop layout - ensure proper rendering
        const fixDesktopLayout = () => {
            if (window.innerWidth > 768) {
                document.documentElement.style.setProperty('--app-width', '100%');
                document.documentElement.style.setProperty('--app-height', '100vh');
            }

            // Apply mobile-like UI to all laptop screens
            // Always add laptop-mode for desktop screens to make UI like mobile
            document.documentElement.classList.add('laptop-mode');

            // Always ensure sidebar is open for mobile-like experience
            setSidebarOpen(true);
        };

        fixDesktopLayout();
        window.addEventListener('resize', fixDesktopLayout);
        return () => window.removeEventListener('resize', fixDesktopLayout);
    }, []);

    // Check notification permission
    useEffect(() => {
        const checkNotificationPermission = async () => {
            if ('Notification' in window) {
                const permission = Notification.permission;
                setHasNotificationPermission(permission === 'granted');
            }
        };

        checkNotificationPermission();
    }, []);

    // Check auth state
    useEffect(() => {
        // Get initial session
        authHelpers.getSession().then(({ session }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = authHelpers.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await authHelpers.signOut();
        setUser(null);
    };

    const handleUploadSuccess = () => {
        // Trigger PDFStore refresh by updating the key
        setRefreshPDFStore(prev => prev + 1);
    };

    const handleFileDeleted = () => {
        // Trigger PDFStore refresh after file deletion
        setRefreshPDFStore(prev => prev + 1);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Request notification permission if in standalone mode
    const requestNotificationPermission = async () => {
        if ('Notification' in window && isStandalone && !hasNotificationPermission) {
            try {
                const permission = await Notification.requestPermission();
                setHasNotificationPermission(permission === 'granted');
                return permission === 'granted';
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                return false;
            }
        }
        return false;
    };

    return (
        <ErrorBoundary>
            <div className={`app-container ${isStandalone ? 'standalone-mode' : ''}`}>
                {/* Secret Login Button */}
                <SecretLoginButton
                    user={user}
                    onLogout={handleLogout}
                    onLoginClick={() => setShowLogin(true)}
                    onAdminUploadClick={() => setShowAdminUpload(true)}
                    onAdminManageClick={() => setShowAdminManage(true)}
                />

                {/* Secret Login Modal */}
                {showLogin && <SecretLogin onClose={() => setShowLogin(false)} />}

                {/* Admin File Upload Modal */}
                {showAdminUpload && (
                    <AdminFileUpload
                        onClose={() => setShowAdminUpload(false)}
                        onUploadSuccess={handleUploadSuccess}
                    />
                )}

                {/* Admin File Manager Modal */}
                {showAdminManage && (
                    <AdminFileManager
                        onClose={() => setShowAdminManage(false)}
                        onFileDeleted={handleFileDeleted}
                    />
                )}
                <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    <SpiderWebCorner className="spider-web-top-left" size={100} />
                    <div className="sidebar-toggle" onClick={toggleSidebar}>
                        {sidebarOpen ?
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                            </svg> :
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                        }
                    </div>
                    <div className="sidebar-content">
                        <div className="logo">
                            <h1>Prajol's Web <SpiderWebLogo /></h1>
                            <Link to="/" className="back-home-btn" style={{
                                display: 'block',
                                marginTop: '10px',
                                color: 'var(--accent-color)',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                padding: '5px',
                                border: '1px solid var(--accent-color)',
                                borderRadius: '5px',
                                transition: 'all 0.3s ease'
                            }}>
                                ← Back to Home
                            </Link>
                        </div>
                        <div className="tab-selector">
                            <button
                                className={`tab-button ${activeTab === 'pdfstore' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pdfstore')}
                            >
                                <span className="icon">📚</span>
                                <span className="label">PDF Store</span>
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'standard' ? 'active' : ''}`}
                                onClick={() => setActiveTab('standard')}
                            >
                                <span className="icon">📄</span>
                                <span className="label">Standard Sheet</span>
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'horizontal' ? 'active' : ''}`}
                                onClick={() => setActiveTab('horizontal')}
                            >
                                <span className="icon">⇔</span>
                                <span className="label">Two n T</span>
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
                                onClick={() => setActiveTab('custom')}
                            >
                                <span className="icon">🔄</span>
                                <span className="label">Custom Order</span>
                            </button>
                        </div>
                        {sidebarOpen && (
                            <div className="config-wrapper">
                                <SpiderWebCorner className="spider-web-top-right" size={100} />
                                <h3 className="config-section-title">
                                    {activeTab === 'standard' ? 'Standard Sheet Settings' :
                                        activeTab === 'horizontal' ? 'Two n T Settings' :
                                            activeTab === 'custom' ? 'Custom Order Settings' :
                                                'PDF Store Settings'}
                                </h3>

                                {activeTab === 'standard' ? (
                                    <ConfigPanel config={standardConfig} onConfigChange={setStandardConfig} />
                                ) : activeTab === 'horizontal' ? (
                                    <TwoNTConfigPanel config={twoNTConfig} onConfigChange={setTwoNTConfig} />
                                ) : activeTab === 'custom' ? (
                                    <ConfigPanel config={standardConfig} onConfigChange={setStandardConfig} />
                                ) : null}

                                {/* Show notification permission button in PWA mode */}
                                {isStandalone && activeTab === 'pdfstore' && !hasNotificationPermission && (
                                    <div className="notification-permission-container">
                                        <button
                                            className="notification-permission-button"
                                            onClick={requestNotificationPermission}
                                        >
                                            Enable Download Notifications
                                        </button>
                                        <p className="notification-permission-info">
                                            Allow notifications to get updates about your PDF downloads
                                        </p>
                                    </div>
                                )}
                                <SpiderWebCorner className="spider-web-bottom-left" size={100} />
                            </div>
                        )}
                    </div>
                    <SpiderWebCorner className="spider-web-bottom-right" size={100} />
                </div>

                <div className="main-content">
                    <SpiderWebCorner className="spider-web-top-left" size={100} />
                    <div className="content-header">
                        <h2>
                            {activeTab === 'standard' ? 'Standard Contact Sheet' :
                                activeTab === 'horizontal' ? 'Two n T Layout' :
                                    activeTab === 'custom' ? 'Custom Order Contact Sheet' :
                                        'Prajol\'s Web PDF Store'} <SpiderWebLogo />
                        </h2>
                    </div>

                    <div className="content-body">
                        <SpiderWebCorner className="spider-web-top-right" size={100} />
                        {activeTab === 'standard' ? (
                            <div className="standard-sheet-section">
                                <SpiderWebCorner className="spider-web-top-left" size={100} />
                                <PDFContactSheet config={standardConfig} />
                                <SpiderWebCorner className="spider-web-bottom-right" size={100} />
                            </div>
                        ) : activeTab === 'horizontal' ? (
                            <div className="two-n-t-section">
                                <SpiderWebCorner className="spider-web-top-left" size={100} />
                                <HorizontalPDFContactSheet config={twoNTConfig} />
                                <SpiderWebCorner className="spider-web-bottom-right" size={100} />
                            </div>
                        ) : activeTab === 'custom' ? (
                            <div className="custom-order-section">
                                <SpiderWebCorner className="spider-web-top-left" size={100} />
                                <CustomOrderPDFContactSheet config={standardConfig} />
                                <SpiderWebCorner className="spider-web-bottom-right" size={100} />
                            </div>
                        ) : (
                            <div className="pdf-store-section">
                                <SpiderWebCorner className="spider-web-top-left" size={100} />
                                <PDFStore key={refreshPDFStore} />
                                <SpiderWebCorner className="spider-web-bottom-right" size={100} />
                            </div>
                        )}
                        <SpiderWebCorner className="spider-web-bottom-left" size={100} />
                    </div>
                    <SpiderWebCorner className="spider-web-bottom-right" size={100} />
                </div>
            </div>
        </ErrorBoundary>
    );
}

export default Home;
