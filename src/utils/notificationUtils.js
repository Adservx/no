// Check if browser supports notifications
export const supportsNotifications = () => {
    return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async () => {
    if (!supportsNotifications())
        return false;
    if (Notification.permission === 'granted') {
        return true;
    }
    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
};

// Show browser notification
export const showBrowserNotification = (title, message) => {
    if (supportsNotifications() && Notification.permission === 'granted') {
        try {
            new Notification(title, {
                body: message,
                icon: '/favicon.svg'
            });
        }
        catch (error) {
            console.error('Error showing browser notification:', error);
        }
    }
};

// Open downloads folder based on browser/OS
export const openDownloadsFolder = () => {
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
    }
    catch (error) {
        console.error('Error opening downloads folder:', error);
        // Fallback for security restrictions
        alert('Your browser prevented opening the downloads folder. Please check your Downloads folder manually.');
    }
};

// Check if the application is running as a Progressive Web App
export const isPWA = () => {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
    );
};

// Send notification to service worker for download started
export const notifyServiceWorkerDownload = (title, message, notificationId) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'download-started',
            title: title,
            message: message,
            id: notificationId
        });
    } else {
        showBrowserNotification(title, message);
    }
};

// Send notification to service worker for download completed
export const notifyServiceWorkerComplete = (title, message, notificationId) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'download-complete',
            title: title,
            message: message,
            id: notificationId
        });
    } else {
        showBrowserNotification(title, message);
    }
};

// Update progress in service worker notification
export const updateServiceWorkerProgress = (progress, title, message, notificationId) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'download-progress',
            progress: progress,
            title: title,
            message: message,
            id: notificationId
        });
    }
};

// Send a generic notification to service worker
export const sendServiceWorkerNotification = (type, data) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: type,
            ...data
        });
    }
};
