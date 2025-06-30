import React from 'react'
import ReactDOM from 'react-dom/client'
import { pdfjs } from 'react-pdf';
import App from './App'
import './App.css'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Ensure PDF.js worker is properly loaded
const pdfjsVersion = pdfjs.version;
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

// Add iOS standalone class to html element if needed
if ((window.navigator as any).standalone === true) {
  document.documentElement.classList.add('ios-standalone');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
