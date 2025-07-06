import { useState, useEffect } from 'react';
import { PDFContactSheet } from './components/PDFContactSheet';
import { HorizontalPDFContactSheet } from './components/HorizontalPDFContactSheet';
import { CustomOrderPDFContactSheet } from './components/CustomOrderPDFContactSheet';
import { PDFStore } from './components/PDFStore';
import { ConfigPanel } from './components/ConfigPanel';
import { TwoNTConfigPanel } from './components/TwoNTConfigPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SpiderWebLogo, SpiderWebCorner } from './components/SpiderWeb';
import './styles/SpiderWeb.css';
import './App.css';

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

function App() {
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
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <SpiderWebCorner className="spider-web-top-left" />
          <div className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '◀' : '▶'}
          </div>
          <div className="sidebar-content">
            <div className="logo">
              <h1>Prajol's Web <SpiderWebLogo /></h1>
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
                <SpiderWebCorner className="spider-web-top-right" />
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
                <SpiderWebCorner className="spider-web-bottom-left" />
              </div>
            )}
          </div>
          <SpiderWebCorner className="spider-web-bottom-right" />
        </div>
        
        <div className="main-content">
          <SpiderWebCorner className="spider-web-top-left" />
          <div className="content-header">
            <h2>
              {activeTab === 'standard' ? 'Standard Contact Sheet' : 
               activeTab === 'horizontal' ? 'Two n T Layout' : 
               activeTab === 'custom' ? 'Custom Order Contact Sheet' :
               'Prajol\'s Web PDF Store'} <SpiderWebLogo />
            </h2>
          </div>
          
          <div className="content-body">
            <SpiderWebCorner className="spider-web-top-right" />
            {activeTab === 'standard' ? (
              <div className="standard-sheet-section">
                <SpiderWebCorner className="spider-web-top-left" />
                <PDFContactSheet config={standardConfig} />
                <SpiderWebCorner className="spider-web-bottom-right" />
              </div>
            ) : activeTab === 'horizontal' ? (
              <div className="two-n-t-section">
                <SpiderWebCorner className="spider-web-top-left" />
                <HorizontalPDFContactSheet config={twoNTConfig} />
                <SpiderWebCorner className="spider-web-bottom-right" />
              </div>
            ) : activeTab === 'custom' ? (
              <div className="custom-order-section">
                <SpiderWebCorner className="spider-web-top-left" />
                <CustomOrderPDFContactSheet config={standardConfig} />
                <SpiderWebCorner className="spider-web-bottom-right" />
              </div>
            ) : (
              <div className="pdf-store-section">
                <SpiderWebCorner className="spider-web-top-left" />
                <PDFStore />
                <SpiderWebCorner className="spider-web-bottom-right" />
              </div>
            )}
            <SpiderWebCorner className="spider-web-bottom-left" />
          </div>
          <SpiderWebCorner className="spider-web-bottom-right" />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
