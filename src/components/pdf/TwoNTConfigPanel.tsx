import React from 'react';
import './ConfigPanel.css';

interface TwoNTConfigPanelProps {
  config: {
    spacing: number;
    resolution: number;
  };
  onConfigChange: (config: any) => void;
}

export const TwoNTConfigPanel: React.FC<TwoNTConfigPanelProps> = ({ config, onConfigChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onConfigChange({
      ...config,
      [name]: Number(value),
    });
  };

  return (
    <div className="config-panel two-nt-config">
      <div className="config-group">
        <h4 className="config-group-title">
          <span className="config-icon">🖼️</span> Two n T Settings
        </h4>
        
        <div className="config-item">
          <label htmlFor="spacing">
            <span className="label-icon">↔️</span> Spacing (px)
          </label>
          <div className="input-wrapper">
            <input
              id="spacing"
              type="number"
              name="spacing"
              value={config.spacing}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
            />
            <div className="config-description">
              Space between pages on the sheet
            </div>
          </div>
        </div>
        
        <div className="config-item">
          <label htmlFor="resolution">
            <span className="label-icon">🔍</span> Resolution (DPI)
          </label>
          <div className="input-wrapper">
            <input
              id="resolution"
              type="number"
              name="resolution"
              value={config.resolution}
              onChange={handleChange}
              min="72"
              max="600"
              step="1"
            />
            <div className="config-description">
              Higher values produce larger, more detailed files
            </div>
          </div>
        </div>
      </div>
      
      <div className="two-nt-info-panel">
        <span className="info-icon">💡</span>
        <p>
          The Two n T layout places two pages side by side in landscape orientation, 
          perfect for book spreads and side-by-side comparisons.
        </p>
      </div>
    </div>
  );
}; 