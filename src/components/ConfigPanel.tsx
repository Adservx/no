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
      <div className="config-item">
        <label>Columns:</label>
        <input
          type="number"
          name="columns"
          value={config.columns}
          onChange={handleChange}
          min="1"
          max="10"
        />
      </div>
      <div className="config-item">
        <label>Rows:</label>
        <input
          type="number"
          name="rows"
          value={config.rows}
          onChange={handleChange}
          min="1"
          max="10"
        />
      </div>
      <div className="config-item">
        <label>Spacing (px):</label>
        <input
          type="number"
          name="spacing"
          value={config.spacing}
          onChange={handleChange}
          min="0"
          max="100"
        />
      </div>
      <div className="config-item">
        <label>Page Size:</label>
        <select name="pageSize" value={config.pageSize} onChange={handleChange}>
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="Letter">Letter</option>
        </select>
      </div>
      <div className="config-item">
        <label>Resolution (DPI):</label>
        <input
          type="number"
          name="resolution"
          value={config.resolution}
          onChange={handleChange}
          min="72"
          max="600"
        />
      </div>
      <div className="config-item">
        <label>Layout Direction:</label>
        <select name="layoutDirection" value={config.layoutDirection} onChange={handleChange}>
          <option value="down">Down First</option>
          <option value="across">Across First</option>
        </select>
      </div>
    </div>
  );
};
