import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { PDFContactSheet } from './components/PDFContactSheet';
import { HorizontalPDFContactSheet } from './components/HorizontalPDFContactSheet';
import { CustomOrderPDFContactSheet } from './components/CustomOrderPDFContactSheet';
import { PDFStore } from './components/PDFStore';
import { ConfigPanel } from './components/ConfigPanel';
import { TwoNTConfigPanel } from './components/TwoNTConfigPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';
function App() {
    const [standardConfig, setStandardConfig] = useState({
        columns: 3,
        rows: 3,
        spacing: 0.2,
        pageSize: 'A4',
        resolution: 600,
        layoutDirection: 'down'
    });
    const [twoNTConfig, setTwoNTConfig] = useState({
        spacing: 0.2,
        resolution: 600
    });
    const [activeTab, setActiveTab] = useState('pdfstore');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isStandalone, setIsStandalone] = useState(false);
    const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
    // Check if app is running in standalone mode (PWA)
    useEffect(() => {
        const isInStandaloneMode = () => {
            return (window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://'));
        };
        setIsStandalone(isInStandaloneMode());
        // Check URL parameters for PWA source
        const urlParams = new URLSearchParams(window.location.search);
        const isPwaSource = urlParams.get('source') === 'pwa';
        // When in standalone mode or launched from PWA, ensure sidebar is visible on mobile
        if (isInStandaloneMode() || isPwaSource) {
            setSidebarOpen(true);
            // Force the app to show proper layout in standalone mode
            document.documentElement.classList.add('pwa-mode');
            // Add meta viewport settings for better mobile display
            const metaViewport = document.querySelector('meta[name="viewport"]');
            if (metaViewport) {
                metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
            }
            // Ensure sidebar is always visible in PWA mode on mobile
            const handleResize = () => {
                if (window.innerWidth <= 768) {
                    setSidebarOpen(true);
                }
            };
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
        // Listen for changes (in case user switches between modes)
        const mql = window.matchMedia('(display-mode: standalone)');
        const handleChange = (e) => {
            setIsStandalone(e.matches);
            if (e.matches) {
                setSidebarOpen(true);
                document.documentElement.classList.add('pwa-mode');
            }
            else {
                document.documentElement.classList.remove('pwa-mode');
            }
        };
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, []);
    // Check notification permission
    useEffect(() => {
        const checkNotificationPermission = async () => {
            if ('Notification' in window) {
                const permission = Notification.permission;
                setHasNotificationPermission(permission === 'granted');
            }
        };
        checkNotificationPermission();
    }, []);
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };
    // Request notification permission if in standalone mode
    const requestNotificationPermission = async () => {
        if ('Notification' in window && isStandalone && !hasNotificationPermission) {
            try {
                const permission = await Notification.requestPermission();
                setHasNotificationPermission(permission === 'granted');
                return permission === 'granted';
            }
            catch (error) {
                console.error('Error requesting notification permission:', error);
                return false;
            }
        }
        return false;
    };
    return (_jsx(ErrorBoundary, { children: _jsxs("div", { className: `app-container ${isStandalone ? 'standalone-mode' : ''}`, children: [_jsxs("div", { className: `sidebar ${sidebarOpen ? 'open' : 'closed'}`, children: [_jsx("div", { className: "sidebar-toggle", onClick: toggleSidebar, children: sidebarOpen ? '◀' : '▶' }), _jsxs("div", { className: "sidebar-content", children: [_jsxs("div", { className: "logo", children: [_jsx("h1", { children: "Electrical" }), _jsx("h2", { children: "Engineering" })] }), _jsxs("div", { className: "tab-selector", children: [_jsxs("button", { className: `tab-button ${activeTab === 'pdfstore' ? 'active' : ''}`, onClick: () => setActiveTab('pdfstore'), children: [_jsx("span", { className: "icon", children: "\uD83D\uDCDA" }), _jsx("span", { className: "label", children: "PDF Store" })] }), _jsxs("button", { className: `tab-button ${activeTab === 'standard' ? 'active' : ''}`, onClick: () => setActiveTab('standard'), children: [_jsx("span", { className: "icon", children: "\uD83D\uDCC4" }), _jsx("span", { className: "label", children: "Standard Sheet" })] }), _jsxs("button", { className: `tab-button ${activeTab === 'horizontal' ? 'active' : ''}`, onClick: () => setActiveTab('horizontal'), children: [_jsx("span", { className: "icon", children: "\u21D4" }), _jsx("span", { className: "label", children: "Two n T" })] }), _jsxs("button", { className: `tab-button ${activeTab === 'custom' ? 'active' : ''}`, onClick: () => setActiveTab('custom'), children: [_jsx("span", { className: "icon", children: "\uD83D\uDD04" }), _jsx("span", { className: "label", children: "Custom Order" })] })] }), sidebarOpen && (_jsxs("div", { className: "config-wrapper", children: [_jsx("h3", { className: "config-section-title", children: activeTab === 'standard' ? 'Standard Sheet Settings' :
                                                activeTab === 'horizontal' ? 'Two n T Settings' :
                                                    activeTab === 'custom' ? 'Custom Order Settings' :
                                                        'PDF Store Settings' }), activeTab === 'standard' ? (_jsx(ConfigPanel, { config: standardConfig, onConfigChange: setStandardConfig })) : activeTab === 'horizontal' ? (_jsx(TwoNTConfigPanel, { config: twoNTConfig, onConfigChange: setTwoNTConfig })) : activeTab === 'custom' ? (_jsx(ConfigPanel, { config: standardConfig, onConfigChange: setStandardConfig })) : null, isStandalone && activeTab === 'pdfstore' && !hasNotificationPermission && (_jsxs("div", { className: "notification-permission-container", children: [_jsx("button", { className: "notification-permission-button", onClick: requestNotificationPermission, children: "Enable Download Notifications" }), _jsx("p", { className: "notification-permission-info", children: "Allow notifications to get updates about your PDF downloads" })] }))] }))] })] }), _jsxs("div", { className: "main-content", children: [_jsx("div", { className: "content-header", children: _jsx("h2", { children: activeTab === 'standard' ? 'Standard Contact Sheet' :
                                    activeTab === 'horizontal' ? 'Two n T Layout' :
                                        activeTab === 'custom' ? 'Custom Order Contact Sheet' :
                                            'Electrical Engineering PDF Store' }) }), _jsx("div", { className: "content-body", children: activeTab === 'standard' ? (_jsx("div", { className: "standard-sheet-section", children: _jsx(PDFContactSheet, { config: standardConfig }) })) : activeTab === 'horizontal' ? (_jsx("div", { className: "two-n-t-section", children: _jsx(HorizontalPDFContactSheet, { config: twoNTConfig }) })) : activeTab === 'custom' ? (_jsx("div", { className: "custom-order-section", children: _jsx(CustomOrderPDFContactSheet, { config: standardConfig }) })) : (_jsx("div", { className: "pdf-store-section", children: _jsx(PDFStore, {}) })) })] })] }) }));
}
export default App;
