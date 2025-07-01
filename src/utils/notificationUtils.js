// Check if app is in PWA mode
export const isPWA = () => {
    return (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://'));
};
// Check if browser supports service worker notifications
export const supportsNotifications = () => {
    return 'serviceWorker' in navigator && 'Notification' in window;
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
// Function to send notification to service worker
export const sendServiceWorkerNotification = (data) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(data);
        return true;
    }
    return false;
};
// Function to notify service worker about download
export const notifyServiceWorkerDownload = (title, message, tag) => {
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
export const updateServiceWorkerProgress = (progress, title, message, tag) => {
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
export const notifyServiceWorkerComplete = (title, message, tag) => {
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
