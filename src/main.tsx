import React from 'react'
import ReactDOM from 'react-dom/client'
import { pdfjs } from 'react-pdf';
import App from './App'
import './App.css'
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Ensure PDF.js worker is properly loaded
const pdfjsVersion = pdfjs.version;
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

// Check for PWA mode and set appropriate classes
const isInStandaloneMode = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Check if launched from PWA shortcut
const urlParams = new URLSearchParams(window.location.search);
const isPwaSource = urlParams.get('source') === 'pwa';

// Add appropriate classes to html element
if (isInStandaloneMode() || isPwaSource) {
  document.documentElement.classList.add('pwa-mode');
  
  // Add passive event listeners for better scroll performance on mobile
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    document.addEventListener('wheel', () => {}, { passive: true });
  });
}

// Add iOS standalone class to html element if needed
if ((window.navigator as any).standalone === true) {
  document.documentElement.classList.add('ios-standalone');
}

// Request notification permission for PWA mode
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
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
      const registration = await navigator.serviceWorker.register('/sw.js');
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
              icon: '/favicon.svg',
              badge: '/favicon.svg'
            });
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
