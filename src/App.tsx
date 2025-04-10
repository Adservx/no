import { useState } from 'react';
import { PDFContactSheet } from './components/PDFContactSheet';
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
    spacing: 10,
    pageSize: 'A4',
    resolution: 600,
    layoutDirection: 'down'
  });

  return (
    <ErrorBoundary>
      <div className="app">
        <h1 className="cyberpunk-title">PrajoL's Minimize Maker</h1>
        <ConfigPanel config={config} onConfigChange={setConfig} />
        <PDFContactSheet config={config} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
