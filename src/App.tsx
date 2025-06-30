import { useState, useEffect } from 'react';
import { PDFContactSheet } from './components/PDFContactSheet';
import { HorizontalPDFContactSheet } from './components/HorizontalPDFContactSheet';
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
  
  const [activeTab, setActiveTab] = useState<'standard' | 'horizontal'>('standard');
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

    // Listen for changes (in case user switches between modes)
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
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
              <h1>PrajoL's</h1>
              <h2>Minimize Maker</h2>
            </div>
            <div className="tab-selector">
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
            </div>
            {sidebarOpen && (
              <div className="config-wrapper">
                <h3 className="config-section-title">
                  {activeTab === 'standard' ? 'Standard Sheet Settings' : 'Two n T Settings'}
                </h3>
                
                {activeTab === 'standard' ? (
                  <ConfigPanel config={standardConfig} onConfigChange={setStandardConfig} />
                ) : (
                  <TwoNTConfigPanel config={twoNTConfig} onConfigChange={setTwoNTConfig} />
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="main-content">
          <div className="content-header">
            <h2>{activeTab === 'standard' ? 'Standard Contact Sheet' : 'Two n T Layout'}</h2>
          </div>
          
          <div className="content-body">
            {activeTab === 'standard' ? (
              <div className="standard-sheet-section">
                <PDFContactSheet config={standardConfig} />
              </div>
            ) : (
              <div className="two-n-t-section">
                <HorizontalPDFContactSheet config={twoNTConfig} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
