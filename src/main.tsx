import React from 'react'
import ReactDOM from 'react-dom/client'
import { pdfjs } from 'react-pdf';
import App from './App'
import './App.css'
import './styles/SpiderWeb.css'
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Ensure PDF.js worker is properly loaded
const pdfjsVersion = pdfjs.version;
console.log('PDF.js version:', pdfjsVersion);

// Configure worker with multiple fallback options
try {
  // For PDF.js 5.x, the worker is in the build directory with .mjs extension
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
} catch (error) {
  console.error('Failed to set worker from local path, trying CDN:', error);
  try {
    // Fallback to CDN with correct version
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  } catch (cdnError) {
    console.error('Failed to set worker from CDN:', cdnError);
    // Last resort fallback to the copied file in public directory
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }
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
