// Check if app is in PWA mode
export const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Check if browser supports service worker notifications
export const supportsNotifications = (): boolean => {
  return 'serviceWorker' in navigator && 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!supportsNotifications()) return false;
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Function to send notification to service worker
export const sendServiceWorkerNotification = (data: any): boolean => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(data);
    return true;
  }
  return false;
};

// Function to notify service worker about download
export const notifyServiceWorkerDownload = (title: string, message: string, tag: string): boolean => {
  if (isPWA() && supportsNotifications() && Notification.permission === 'granted') {
    return sendServiceWorkerNotification({
      type: 'DOWNLOAD_NOTIFICATION',
      title,
      message,
      tag
    });
  }
  return false;
};

// Function to update service worker about download progress
export const updateServiceWorkerProgress = (progress: number, title: string, message: string, tag: string): boolean => {
  if (isPWA() && supportsNotifications() && Notification.permission === 'granted') {
    return sendServiceWorkerNotification({
      type: 'DOWNLOAD_PROGRESS',
      progress,
      title,
      message,
      tag
    });
  }
  return false;
};

// Function to notify service worker about download completion
export const notifyServiceWorkerComplete = (title: string, message: string, tag: string): boolean => {
  if (isPWA() && supportsNotifications() && Notification.permission === 'granted') {
    return sendServiceWorkerNotification({
      type: 'DOWNLOAD_COMPLETE',
      title,
      message,
      tag
    });
  }
  return false;
};

// Show browser notification
export const showBrowserNotification = (title: string, message: string): void => {
  if (supportsNotifications() && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message,
        icon: '/favicon.svg'
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }
};

// Open downloads folder based on browser/OS
export const openDownloadsFolder = (): void => {
  try {
    // For Chrome
    if (navigator.userAgent.indexOf('Chrome') !== -1) {
      window.open('chrome://downloads', '_blank');
    } 
    // For Firefox
    else if (navigator.userAgent.indexOf('Firefox') !== -1) {
      window.open('about:downloads', '_blank');
    }
    // For Edge
    else if (navigator.userAgent.indexOf('Edg') !== -1) {
      window.open('edge://downloads', '_blank');
    }
    // For Safari and others, we can't directly open downloads folder
    // So we'll show a notification with instructions
    else {
      alert('To view your downloaded files, please check your browser\'s download manager or your device\'s Downloads folder.');
    }
  } catch (error) {
    console.error('Error opening downloads folder:', error);
    // Fallback for security restrictions
    alert('Your browser prevented opening the downloads folder. Please check your Downloads folder manually.');
  }
}; 