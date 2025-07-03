import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import './PDFStore.css';
import { isPWA, requestNotificationPermission, notifyServiceWorkerDownload, notifyServiceWorkerComplete, updateServiceWorkerProgress, showBrowserNotification } from '../utils/notificationUtils';
const electricalEngineeringSemesters = [
    {
        name: "First Semester",
        subjects: [
            {
                name: "Communication Nepali",
                files: [
                    { name: "Paper 1", path: "/pdf-files/1st semester/Communication Nepali/1-p.pdf" },
                    { name: "Paper 1 (Alt)", path: "/pdf-files/1st semester/Communication Nepali/1-p''.pdf" },
                    { name: "Paper 2", path: "/pdf-files/1st semester/Communication Nepali/2-p.pdf" },
                    { name: "Paper 2 (Alt)", path: "/pdf-files/1st semester/Communication Nepali/2-p''.pdf" },
                    { name: "Paper 4", path: "/pdf-files/1st semester/Communication Nepali/4-p.pdf" },
                    { name: "Paper 4 (Alt)", path: "/pdf-files/1st semester/Communication Nepali/4-p''.pdf" }
                ]
            },
            {
                name: "Communication English",
                files: [
                    { name: "Paper 1", path: "/pdf-files/1st semester/Communication English/1-p.pdf" },
                    { name: "Paper 1 (Alt)", path: "/pdf-files/1st semester/Communication English/1-p''.pdf" }
                ]
            },
            {
                name: "Engineering Mathematics I",
                files: [
                    { name: "Mathematics Paper", path: "/pdf-files/1st semester/Engineering Mathematics I/CamScanner 01-07-2025 11.32.pdf" }
                ]
            },
            {
                name: "Engineering Physics I",
                files: [
                    { name: "Physics Paper 1", path: "/pdf-files/1st semester/Engineering Physics I/phy-1p.pdf" },
                    { name: "Physics Paper 1 (Alt)", path: "/pdf-files/1st semester/Engineering Physics I/phy-1p'.pdf" }
                ]
            },
            {
                name: "Engineering Chemistry I",
                files: [
                    { name: "Paper 1", path: "/pdf-files/1st semester/Engineering Chemistry I/1-p.pdf" },
                    { name: "Paper 1 (Alt)", path: "/pdf-files/1st semester/Engineering Chemistry I/1-p''.pdf" },
                    { name: "Paper 2", path: "/pdf-files/1st semester/Engineering Chemistry I/2-p.pdf" },
                    { name: "Paper 2 (Alt)", path: "/pdf-files/1st semester/Engineering Chemistry I/2-p''.pdf" }
                ]
            },
            {
                name: "Computer Application",
                files: [
                    { name: "Paper 1", path: "/pdf-files/1st semester/Computer Application/1-p.pdf" },
                    { name: "Paper 1 (Alt)", path: "/pdf-files/1st semester/Computer Application/1-p'.pdf" },
                    { name: "Paper 2", path: "/pdf-files/1st semester/Computer Application/2-p.pdf" },
                    { name: "Paper 2 (Alt)", path: "/pdf-files/1st semester/Computer Application/2-p'.pdf" }
                ]
            }
        ]
    },
    {
        name: "Second Semester",
        subjects: [
            {
                name: "Engineering Mathematics II",
                files: [
                    { name: "Math 1", path: "/pdf-files/2nd semester/Math-II/math 1.png", isContactSheet: true },
                    { name: "Math 2", path: "/pdf-files/2nd semester/Math-II/math 2.png", isContactSheet: true },
                    { name: "Math 3", path: "/pdf-files/2nd semester/Math-II/math 3.png", isContactSheet: true },
                    { name: "Math 4", path: "/pdf-files/2nd semester/Math-II/math 4.png", isContactSheet: true },
                    { name: "Math 5", path: "/pdf-files/2nd semester/Math-II/math 5.png", isContactSheet: true },
                    { name: "Math 6", path: "/pdf-files/2nd semester/Math-II/math 6.png", isContactSheet: true },
                    { name: "Math 7", path: "/pdf-files/2nd semester/Math-II/math 7.png", isContactSheet: true },
                    { name: "New 1", path: "/pdf-files/2nd semester/Math-II/new 1.png", isContactSheet: true },
                    { name: "New 2", path: "/pdf-files/2nd semester/Math-II/new 2.png", isContactSheet: true }
                ]
            },
            {
                name: "Engineering Physics II",
                files: [
                    { name: "Physics Paper 1", path: "/pdf-files/2nd semester/Physics-II/phy1-p.pdf" },
                    { name: "Physics Paper 1 (Alt)", path: "/pdf-files/2nd semester/Physics-II/phy1-p''.pdf" },
                    { name: "Physics Paper 2", path: "/pdf-files/2nd semester/Physics-II/phy2-p.pdf" },
                    { name: "Physics Paper 2 (Alt)", path: "/pdf-files/2nd semester/Physics-II/phy2-p''.pdf" }
                ]
            },
            {
                name: "Engineering Chemistry II",
                files: [
                    { name: "Chemistry 1", path: "/pdf-files/2nd semester/Chemistry-II/c1.png", isContactSheet: true },
                    { name: "Chemistry 2", path: "/pdf-files/2nd semester/Chemistry-II/c2.png", isContactSheet: true },
                    { name: "Chemistry 3", path: "/pdf-files/2nd semester/Chemistry-II/c3.png", isContactSheet: true },
                    { name: "Chemistry 4", path: "/pdf-files/2nd semester/Chemistry-II/c4.png", isContactSheet: true }
                ]
            },
            {
                name: "Applied Mechanics",
                files: [
                    { name: "Applied 1", path: "/pdf-files/2nd semester/Applied Mechanics/APPLIED 1.png", isContactSheet: true },
                    { name: "Applied 2", path: "/pdf-files/2nd semester/Applied Mechanics/APPLIED 2.png", isContactSheet: true }
                ]
            }
        ]
    },
    {
        name: "Third Semester",
        subjects: [
            {
                name: "Computer Programming",
                files: [
                    { name: "Contact Sheet 1", path: "/pdf-files/3rd semester/computer programming/ContactSheet-001.jpg", isContactSheet: true },
                    { name: "Contact Sheet 2", path: "/pdf-files/3rd semester/computer programming/ContactSheet-002.jpg", isContactSheet: true }
                ]
            },
            {
                name: "Basic Electronics",
                files: [
                    { name: "Electronics Paper 1", path: "/pdf-files/3rd semester/basic electronic/b e-1p.pdf" },
                    { name: "Electronics Paper 1 (Alt)", path: "/pdf-files/3rd semester/basic electronic/b e-1p''.pdf" },
                    { name: "Electronics Paper 2", path: "/pdf-files/3rd semester/basic electronic/b e-2p.pdf" },
                    { name: "Electronics Paper 2 (Alt)", path: "/pdf-files/3rd semester/basic electronic/b e-2p''.pdf" },
                    { name: "Contact Sheet 1", path: "/pdf-files/3rd semester/basic electronic/ContactSheet-001.jpeg", isContactSheet: true },
                    { name: "Contact Sheet 2", path: "/pdf-files/3rd semester/basic electronic/ContactSheet-002.jpeg", isContactSheet: true },
                    { name: "Contact Sheet 3", path: "/pdf-files/3rd semester/basic electronic/ContactSheet-003.jpeg", isContactSheet: true },
                    { name: "Contact Sheet 4", path: "/pdf-files/3rd semester/basic electronic/ContactSheet-004.jpeg", isContactSheet: true }
                ]
            },
            {
                name: "Civil Construction and Survey",
                files: [
                    { name: "Paper 1", path: "/pdf-files/3rd semester/Civil Construction and Survey/1-p.jpg", isContactSheet: true },
                    { name: "Paper 1 (Alt)", path: "/pdf-files/3rd semester/Civil Construction and Survey/1-p''.jpg", isContactSheet: true },
                    { name: "Paper 2", path: "/pdf-files/3rd semester/Civil Construction and Survey/2-p.pdf" },
                    { name: "Paper 2 (Alt)", path: "/pdf-files/3rd semester/Civil Construction and Survey/2-p''.pdf" }
                ]
            },
            {
                name: "Fundamental of Electrical Engineering",
                files: [
                    { name: "Contact Sheet 1", path: "/pdf-files/3rd semester/fundamental of electrical engineering/ContactSheet-001.jpg", isContactSheet: true },
                    { name: "Contact Sheet 2", path: "/pdf-files/3rd semester/fundamental of electrical engineering/ContactSheet-002.jpg", isContactSheet: true },
                    { name: "Contact Sheet 3", path: "/pdf-files/3rd semester/fundamental of electrical engineering/ContactSheet-003.jpg", isContactSheet: true },
                    { name: "Contact Sheet 4", path: "/pdf-files/3rd semester/fundamental of electrical engineering/ContactSheet-004.jpg", isContactSheet: true }
                ]
            },
            {
                name: "Engineering Material",
                files: [
                    { name: "Material 1", path: "/pdf-files/3rd semester/Engineering Material/material 1.pdf" },
                    { name: "Material 2", path: "/pdf-files/3rd semester/Engineering Material/material 2.pdf" },
                    { name: "Material 3", path: "/pdf-files/3rd semester/Engineering Material/material 3.pdf" },
                    { name: "Material 4", path: "/pdf-files/3rd semester/Engineering Material/material 4.pdf" }
                ]
            },
            {
                name: "Principle of Management and Costing",
                files: [
                    { name: "Management 1", path: "/pdf-files/3rd semester/Principle of Management and Costing/management 1.pdf" },
                    { name: "Management 2", path: "/pdf-files/3rd semester/Principle of Management and Costing/management 2.pdf" },
                    { name: "Management 3", path: "/pdf-files/3rd semester/Principle of Management and Costing/management 3.pdf" },
                    { name: "Management 4", path: "/pdf-files/3rd semester/Principle of Management and Costing/management 4.pdf" }
                ]
            }
        ]
    },
    {
        name: "Fourth Semester",
        subjects: [
            {
                name: "Electrical Circuit Analysis",
                files: []
            },
            {
                name: "Power Station",
                files: []
            },
            {
                name: "Microprocessor & Microcontroller",
                files: []
            },
            {
                name: "Electrical Measurements and Measuring Instruments",
                files: []
            },
            {
                name: "CAD",
                files: []
            },
            {
                name: "Electrical Machine I",
                files: []
            }
        ]
    }
];
export const PDFStore = () => {
    const [activeSemester, setActiveSemester] = useState(0);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [isDownloading, setIsDownloading] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [fileDownloads, setFileDownloads] = useState({});
    const [notificationPermission, setNotificationPermission] = useState(false);
    const downloadLinksRef = useRef(null);
    const activeDownloadsRef = useRef({});
    const [serviceWorkerActive, setServiceWorkerActive] = useState(false);
    const filesListRefs = useRef({});
    // Check notification permission on component mount
    useEffect(() => {
        const checkPermission = async () => {
            const hasPermission = await requestNotificationPermission();
            setNotificationPermission(hasPermission);
        };
        if (isPWA()) {
            checkPermission();
        }
    }, []);
    // Check service worker status on component mount
    useEffect(() => {
        const checkServiceWorker = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    // Check if service worker is active
                    const registration = await navigator.serviceWorker.ready;
                    setServiceWorkerActive(!!registration.active);
                }
                catch (error) {
                    console.error('Service worker error:', error);
                }
            }
        };
        checkServiceWorker();
    }, []);
    // Add effect to ensure scrolling works properly on mobile
    useEffect(() => {
        // Get all the files-list elements once they're available
        const handleScrollFix = () => {
            Object.values(filesListRefs.current).forEach(ref => {
                if (ref && ref.current) {
                    // Touch events for iOS devices
                    ref.current.addEventListener('touchstart', function() {
                        // This empty handler is needed to enable smooth scrolling
                    }, { passive: true });
                }
            });
        };
        
        handleScrollFix();
        
        // Clean up event listeners
        return () => {
            Object.values(filesListRefs.current).forEach(ref => {
                if (ref && ref.current) {
                    ref.current.removeEventListener('touchstart', function() {}, { passive: true });
                }
            });
        };
    }, [expandedSubjects]); // Re-run when expandedSubjects changes
    const toggleSubject = (subjectName) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subjectName]: !prev[subjectName]
        }));
        
        // Initialize ref for this subject's files list if it's being expanded
        if (!expandedSubjects[subjectName]) {
            if (!filesListRefs.current[subjectName]) {
                filesListRefs.current[subjectName] = { current: null };
            }
        }
    };
    const isSubjectExpanded = (subjectName) => {
        return !!expandedSubjects[subjectName];
    };
    const addNotification = (notification) => {
        const id = Math.random().toString(36).substring(2, 10);
        setNotifications(prev => [...prev, { ...notification, id }]);
        // Show system notification for PWA if permission granted
        if (isPWA() && notificationPermission && notification.type === 'success') {
            showBrowserNotification(notification.title, notification.message);
        }
        return id;
    };
    const updateNotification = (id, updates) => {
        setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, ...updates } : notif));
        // Update system notification for PWA if it's a success update
        if (isPWA() && notificationPermission && updates.type === 'success') {
            const notification = notifications.find(n => n.id === id);
            if (notification) {
                showBrowserNotification(updates.title || notification.title, updates.message || notification.message);
            }
        }
    };
    const removeNotification = (id) => {
        // Cancel download if it's active
        const activeDownload = activeDownloadsRef.current[id];
        if (activeDownload) {
            activeDownload.xhr.abort();
            delete activeDownloadsRef.current[id];
        }
        // Mark the notification for closing animation
        setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, closing: true } : notif));
        // Remove after animation completes
        setTimeout(() => {
            setNotifications(prev => prev.filter(notif => notif.id !== id));
        }, 300); // Match the slideOut animation duration
    };
    // Clear completed notifications after some time
    useEffect(() => {
        const successNotifications = notifications.filter(n => n.type === 'success');
        if (successNotifications.length > 0) {
            const timer = setTimeout(() => {
                successNotifications.forEach(n => removeNotification(n.id));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notifications]);
    // Generate a short filename for download
    const getShortFilename = (subject, file, index) => {
        // Get subject abbreviation (first letters of each word)
        const subjectAbbr = subject.name
            .split(' ')
            .map(word => word.charAt(0))
            .join('');
        // Create a short name: Subject_Abbreviation_P1.pdf
        return `${subjectAbbr}_P${index + 1}.${file.isContactSheet ? 'jpg' : 'pdf'}`;
    };
    // Function to handle downloading all files for a subject
    const downloadAllFiles = (subject) => {
        // Set downloading state for this subject
        setIsDownloading(prev => ({ ...prev, [subject.name]: true }));
        // Show notification
        const notifId = addNotification({
            type: 'downloading',
            title: `Downloading ${subject.name}`,
            message: `Preparing ${subject.files.length} files...`,
            progress: 0,
        });
        // Notify service worker for PWA
        if (isPWA() && serviceWorkerActive) {
            notifyServiceWorkerDownload(`Downloading ${subject.name}`, `Preparing ${subject.files.length} files...`, `download-batch-${subject.name}`);
        }
        // Create hidden iframes for each download
        if (downloadLinksRef.current) {
            // Clear previous download frames
            downloadLinksRef.current.innerHTML = '';
            // Process each file in sequence with delays
            subject.files.forEach((file, index) => {
                setTimeout(() => {
                    // Update notification progress
                    const progress = Math.round(((index + 1) / subject.files.length) * 100);
                    updateNotification(notifId, {
                        progress,
                        message: `Downloading file ${index + 1} of ${subject.files.length}...`
                    });
                    // Update service worker progress for PWA
                    if (isPWA() && serviceWorkerActive && index % 2 === 0) { // Update every other file
                        updateServiceWorkerProgress(progress, `Downloading ${subject.name}`, `File ${index + 1} of ${subject.files.length}`, `download-batch-${subject.name}`);
                    }
                    // Fix path to ensure it's properly resolved from the base URL
                    const basePath = window.location.origin;
                    const filePath = file.path.startsWith('/') ? `${basePath}${file.path}` : `${basePath}/${file.path}`;
                    // Create iframe for download
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = filePath;
                    iframe.onload = () => {
                        console.log(`Started download for ${file.name}`);
                    };
                    // Add to document
                    downloadLinksRef.current?.appendChild(iframe);
                    // If last file, reset downloading state after a delay
                    if (index === subject.files.length - 1) {
                        setTimeout(() => {
                            setIsDownloading(prev => ({ ...prev, [subject.name]: false }));
                            // Change to success notification
                            updateNotification(notifId, {
                                type: 'success',
                                title: 'Download Complete',
                                message: `All ${subject.files.length} files from ${subject.name} have been downloaded.`,
                                progress: 100
                            });
                            // Notify service worker of completion for PWA
                            if (isPWA() && serviceWorkerActive) {
                                notifyServiceWorkerComplete('Download Complete', `All ${subject.files.length} files from ${subject.name} have been downloaded.`, `download-batch-${subject.name}`);
                            }
                        }, 1000);
                    }
                }, index * 1000); // 1 second delay between downloads
            });
        }
    };
    // Alternative download method using anchor tags
    const downloadAllFilesAlt = (subject) => {
        // Set downloading state for this subject
        setIsDownloading(prev => ({ ...prev, [subject.name]: true }));
        // Show notification
        const notifId = addNotification({
            type: 'downloading',
            title: `Downloading ${subject.name}`,
            message: `Preparing ${subject.files.length} files...`,
            progress: 0,
        });
        // Notify service worker for PWA
        if (isPWA() && serviceWorkerActive) {
            notifyServiceWorkerDownload(`Downloading ${subject.name}`, `Preparing ${subject.files.length} files...`, `download-batch-${subject.name}`);
        }
        subject.files.forEach((file, index) => {
            setTimeout(() => {
                // Update notification progress
                const progress = Math.round(((index + 1) / subject.files.length) * 100);
                updateNotification(notifId, {
                    progress,
                    message: `Downloading file ${index + 1} of ${subject.files.length}...`
                });
                // Update service worker progress for PWA
                if (isPWA() && serviceWorkerActive && index % 2 === 0) { // Update every other file
                    updateServiceWorkerProgress(progress, `Downloading ${subject.name}`, `File ${index + 1} of ${subject.files.length}`, `download-batch-${subject.name}`);
                }
                // Fix path to ensure it's properly resolved from the base URL
                const basePath = window.location.origin;
                const filePath = file.path.startsWith('/') ? `${basePath}${file.path}` : `${basePath}/${file.path}`;
                const link = document.createElement('a');
                link.href = filePath;
                link.setAttribute('download', getShortFilename(subject, file, index));
                link.setAttribute('target', '_blank');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // If last file, reset downloading state after a delay
                if (index === subject.files.length - 1) {
                    setTimeout(() => {
                        setIsDownloading(prev => ({ ...prev, [subject.name]: false }));
                        // Change to success notification
                        updateNotification(notifId, {
                            type: 'success',
                            title: 'Download Complete',
                            message: `All ${subject.files.length} files from ${subject.name} have been downloaded.`,
                            progress: 100
                        });
                        // Notify service worker of completion for PWA
                        if (isPWA() && serviceWorkerActive) {
                            notifyServiceWorkerComplete('Download Complete', `All ${subject.files.length} files from ${subject.name} have been downloaded.`, `download-batch-${subject.name}`);
                        }
                    }, 1000);
                }
            }, index * 1500); // 1.5 second delay between downloads
        });
    };
    // Function to handle single file download with real progress tracking
    const handleFileDownload = (subject, file, fileIndex) => {
        const fileId = `${subject.name}-${file.name}`;
        // Already downloading
        if (fileDownloads[fileId])
            return;
        // Set downloading state
        setFileDownloads(prev => ({ ...prev, [fileId]: true }));
        // Add notification
        const notifId = addNotification({
            type: 'downloading',
            title: `Downloading ${file.name}`,
            message: `Starting download...`,
            progress: 0,
            fileName: file.name,
            fileType: file.isContactSheet ? 'image' : 'pdf'
        });
        // Notify service worker for PWA notification
        if (isPWA() && serviceWorkerActive) {
            notifyServiceWorkerDownload(`Downloading ${file.name}`, 'Starting download...', `download-${fileId}`);
        }
        // Fix path to ensure it's properly resolved from the base URL
        const basePath = window.location.origin;
        const filePath = file.path.startsWith('/') ? `${basePath}${file.path}` : `${basePath}/${file.path}`;
        // Check if running on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            // For mobile devices, use a simpler approach with direct window.open
            try {
                // Create a simple progress simulation
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 5;
                    if (progress <= 95) {
                        updateNotification(notifId, {
                            progress,
                            message: `Downloading... ${progress}%`
                        });
                    }
                    else {
                        clearInterval(interval);
                    }
                }, 100);
                
                // Use fetch API to get the file as blob first
                fetch(filePath)
                    .then(response => {
                        if (!response.ok) throw new Error('Network response was not ok');
                        return response.blob();
                    })
                    .then(blob => {
                        // Create a temporary URL for the blob
                        const url = URL.createObjectURL(blob);
                        
                        // Create a link to download the file
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = getShortFilename(subject, file, fileIndex);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // Clean up the URL
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                        
                        // Mark as completed
                        clearInterval(interval);
                        setFileDownloads(prev => ({ ...prev, [fileId]: false }));
                        
                        updateNotification(notifId, {
                            type: 'success',
                            title: 'Download Complete',
                            message: `${file.name} has been downloaded.`,
                            progress: 100
                        });
                    })
                    .catch(error => {
                        console.error('Error downloading file on mobile:', error);
                        clearInterval(interval);
                        updateNotification(notifId, {
                            type: 'error',
                            title: 'Download Failed',
                            message: `Failed to download ${file.name}. Please try again.`
                        });
                        setFileDownloads(prev => ({ ...prev, [fileId]: false }));
                    });
            }
            catch (error) {
                console.error('Error downloading file on mobile:', error);
                updateNotification(notifId, {
                    type: 'error',
                    title: 'Download Failed',
                    message: `Failed to download ${file.name}. Please try again.`
                });
                setFileDownloads(prev => ({ ...prev, [fileId]: false }));
            }
            return;
        }
        // For desktop browsers, use XMLHttpRequest to track download progress
        const xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, true);
        xhr.responseType = 'blob';
        // Track download progress
        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                updateNotification(notifId, {
                    progress,
                    message: `Downloading... ${progress}%`
                });
                // Update service worker progress for PWA
                if (isPWA() && serviceWorkerActive && progress % 10 === 0) { // Update every 10%
                    updateServiceWorkerProgress(progress, `Downloading ${file.name}`, `${progress}% complete`, `download-${fileId}`);
                }
            }
        };
        
        // Helper function for error handling
        const handleDownloadError = () => {
            updateNotification(notifId, {
                type: 'error',
                title: 'Download Failed',
                message: `Failed to download ${file.name}. Please try again.`
            });
            setFileDownloads(prev => ({ ...prev, [fileId]: false }));
            delete activeDownloadsRef.current[notifId];
        };
        
        // Handle download completion
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    // Create download link
                    const blob = new Blob([xhr.response], {
                        type: file.isContactSheet ? 'image/jpeg' : 'application/pdf'
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = getShortFilename(subject, file, fileIndex);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    // Clean up
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                    // Update notification
                    updateNotification(notifId, {
                        type: 'success',
                        title: 'Download Complete',
                        message: `${file.name} has been downloaded.`,
                        progress: 100
                    });
                    // Notify service worker of completion for PWA
                    if (isPWA() && serviceWorkerActive) {
                        notifyServiceWorkerComplete('Download Complete', `${file.name} has been downloaded.`, `download-${fileId}`);
                    }
                    // Clean up download tracking
                    setFileDownloads(prev => ({ ...prev, [fileId]: false }));
                    delete activeDownloadsRef.current[notifId];
                } catch (error) {
                    console.error('Error creating download link:', error);
                    handleDownloadError();
                }
            } else {
                handleDownloadError();
            }
        };
        
        // Handle download errors
        xhr.onerror = handleDownloadError;
        
        // Handle download abort
        xhr.onabort = () => {
            updateNotification(notifId, {
                type: 'error',
                title: 'Download Cancelled',
                message: `Download of ${file.name} was cancelled.`
            });
            setFileDownloads(prev => ({ ...prev, [fileId]: false }));
            delete activeDownloadsRef.current[notifId];
        };
        // Start download
        xhr.send();
        // Store reference to active download
        activeDownloadsRef.current[notifId] = { xhr, notifId };
    };
    return (
      _jsxs("div", { 
        className: "pdf-store-container", 
        children: [
          _jsxs("div", { 
            className: "store-header", 
            children: [
              _jsx("h2", { children: "Electrical Engineering PDF Store" }), 
              _jsx("p", { children: "Download resources for your semester" })
            ] 
          }), 
          _jsx("div", { 
            ref: downloadLinksRef, 
            style: { display: 'none' } 
          }),
          _jsx("div", { 
            className: `notification-container ${isPWA() ? 'pwa-notifications' : ''}`, 
            children: notifications.map((notification) => (
              _jsxs("div", { 
                className: `notification ${notification.type} ${notification.closing ? 'closing' : ''}`, 
                children: [
                  _jsxs("div", { 
                    className: "notification-icon", 
                    children: [
                      notification.type === 'downloading' && '⬇️', 
                      notification.type === 'success' && '✅', 
                      notification.type === 'error' && '❌'
                    ] 
                  }), 
                  _jsxs("div", { 
                    className: "notification-content", 
                    children: [
                      _jsx("h4", { children: notification.title }), 
                      _jsx("p", { children: notification.message }), 
                      notification.progress !== undefined && (
                        _jsx("div", { 
                          className: "notification-progress", 
                          children: _jsx("div", { 
                            className: "notification-progress-bar", 
                            style: { width: `${notification.progress}%` } 
                          }) 
                        })
                      )
                    ] 
                  }), 
                  _jsx("button", { 
                    className: "notification-close", 
                    onClick: () => removeNotification(notification.id), 
                    children: "×" 
                  })
                ] 
              }, notification.id)
            )) 
          }),
          _jsx("div", { 
            className: "semester-tabs", 
            children: electricalEngineeringSemesters.map((semester, index) => (
              _jsx("button", { 
                className: `semester-tab ${activeSemester === index ? 'active' : ''}`, 
                onClick: () => setActiveSemester(index), 
                children: semester.name 
              }, index)
            )) 
          }),
          _jsxs("div", { 
            className: "subject-list", 
            children: [
              _jsxs("h3", { 
                children: [
                  electricalEngineeringSemesters[activeSemester].name, 
                  " Subjects"
                ] 
              }), 
              _jsx("div", { 
                className: "subjects-grid", 
                children: electricalEngineeringSemesters[activeSemester].subjects.map((subject, index) => (
                  _jsxs("div", { 
                    className: "subject-card", 
                    children: [
                      _jsx("div", { 
                        className: "subject-icon", 
                        children: subject.files.some(file => file.isContactSheet) ? '🖼️' : '📄' 
                      }), 
                      _jsx("h4", { 
                        children: subject.name 
                      }), 
                      _jsxs("div", { 
                        className: "file-count", 
                        children: [
                          subject.files.length, 
                          " ", 
                          subject.files.length === 1 ? 'file' : 'files', 
                          " available"
                        ] 
                      }), 
                      subject.files.length > 0 ? (
                        _jsxs(_Fragment, { 
                          children: [
                            subject.files.length > 1 && (
                              _jsx("button", { 
                                className: `download-all-button ${isDownloading[subject.name] ? 'downloading' : ''}`, 
                                onClick: () => downloadAllFilesAlt(subject), 
                                disabled: isDownloading[subject.name], 
                                children: isDownloading[subject.name] ? 'Downloading...' : 'Download All Files' 
                              })
                            ), 
                            _jsx("button", { 
                              className: "toggle-files-button", 
                              onClick: () => toggleSubject(subject.name), 
                              children: isSubjectExpanded(subject.name) ? 'Hide Files' : 'Show Individual Files' 
                            }), 
                            isSubjectExpanded(subject.name) && (
                              _jsx("div", { 
                                className: "files-list", 
                                ref: (el) => {
                                  if (filesListRefs.current[subject.name]) {
                                    filesListRefs.current[subject.name].current = el;
                                  }
                                },
                                children: subject.files.map((file, fileIndex) => {
                                  const fileId = `${subject.name}-${file.name}`;
                                  const isFileDownloading = fileDownloads[fileId];
                                  return (
                                    _jsxs("div", { 
                                      className: "file-item", 
                                      children: [
                                        _jsx("span", { 
                                          className: `file-icon ${file.isContactSheet ? 'image-file' : 'pdf-file'}`, 
                                          children: file.isContactSheet ? '🖼️' : '📄' 
                                        }), 
                                        _jsx("span", { 
                                          className: "file-name", 
                                          children: file.name 
                                        }), 
                                        _jsx("a", { 
                                          href: `${window.location.origin}${file.path.startsWith('/') ? file.path : '/' + file.path}`, 
                                          download: getShortFilename(subject, file, fileIndex), 
                                          className: `download-file-button ${isFileDownloading ? 'downloading' : ''}`, 
                                          target: "_blank", 
                                          onClick: (e) => {
                                            e.preventDefault(); // Prevent default anchor behavior
                                            handleFileDownload(subject, file, fileIndex);
                                          }, 
                                          children: isFileDownloading ? 'Downloading...' : 'Download' 
                                        })
                                      ] 
                                    }, fileIndex)
                                  );
                                })
                              })
                            )
                          ] 
                        })
                      ) : (
                        _jsx("div", { 
                          className: "no-files-message", 
                          children: "No files available" 
                        })
                      )
                    ] 
                  }, index)
                )) 
              })
            ] 
          })
        ] 
      })
    );
};
