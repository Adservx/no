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