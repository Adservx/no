import React from 'react'
import ReactDOM from 'react-dom/client'
import { pdfjs } from 'react-pdf';
import App from './App'
import './App.css'
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Ensure PDF.js worker is properly loaded
const pdfjsVersion = pdfjs.version;
// Configure worker with multiple fallback options
try {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
} catch (error) {
  console.error('Failed to set worker from CDN, using local fallback:', error);
  pdfjs.GlobalWorkerOptions.workerSrc = `./pdfjs-dist/${pdfjsVersion}/pdf.worker.min.js`;
}

// Add viewport meta tag dynamically to ensure proper scaling on mobile
const ensureViewportMeta = () => {
  let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (!viewport) {
    viewport = document.createElement('meta') as HTMLMetaElement;
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  viewport.setAttribute('content', 
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
};
ensureViewportMeta();

// Add Android detection
if (/Android/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('android-device');
}

// Initialize app with error handling
const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    // Fallback rendering in case of error
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: white;">
        <h2>Unable to load application</h2>
        <p>Please try refreshing the page or using a different browser.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
          Refresh Page
        </button>
      </div>
    `;
  }
} else {
  console.error('Root element not found');
}
