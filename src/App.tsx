import { useState } from 'react';
import { PDFContactSheet } from './components/PDFContactSheet';
import { HorizontalPDFContactSheet } from './components/HorizontalPDFContactSheet';
import { ConfigPanel } from './components/ConfigPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';  // Updated import path

export interface Config {
  columns: number;
  rows: number;
  spacing: number;
  pageSize: 'A4' | 'A3' | 'Letter';
  resolution: number;
  layoutDirection: 'across' | 'down';
}

function App() {
  const [config, setConfig] = useState<Config>({
    columns: 3,
    rows: 3,
    spacing: 0.2,
    pageSize: 'A4',
    resolution: 600,
    layoutDirection: 'down'
  });
  
  const [activeTab, setActiveTab] = useState<'standard' | 'horizontal'>('standard');

  return (
    <ErrorBoundary>
      <div className="app">
        <h1 className="cyberpunk-title">PrajoL's Minimize Maker</h1>
        
        <div className="tab-container">
          <button 
            className={`tab-button ${activeTab === 'standard' ? 'active' : ''}`} 
            onClick={() => setActiveTab('standard')}
          >
            Standard Contact Sheet
          </button>
          <button 
            className={`tab-button ${activeTab === 'horizontal' ? 'active' : ''}`} 
            onClick={() => setActiveTab('horizontal')}
          >
            Two n T
          </button>
        </div>
        
        {activeTab === 'standard' && (
          <>
            <ConfigPanel config={config} onConfigChange={setConfig} />
            <PDFContactSheet config={config} />
          </>
        )}
        
        {activeTab === 'horizontal' && (
          <HorizontalPDFContactSheet config={config} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
