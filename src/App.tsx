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

// Bubble interface for typing
interface Bubble {
  id: number;
  size: number;
  left: number;
  duration: number;
  delay: number;
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
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  // Create bubbles on component mount
  useEffect(() => {
    const numberOfBubbles = 15;
    const newBubbles: Bubble[] = [];
    
    for (let i = 0; i < numberOfBubbles; i++) {
      newBubbles.push({
        id: i,
        size: Math.floor(Math.random() * 60) + 20, // Random size between 20px and 80px
        left: Math.floor(Math.random() * 100), // Random position from 0% to 100%
        duration: Math.floor(Math.random() * 15) + 10, // Random duration between 10s and 25s
        delay: Math.floor(Math.random() * 15) // Random delay up to 15s
      });
    }
    
    setBubbles(newBubbles);
    
    // Set CSS variable for bubble durations
    document.documentElement.style.setProperty('--bubble-duration', '15s');
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Render bubbles */}
        {bubbles.map((bubble) => (
          <div 
            key={bubble.id}
            className="bubble"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: `${bubble.left}%`,
              animationDuration: `${bubble.duration}s`,
              animationDelay: `${bubble.delay}s`
            }}
          />
        ))}
        
        {/* Water shimmer effect */}
        <div className="shimmer"></div>
        
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
