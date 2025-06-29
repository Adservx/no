import React from 'react';
import './ConfigPanel.css';

interface ConfigPanelProps {
  config: {
    columns: number;
    rows: number;
    spacing: number;
    pageSize: string;
    resolution: number;
    layoutDirection: 'across' | 'down';
  };
  onConfigChange: (config: any) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumericField = !['pageSize', 'layoutDirection'].includes(name);
    onConfigChange({
      ...config,
      [name]: isNumericField ? Number(value) : value,
    });
  };

  return (
    <div className="config-panel">
      <div className="config-group">
        <h4 className="config-group-title">
          <span className="config-icon">📏</span> Layout
        </h4>
        
        <div className="config-item">
          <label htmlFor="columns">
            <span className="label-icon">↔️</span> Columns
          </label>
          <div className="input-wrapper">
            <input
              id="columns"
              type="number"
              name="columns"
              value={config.columns}
              onChange={handleChange}
              min="1"
              max="10"
            />
            <div className="config-description">Number of thumbnails horizontally</div>
          </div>
        </div>
        
        <div className="config-item">
          <label htmlFor="rows">
            <span className="label-icon">↕️</span> Rows
          </label>
          <div className="input-wrapper">
            <input
              id="rows"
              type="number"
              name="rows"
              value={config.rows}
              onChange={handleChange}
              min="1"
              max="10"
            />
            <div className="config-description">Number of thumbnails vertically</div>
          </div>
        </div>
        
        <div className="config-item">
          <label htmlFor="layoutDirection">
            <span className="label-icon">🔄</span> Direction
          </label>
          <div className="input-wrapper">
            <select 
              id="layoutDirection"
              name="layoutDirection" 
              value={config.layoutDirection} 
              onChange={handleChange}
            >
              <option value="down">Down First</option>
              <option value="across">Across First</option>
            </select>
            <div className="config-description">Order of page placement</div>
          </div>
        </div>
      </div>
      
      <div className="config-group">
        <h4 className="config-group-title">
          <span className="config-icon">⚙️</span> Page Settings
        </h4>
        
        <div className="config-item">
          <label htmlFor="pageSize">
            <span className="label-icon">📄</span> Page Size
          </label>
          <div className="input-wrapper">
            <select 
              id="pageSize"
              name="pageSize" 
              value={config.pageSize} 
              onChange={handleChange}
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="Letter">Letter</option>
            </select>
            <div className="config-description">Output page dimensions</div>
          </div>
        </div>
        
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
            <div className="config-description">Space between thumbnails</div>
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
            <div className="config-description">Higher values = larger files with more detail</div>
          </div>
        </div>
      </div>
    </div>
  );
};
