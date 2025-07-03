import React, { useState, useRef, useEffect } from 'react';
import './PDFStore.css';
import { isPWA, requestNotificationPermission, notifyServiceWorkerDownload, notifyServiceWorkerComplete, updateServiceWorkerProgress, showBrowserNotification, sendServiceWorkerNotification } from '../utils/notificationUtils';

interface PDFFile {
  name: string;
  path: string;
  isContactSheet?: boolean;
}

interface Subject {
  name: string;
  files: PDFFile[];
}

interface SemesterData {
  name: string;
  subjects: Subject[];
}

interface Notification {
  id: string;
  type: 'downloading' | 'success' | 'error';
  title: string;
  message: string;
  progress?: number;
  fileName?: string;
  fileType?: string;
  closing?: boolean;
}

// Interface for download progress tracking
interface DownloadProgress {
  isDownloading: boolean;
  progress: number;
  isComplete: boolean;
}

const electricalEngineeringSemesters: SemesterData[] = [
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

export const PDFStore: React.FC = () => {
  const [activeSemester, setActiveSemester] = useState(0);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fileDownloads, setFileDownloads] = useState<Record<string, boolean>>({});
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgress>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const downloadLinksRef = useRef<HTMLDivElement>(null);
  const activeDownloadsRef = useRef<Record<string, {xhr: XMLHttpRequest, notifId: string}>>({});
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false);
  const filesListRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

  // Check notification permission on component mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const hasPermission = await requestNotificationPermission();
        setNotificationPermission(hasPermission);
      } catch (error) {
        console.error("Failed to check notification permission:", error);
      }
    };
    
    if (isPWA()) {
      checkPermission();
    }
  }, []);

  // Check for service worker activation
  useEffect(() => {
    const checkServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          setServiceWorkerActive(registrations.length > 0);
        }
      } catch (error) {
        console.error("Service worker check failed:", error);
        setServiceWorkerActive(false);
      }
    };
    
    checkServiceWorker();
  }, []);

  // Create refs for each subject's files list
  useEffect(() => {
    try {
      const refs: Record<string, React.RefObject<HTMLDivElement>> = {};
      
      electricalEngineeringSemesters.forEach(semester => {
        semester.subjects.forEach(subject => {
          refs[subject.name] = React.createRef<HTMLDivElement>();
        });
      });
      
      filesListRefs.current = refs;
    } catch (error) {
      console.error("Failed to create refs:", error);
      setLoadError("Failed to initialize file references");
    }
  }, []);

  // Fix for scroll issue in mobile browsers
  useEffect(() => {
    const handleScrollFix = () => {
      try {
        if (typeof window !== 'undefined') {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
          
          if (isIOS) {
            document.addEventListener('touchmove', function(e) {
              if (e.target !== document.documentElement) {
                e.stopPropagation();
              }
            }, { passive: false });
          }
        }
      } catch (error) {
        console.error("Scroll fix error:", error);
      }
    };
    
    handleScrollFix();
  }, []);

  // Toggle subject expansion
  const toggleSubject = (subjectName: string) => {
    try {
      setExpandedSubjects(prev => {
        const newState = { ...prev, [subjectName]: !prev[subjectName] };
        
        // Scroll to files list if expanded
        if (newState[subjectName] && filesListRefs.current[subjectName]?.current) {
          setTimeout(() => {
            filesListRefs.current[subjectName]?.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
        
        return newState;
      });
    } catch (error) {
      console.error("Toggle subject error:", error);
      addNotification({
        type: 'error',
        title: 'Error Expanding Subject',
        message: 'There was a problem expanding this subject'
      });
    }
  };

  // Check if subject is expanded
  const isSubjectExpanded = (subjectName: string) => {
    return !!expandedSubjects[subjectName];
  };

  // Add notification
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  };

  // Update notification
  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates } : n
    ));
  };

  // Remove notification
  const removeNotification = (id: string) => {
    // Mark notification for closing animation
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, closing: true } : n
    ));
    
    // Cancel active download if exists
    if (activeDownloadsRef.current[id]) {
      try {
        activeDownloadsRef.current[id].xhr.abort();
        delete activeDownloadsRef.current[id];
      } catch (error) {
        console.error("Error cancelling download:", error);
      }
    }
    
    // Remove after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300); // Match CSS animation duration
  };

  // Get short filename for download
  const getShortFilename = (subject: Subject, file: PDFFile, index: number) => {
    try {
      const baseName = file.path.split('/').pop() || `file-${index}.${file.isContactSheet ? 'jpg' : 'pdf'}`;
      const cleanName = baseName.replace(/['"`]/g, '');
      return `${subject.name.replace(/\s+/g, '_')}_${cleanName}`;
    } catch (error) {
      console.error("Error generating filename:", error);
      return `file-${subject.name}-${index}.${file.isContactSheet ? 'jpg' : 'pdf'}`;
    }
  };

  // Function to handle all file downloads for a subject
  const downloadAllFiles = (subject: Subject) => {
    // Set downloading state for this subject
    setIsDownloading(prev => ({ ...prev, [subject.name]: true }));
    
    // Initialize progress tracking
    setDownloadProgress(prev => ({ 
      ...prev, 
      [subject.name]: { 
        isDownloading: true, 
        progress: 0,
        isComplete: false
      } 
    }));
    
    // Show notification
    const notifId = addNotification({
      type: 'downloading',
      title: `Downloading ${subject.name}`,
      message: `Preparing ${subject.files.length} files...`,
      progress: 0,
    });
    
    // Notify service worker for PWA
    if (isPWA() && serviceWorkerActive) {
      notifyServiceWorkerDownload(
        `Downloading ${subject.name}`,
        `Preparing ${subject.files.length} files...`,
        `download-batch-${subject.name}`
      );
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
          
          // Update download progress state
          setDownloadProgress(prev => ({ 
            ...prev, 
            [subject.name]: { 
              ...prev[subject.name],
              progress: progress
            } 
          }));
          
          updateNotification(notifId, {
            progress,
            message: `Downloading file ${index + 1} of ${subject.files.length}...`
          });
          
          // Update service worker progress for PWA
          if (isPWA() && serviceWorkerActive && index % 2 === 0) { // Update every other file
            updateServiceWorkerProgress(
              progress,
              `Downloading ${subject.name}`,
              `File ${index + 1} of ${subject.files.length}`,
              `download-batch-${subject.name}`
            );
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
          
          downloadLinksRef.current?.appendChild(iframe);
          
          // If this is the last file, mark the batch as complete after a delay
          if (index === subject.files.length - 1) {
            setTimeout(() => {
              setIsDownloading(prev => ({ ...prev, [subject.name]: false }));
              
              // Mark as complete
              setDownloadProgress(prev => ({ 
                ...prev, 
                [subject.name]: { 
                  isDownloading: false, 
                  progress: 100,
                  isComplete: true
                } 
              }));
              
              updateNotification(notifId, {
                type: 'success',
                title: 'Download Complete',
                message: `All ${subject.files.length} files from ${subject.name} have been downloaded.`,
                progress: 100
              });
              
              // Notify service worker of completion for PWA
              if (isPWA() && serviceWorkerActive) {
                notifyServiceWorkerComplete(
                  'Download Complete',
                  `All ${subject.files.length} files from ${subject.name} have been downloaded.`,
                  `download-batch-${subject.name}`
                );
              }
              
              // Clean up iframes after a delay
              setTimeout(() => {
                if (downloadLinksRef.current) {
                  downloadLinksRef.current.innerHTML = '';
                }
              }, 1000);
            }, 1000 * subject.files.length / 2); // Allow time for all downloads to complete
          }
        }, index * 800); // Stagger downloads by 800ms
      });
    }
  };
  
  // Alternative download method using XHR for better progress tracking
  const downloadAllFilesAlt = (subject: Subject) => {
    // Set downloading state for this subject
    setIsDownloading(prev => ({ ...prev, [subject.name]: true }));
    
    // Initialize progress tracking
    setDownloadProgress(prev => ({ 
      ...prev, 
      [subject.name]: { 
        isDownloading: true, 
        progress: 0,
        isComplete: false
      } 
    }));
    
    // Show notification
    const notifId = addNotification({
      type: 'downloading',
      title: `Downloading ${subject.name}`,
      message: `Preparing ${subject.files.length} files...`,
      progress: 0,
    });
    
    // Notify service worker for PWA
    if (isPWA() && serviceWorkerActive) {
      try {
        notifyServiceWorkerDownload(
          `Downloading ${subject.name}`,
          `Preparing ${subject.files.length} files...`,
          `download-batch-${subject.name}`
        );
      } catch (error) {
        console.error("Service worker notification error:", error);
      }
    }
    
    // Track overall progress
    let totalFiles = subject.files.length;
    let completedFiles = 0;
    
    // Process each file sequentially
    const downloadNextFile = (index: number) => {
      if (index >= totalFiles) {
        // All files completed
        setIsDownloading(prev => ({ ...prev, [subject.name]: false }));
        
        // Mark as complete
        setDownloadProgress(prev => ({ 
          ...prev, 
          [subject.name]: { 
            isDownloading: false, 
            progress: 100,
            isComplete: true
          } 
        }));
        
        updateNotification(notifId, {
          type: 'success',
          title: 'Download Complete',
          message: `All ${totalFiles} files from ${subject.name} have been downloaded.`,
          progress: 100
        });
        
        if (isPWA() && serviceWorkerActive) {
          try {
            notifyServiceWorkerComplete(
              'Download Complete',
              `All ${totalFiles} files from ${subject.name} have been downloaded.`,
              `download-batch-${subject.name}`
            );
          } catch (error) {
            console.error("Service worker notification error:", error);
          }
        }
        
        return;
      }
      
      const file = subject.files[index];
      const fileId = `${subject.name}-${file.name}`;
      
      // Fix path to ensure it's properly resolved from the base URL
      const basePath = window.location.origin;
      const filePath = file.path.startsWith('/') ? `${basePath}${file.path}` : `${basePath}/${file.path}`;
      
      // For desktop browsers, use XMLHttpRequest to track download progress
      const xhr = new XMLHttpRequest();
      
      try {
        xhr.open('GET', filePath, true);
        xhr.responseType = 'blob';
        
        // Track download progress
        xhr.onprogress = (event) => {
          if (event.lengthComputable) {
            const fileProgress = Math.round((event.loaded / event.total) * 100);
            const overallProgress = Math.round(((completedFiles + (fileProgress / 100)) / totalFiles) * 100);
            
            // Update batch progress
            setDownloadProgress(prev => ({ 
              ...prev, 
              [subject.name]: { 
                ...prev[subject.name],
                progress: overallProgress
              } 
            }));
            
            updateNotification(notifId, {
              progress: overallProgress,
              message: `Downloading file ${index + 1} of ${totalFiles}: ${fileProgress}%`
            });
            
            // Update service worker progress for PWA
            if (isPWA() && serviceWorkerActive && fileProgress % 20 === 0) { // Update every 20%
              try {
                updateServiceWorkerProgress(
                  overallProgress,
                  `Downloading ${subject.name}`,
                  `File ${index + 1} of ${totalFiles}: ${fileProgress}%`,
                  `download-batch-${subject.name}`
                );
              } catch (error) {
                console.error("Service worker progress update error:", error);
              }
            }
          }
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
              link.download = getShortFilename(subject, file, index);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Clean up
              setTimeout(() => URL.revokeObjectURL(url), 100);
              
              // Increment completed files counter
              completedFiles++;
              
              // Update overall progress
              const overallProgress = Math.round((completedFiles / totalFiles) * 100);
              
              // Update batch progress
              setDownloadProgress(prev => ({ 
                ...prev, 
                [subject.name]: { 
                  ...prev[subject.name],
                  progress: overallProgress
                } 
              }));
              
              updateNotification(notifId, {
                progress: overallProgress,
                message: `Downloaded file ${index + 1} of ${totalFiles}`
              });
              
              // Download next file after a short delay
              setTimeout(() => {
                downloadNextFile(index + 1);
              }, 800);
            } catch (error) {
              console.error("Download processing error:", error);
              updateNotification(notifId, {
                type: 'error',
                title: 'Download Processing Failed',
                message: `Failed to process ${file.name}. Continuing with next file...`
              });
              
              // Try next file
              setTimeout(() => {
                downloadNextFile(index + 1);
              }, 800);
            }
          } else {
            updateNotification(notifId, {
              type: 'error',
              title: 'Download Failed',
              message: `Failed to download ${file.name} (HTTP ${xhr.status}). Continuing with next file...`
            });
            
            // Try next file
            setTimeout(() => {
              downloadNextFile(index + 1);
            }, 800);
          }
        };
        
        // Handle download errors
        xhr.onerror = () => {
          updateNotification(notifId, {
            type: 'error',
            title: 'Download Failed',
            message: `Failed to download ${file.name}. Continuing with next file...`
          });
          
          // Try next file
          setTimeout(() => {
            downloadNextFile(index + 1);
          }, 800);
        };
        
        // Start download
        xhr.send();
      } catch (error) {
        console.error("XHR setup error:", error);
        updateNotification(notifId, {
          type: 'error',
          title: 'Download Setup Failed',
          message: `Failed to set up download for ${file.name}. Continuing with next file...`
        });
        
        // Try next file
        setTimeout(() => {
          downloadNextFile(index + 1);
        }, 800);
      }
    };
    
    // Start downloading the first file
    downloadNextFile(0);
  };

  // Function to handle single file download with real progress tracking
  const handleFileDownload = (subject: Subject, file: PDFFile, fileIndex: number) => {
    const fileId = `${subject.name}-${file.name}`;
    
    // Already downloading
    if (fileDownloads[fileId]) return;
    
    // Set downloading state
    setFileDownloads(prev => ({ ...prev, [fileId]: true }));
    
    // Initialize progress tracking
    setDownloadProgress(prev => ({ 
      ...prev, 
      [fileId]: { 
        isDownloading: true, 
        progress: 0,
        isComplete: false
      } 
    }));
    
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
      notifyServiceWorkerDownload(
        `Downloading ${file.name}`, 
        'Starting download...', 
        `download-${fileId}`
      );
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
            // Update download progress state
            setDownloadProgress(prev => ({ 
              ...prev, 
              [fileId]: { 
                ...prev[fileId],
                progress: progress
              } 
            }));
            
            updateNotification(notifId, {
              progress,
              message: `Downloading... ${progress}%`
            });
          } else {
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
            
            // Mark as complete
            setDownloadProgress(prev => ({ 
              ...prev, 
              [fileId]: { 
                isDownloading: false, 
                progress: 100,
                isComplete: true
              } 
            }));
            
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
            
            // Reset progress state
            setDownloadProgress(prev => ({ 
              ...prev, 
              [fileId]: { 
                isDownloading: false, 
                progress: 0,
                isComplete: false
              } 
            }));
          });
      } catch (error) {
        console.error('Error downloading file on mobile:', error);
        updateNotification(notifId, {
          type: 'error',
          title: 'Download Failed',
          message: `Failed to download ${file.name}. Please try again.`
        });
        setFileDownloads(prev => ({ ...prev, [fileId]: false }));
        
        // Reset progress state
        setDownloadProgress(prev => ({ 
          ...prev, 
          [fileId]: { 
            isDownloading: false, 
            progress: 0,
            isComplete: false
          } 
        }));
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
        
        // Update download progress state
        setDownloadProgress(prev => ({ 
          ...prev, 
          [fileId]: { 
            ...prev[fileId],
            progress: progress
          } 
        }));
        
        updateNotification(notifId, {
          progress,
          message: `Downloading... ${progress}%`
        });
        
        // Update service worker progress for PWA
        if (isPWA() && serviceWorkerActive && progress % 10 === 0) { // Update every 10%
          updateServiceWorkerProgress(
            progress,
            `Downloading ${file.name}`,
            `${progress}% complete`,
            `download-${fileId}`
          );
        }
      }
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
          
          // Mark as complete
          setDownloadProgress(prev => ({ 
            ...prev, 
            [fileId]: { 
              isDownloading: false, 
              progress: 100,
              isComplete: true
            } 
          }));
          
          // Update notification
          updateNotification(notifId, {
            type: 'success',
            title: 'Download Complete',
            message: `${file.name} has been downloaded.`,
            progress: 100
          });
          
          // Notify service worker of completion for PWA
          if (isPWA() && serviceWorkerActive) {
            notifyServiceWorkerComplete(
              'Download Complete',
              `${file.name} has been downloaded.`,
              `download-${fileId}`
            );
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
    
    // Helper function for error handling
    const handleDownloadError = () => {
      updateNotification(notifId, {
        type: 'error',
        title: 'Download Failed',
        message: `Failed to download ${file.name}. Please try again.`
      });
      
      setFileDownloads(prev => ({ ...prev, [fileId]: false }));
      
      // Reset progress state
      setDownloadProgress(prev => ({ 
        ...prev, 
        [fileId]: { 
          isDownloading: false, 
          progress: 0,
          isComplete: false
        } 
      }));
      
      delete activeDownloadsRef.current[notifId];
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
      
      // Reset progress state
      setDownloadProgress(prev => ({ 
        ...prev, 
        [fileId]: { 
          isDownloading: false, 
          progress: 0,
          isComplete: false
        } 
      }));
      
      delete activeDownloadsRef.current[notifId];
    };
    
    // Start download
    xhr.send();
    
    // Store reference to active download
    activeDownloadsRef.current[notifId] = { xhr, notifId };
  };
  
  // Function to open downloads folder
  const handleOpenDownloadsFolder = () => {
    import('../utils/notificationUtils').then(utils => {
      utils.openDownloadsFolder();
    });
  };

  // Show error message if load error occurred
  if (loadError) {
    return (
      <div className="pdf-store-error">
        <h2>Error Loading PDF Store</h2>
        <p>{loadError}</p>
        <button onClick={() => window.location.reload()}>Refresh Page</button>
      </div>
    );
  }

  return (
    <div className="pdf-store-container">
      <div className="store-header">
        <h2>Electrical Engineering PDF Store</h2>
        <p>Download resources for your semester</p>
      </div>
      
      {/* Hidden div to hold download iframes */}
      <div ref={downloadLinksRef} style={{ display: 'none' }}></div>
      
      {/* Notification container */}
      <div className={`notification-container ${isPWA() ? 'pwa-notifications' : ''}`}>
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type} ${notification.closing ? 'closing' : ''}`}
          >
            <div className="notification-icon">
              {notification.type === 'downloading' && '⬇️'}
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
            </div>
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              
              {notification.progress !== undefined && (
                <div className="notification-progress">
                  <div 
                    className="notification-progress-bar"
                    style={{ width: `${notification.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
            <button 
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      <div className="semester-tabs">
        {electricalEngineeringSemesters.map((semester, index) => (
          <button 
            key={index}
            className={`semester-tab ${activeSemester === index ? 'active' : ''}`}
            onClick={() => setActiveSemester(index)}
          >
            {semester.name}
          </button>
        ))}
      </div>
      
      <div className="subject-list">
        <h3>{electricalEngineeringSemesters[activeSemester].name} Subjects</h3>
        <div className="subjects-grid">
          {electricalEngineeringSemesters[activeSemester].subjects.map((subject, index) => (
            <div className="subject-card" key={index}>
              <div className="subject-icon">
                {subject.files.some(file => file.isContactSheet) ? '🖼️' : '📄'}
              </div>
              <h4>{subject.name}</h4>
              <div className="file-count">
                {subject.files.length} {subject.files.length === 1 ? 'file' : 'files'} available
              </div>
              
              {subject.files.length > 0 ? (
                <>
                  {subject.files.length > 1 && (
                    <button 
                      className={`download-all-button ${
                        isDownloading[subject.name] ? 'downloading' : 
                        downloadProgress[subject.name]?.isComplete ? 'success' : ''
                      }`}
                      onClick={() => {
                        if (downloadProgress[subject.name]?.isComplete) {
                          handleOpenDownloadsFolder();
                        } else {
                          downloadAllFilesAlt(subject);
                        }
                      }}
                      disabled={isDownloading[subject.name]}
                      style={
                        isDownloading[subject.name] && downloadProgress[subject.name] 
                          ? { '--progress-width': `${downloadProgress[subject.name].progress}%` } as React.CSSProperties
                          : undefined
                      }
                    >
                      <span>
                        {isDownloading[subject.name] 
                          ? `Downloading... ${downloadProgress[subject.name]?.progress || 0}%` 
                          : downloadProgress[subject.name]?.isComplete 
                            ? 'Open Downloads Folder' 
                            : 'Download All Files'
                        }
                      </span>
                    </button>
                  )}
                  
                  <button 
                    className="toggle-files-button"
                    onClick={() => toggleSubject(subject.name)}
                  >
                    {isSubjectExpanded(subject.name) ? 'Hide Files' : 'Show Individual Files'}
                  </button>
                  
                  {isSubjectExpanded(subject.name) && (
                    <div 
                      className="files-list"
                      ref={filesListRefs.current[subject.name]}
                    >
                      {subject.files.map((file, fileIndex) => {
                        const fileId = `${subject.name}-${file.name}`;
                        const isFileDownloading = fileDownloads[fileId];
                        const fileProgress = downloadProgress[fileId];
                        
                        return (
                          <div key={fileIndex} className="file-item">
                            <span className={`file-icon ${file.isContactSheet ? 'image-file' : 'pdf-file'}`}>
                              {file.isContactSheet ? '🖼️' : '📄'}
                            </span>
                            <span className="file-name">{file.name}</span>
                            <a 
                              href={`${window.location.origin}${file.path.startsWith('/') ? file.path : '/' + file.path}`}
                              download={getShortFilename(subject, file, fileIndex)}
                              className={`download-file-button ${
                                isFileDownloading ? 'downloading' : 
                                fileProgress?.isComplete ? 'success' : ''
                              }`}
                              target="_blank"
                              onClick={(e) => {
                                e.preventDefault(); // Prevent default anchor behavior
                                if (fileProgress?.isComplete) {
                                  handleOpenDownloadsFolder();
                                } else {
                                  handleFileDownload(subject, file, fileIndex);
                                }
                              }}
                              style={
                                isFileDownloading && fileProgress 
                                  ? { '--progress-width': `${fileProgress.progress}%` } as React.CSSProperties
                                  : undefined
                              }
                            >
                              <span>
                                {isFileDownloading 
                                  ? `${fileProgress?.progress || 0}%` 
                                  : fileProgress?.isComplete 
                                    ? 'Open Location' 
                                    : 'Download'
                                }
                              </span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="no-files-message">No files available</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 