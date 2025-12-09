import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Import critical CSS first
import './App.css'
import './styles/SpiderWeb.css'

// Defer PDF.js setup - only load when needed
const setupPdfWorker = async () => {
  const { pdfjs } = await import('react-pdf');
  
  // Import PDF styles
  await import('react-pdf/dist/Page/TextLayer.css');
  await import('react-pdf/dist/Page/AnnotationLayer.css');
  
  const pdfjsVersion = pdfjs.version;
  
  // Configure worker with multiple fallback options
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  } catch {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
    } catch {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }
};

// Setup PDF worker after initial render (non-blocking)
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for non-critical initialization
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => setupPdfWorker());
  } else {
    setTimeout(setupPdfWorker, 100);
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
    // Clear the initial loader
    rootElement.innerHTML = '';
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
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
}
