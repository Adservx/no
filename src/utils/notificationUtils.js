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
