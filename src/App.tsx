import { useState, useEffect } from 'react';
import { PDFContactSheet } from './components/PDFContactSheet';
import { HorizontalPDFContactSheet } from './components/HorizontalPDFContactSheet';
import { CustomOrderPDFContactSheet } from './components/CustomOrderPDFContactSheet';
import { PDFStore } from './components/PDFStore';
import { ConfigPanel } from './components/ConfigPanel';
import { TwoNTConfigPanel } from './components/TwoNTConfigPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
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
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
    }

    // Listen for changes (in case user switches between modes)
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        setSidebarOpen(true);
        document.documentElement.classList.add('pwa-mode');
      } else {
        document.documentElement.classList.remove('pwa-mode');
      }
    };

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ErrorBoundary>
      <div className={`app-container ${isStandalone ? 'standalone-mode' : ''}`}>
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '◀' : '▶'}
          </div>
          <div className="sidebar-content">
            <div className="logo">
              <h1>Electrical</h1>
              <h2>Engineering</h2>
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
              </div>
            )}
          </div>
        </div>
        
        <div className="main-content">
          <div className="content-header">
            <h2>
              {activeTab === 'standard' ? 'Standard Contact Sheet' : 
               activeTab === 'horizontal' ? 'Two n T Layout' : 
               activeTab === 'custom' ? 'Custom Order Contact Sheet' :
               'Electrical Engineering PDF Store'}
            </h2>
          </div>
          
          <div className="content-body">
            {activeTab === 'standard' ? (
              <div className="standard-sheet-section">
                <PDFContactSheet config={standardConfig} />
              </div>
            ) : activeTab === 'horizontal' ? (
              <div className="two-n-t-section">
                <HorizontalPDFContactSheet config={twoNTConfig} />
              </div>
            ) : activeTab === 'custom' ? (
              <div className="custom-order-section">
                <CustomOrderPDFContactSheet config={standardConfig} />
              </div>
            ) : (
              <div className="pdf-store-section">
                <PDFStore />
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
