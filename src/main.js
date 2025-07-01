import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import App from './App';
import './App.css';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
// Ensure PDF.js worker is properly loaded
const pdfjsVersion = pdfjs.version;
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;
// Check for PWA mode and set appropriate classes
const isInStandaloneMode = () => {
    return (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://'));
};
// Check if launched from PWA shortcut
const urlParams = new URLSearchParams(window.location.search);
const isPwaSource = urlParams.get('source') === 'pwa';
// Add appropriate classes to html element
if (isInStandaloneMode() || isPwaSource) {
    document.documentElement.classList.add('pwa-mode');
    // Add passive event listeners for better scroll performance on mobile
    document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('touchstart', () => { }, { passive: true });
        document.addEventListener('touchmove', () => { }, { passive: true });
        document.addEventListener('wheel', () => { }, { passive: true });
    });
}
// Add iOS standalone class to html element if needed
if (window.navigator.standalone === true) {
    document.documentElement.classList.add('ios-standalone');
}
// Register service worker if available
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
            .catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    });
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
