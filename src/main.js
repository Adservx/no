import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import App from './App';
import './App.css';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
// Ensure PDF.js worker is properly loaded with relative path
const pdfjsVersion = pdfjs.version;
// Use a CDN with fallback to ensure the worker loads correctly on mobile
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
// Add viewport meta tag dynamically to ensure proper scaling on mobile
const ensureViewportMeta = () => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
};
ensureViewportMeta();
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
// Add Android detection
if (/Android/i.test(navigator.userAgent)) {
    document.documentElement.classList.add('android-device');
}
// Request notification permission for PWA mode
const requestNotificationPermission = async () => {
    if ('Notification' in window) {
        try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            return permission === 'granted';
        }
        catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }
    return false;
};
// Register service worker if available
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered with scope:', registration.scope);
            // Request notification permission if in PWA mode
            if (isInStandaloneMode() || isPwaSource) {
                // Wait a moment before requesting permission for better user experience
                setTimeout(async () => {
                    const permissionGranted = await requestNotificationPermission();
                    console.log('Notification permission granted:', permissionGranted);
                    // If permission granted, send test notification
                    if (permissionGranted) {
                        registration.showNotification('PDF Store Ready', {
                            body: 'You can now download PDFs with notifications',
                            icon: './favicon.svg',
                            badge: './favicon.svg'
                        });
                    }
                }, 2000);
            }
        }
        catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    });
}
// Initialize app with error handling
const rootElement = document.getElementById('root');
if (rootElement) {
    try {
        ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
    }
    catch (error) {
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
}
else {
    console.error('Root element not found');
}
