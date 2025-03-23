import React, { useState } from 'react';
import { PDFContactSheet } from './components/PDFContactSheet';
import { ConfigPanel } from './components/ConfigPanel';
import './App.css';

function App() {
  const [config, setConfig] = useState({
    columns: 3,
    rows: 3,
    spacing: 10,
    pageSize: 'A4',
    resolution: 600,
    layoutDirection: 'down' as 'across' | 'down'
  });

  return (
    <div className="app">
      <h1>PDF Contact Sheet Generator</h1>
      <ConfigPanel config={config} onConfigChange={setConfig} />
      <PDFContactSheet config={config} />
    </div>
  );
}

export default App;
