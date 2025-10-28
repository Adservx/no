import React, { useState, useRef, useEffect } from 'react';
import './PDFStore.css';
import { isPWA, requestNotificationPermission, notifyServiceWorkerDownload, notifyServiceWorkerComplete, updateServiceWorkerProgress, showBrowserNotification, sendServiceWorkerNotification } from '../utils/notificationUtils';
import { getR2FileUrl, convertPathToR2Key, isR2Configured } from '../utils/r2Storage';
import { pdfHelpers } from '../utils/supabase';

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
  fileSize?: number;
  downloadedSize?: number;
  semester?: string;
  subject?: string;
  fileName?: string;
  queuePosition?: number;
  startTime?: number;
  elapsedTime?: number;
  estimatedTimeRemaining?: number;
}

// Interface for download queue item
interface QueueItem {
  subject: Subject;
  file: PDFFile;
  fileIndex: number;
  semesterName: string;
  id: string;
}

// Helper function to format time in seconds to readable format
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
};

// Helper function to get file URL
const getFileUrl = (filePath: string): string => {
  if (isR2Configured()) {
    const key = convertPathToR2Key(filePath);
    return getR2FileUrl(key);
  } else {
    // Fallback to local
    const basePath = window.location.origin;
    return filePath.startsWith('/') ? `${basePath}${filePath}` : `${basePath}/${filePath}`;
  }
};

// Function to load files from database and merge with hardcoded data
const loadFilesFromDatabase = async (): Promise<SemesterData[]> => {
  const { data: dbFiles, error } = await pdfHelpers.getAllFiles();
  
  if (error) {
    console.error('Error loading files from database:', error);
    return hardcodedSemesters;
  }

  if (!dbFiles || dbFiles.length === 0) {
    return hardcodedSemesters;
  }

  // Group files by semester and subject
  const semesterMap = new Map<string, Map<string, PDFFile[]>>();
  
  dbFiles.forEach((file: any) => {
    if (!semesterMap.has(file.semester)) {
      semesterMap.set(file.semester, new Map());
    }
    const subjectMap = semesterMap.get(file.semester)!;
    
    if (!subjectMap.has(file.subject)) {
      subjectMap.set(file.subject, []);
    }
    
    subjectMap.get(file.subject)!.push({
      name: file.file_name,
      path: file.file_path.startsWith('/') ? file.file_path : `/${file.file_path}`
    });
  });

  // Merge with hardcoded data
  const mergedSemesters = [...hardcodedSemesters];
  
  semesterMap.forEach((subjectMap, semesterName) => {
    let semesterData = mergedSemesters.find(s => s.name === semesterName);
    
    if (!semesterData) {
      // Create new semester if it doesn't exist
      semesterData = { name: semesterName, subjects: [] };
      mergedSemesters.push(semesterData);
    }
    
    subjectMap.forEach((files, subjectName) => {
      let subjectData = semesterData!.subjects.find(s => s.name === subjectName);
      
      if (!subjectData) {
        // Create new subject if it doesn't exist
        subjectData = { name: subjectName, files: [] };
        semesterData!.subjects.push(subjectData);
      }
      
      // Add new files (avoid duplicates)
      files.forEach(file => {
        const exists = subjectData!.files.some(f => f.path === file.path);
        if (!exists) {
          subjectData!.files.push(file);
        }
      });
    });
  });

  return mergedSemesters;
};

const hardcodedSemesters: SemesterData[] = [
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
  }
];

export const PDFStore = () => {
  const [semesters, setSemesters] = useState<SemesterData[]>(hardcodedSemesters);
  const [activeSemester, setActiveSemester] = useState(0);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fileDownloads, setFileDownloads] = useState<Record<string, boolean>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgress>>({});
  const [subjectDownloadProgress, setSubjectDownloadProgress] = useState<Record<string, { downloading: boolean; progress: number }>>({});
  const [downloadQueue, setDownloadQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const downloadLinksRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<QueueItem[]>([]);

  // Load files from database on mount
  useEffect(() => {
    const loadFiles = async () => {
      const loadedSemesters = await loadFilesFromDatabase();
      setSemesters(loadedSemesters);
    };
    loadFiles();
  }, []);
  const isProcessingRef = useRef(false);

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

  // Process the download queue
  const processQueue = async () => {
    // Use ref-based lock to prevent multiple simultaneous processing
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }
    
    isProcessingRef.current = true;
    setIsProcessingQueue(true);
    
    try {
      while (queueRef.current.length > 0) {
        const item = queueRef.current[0];
        
        // Update queue positions for remaining items
        queueRef.current.forEach((qItem, index) => {
          const qItemId = `${qItem.subject.name}-${qItem.file.name}`;
          setDownloadProgress(prev => ({
            ...prev,
            [qItemId]: {
              ...prev[qItemId],
              queuePosition: index + 1
            }
          }));
        });
        
        setDownloadQueue([...queueRef.current]);
        
        // Download the file (await ensures serial processing)
        await downloadFile(item.subject, item.file, item.fileIndex, item.semesterName);
        
        // Remove from queue after download completes
        queueRef.current.shift();
        setDownloadQueue([...queueRef.current]);
        
        // Add small delay between downloads to prevent browser throttling
        // This helps with domains that have stricter download policies
        if (queueRef.current.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      isProcessingRef.current = false;
      setIsProcessingQueue(false);
    }
  };

  // Add file to download queue
  const addToQueue = (subject: Subject, file: PDFFile, fileIndex: number, semesterName: string) => {
    const fileId = `${subject.name}-${file.name}`;
    
    // Check if already in queue, downloading, or completed
    const isDownloading = fileDownloads[fileId];
    const isInQueue = queueRef.current.some(item => item.id === fileId);
    const isCurrentlyDownloading = downloadProgress[fileId]?.isDownloading;
    
    if (isDownloading || isInQueue || isCurrentlyDownloading) {
      return;
    }
    
    const queueItem: QueueItem = {
      subject,
      file,
      fileIndex,
      semesterName,
      id: fileId
    };
    
    queueRef.current.push(queueItem);
    setDownloadQueue([...queueRef.current]);
    
    // Initialize progress with queue position
    setDownloadProgress(prev => ({
      ...prev,
      [fileId]: {
        isDownloading: false,
        progress: 0,
        isComplete: false,
        fileSize: 0,
        downloadedSize: 0,
        semester: semesterName,
        subject: subject.name,
        fileName: file.name,
        queuePosition: queueRef.current.length
      }
    }));
    
    // Start processing queue if not already processing
    if (!isProcessingRef.current) {
      processQueue();
    }
  };

  // Function to handle single file download with progress tracking
  const downloadFile = async (subject: Subject, file: PDFFile, fileIndex: number, semesterName?: string) => {
    const fileId = `${subject.name}-${file.name}`;
    
    // Already downloading
    if (fileDownloads[fileId]) return;
    
    // Set downloading state
    setFileDownloads(prev => ({ ...prev, [fileId]: true }));
    
    // Update progress to downloading state with start time
    const startTime = Date.now();
    setDownloadProgress(prev => ({ 
      ...prev, 
      [fileId]: { 
        ...prev[fileId],
        isDownloading: true, 
        progress: 0,
        queuePosition: undefined,
        startTime: startTime,
        elapsedTime: 0,
        estimatedTimeRemaining: 0
      } 
    }));
    
    // Add notification
    const notifId = addNotification({
      type: 'downloading',
      title: `Downloading ${file.name}`,
      message: `Starting download...`,
      progress: 0
    });
    
    // Get file URL
    const filePath = getFileUrl(file.path);
    
    try {
      // Fetch the file with streaming support
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Get file size from headers
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      // Update progress with file size immediately
      setDownloadProgress(prev => ({ 
        ...prev, 
        [fileId]: { 
          ...prev[fileId],
          fileSize: totalSize,
          downloadedSize: 0
        } 
      }));
      
      // Read the response body with progress tracking
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          // Calculate actual progress percentage
          const progress = totalSize > 0 ? Math.round((receivedLength / totalSize) * 100) : 0;
          
          // Calculate time metrics
          const currentTime = Date.now();
          const elapsedTime = Math.floor((currentTime - startTime) / 1000); // in seconds
          const downloadSpeed = receivedLength / (elapsedTime || 1); // bytes per second
          const remainingBytes = totalSize - receivedLength;
          const estimatedTimeRemaining = remainingBytes > 0 ? Math.floor(remainingBytes / downloadSpeed) : 0;
          
          // Update progress state
          setDownloadProgress(prev => ({ 
            ...prev, 
            [fileId]: { 
              ...prev[fileId],
              progress: progress,
              downloadedSize: receivedLength,
              elapsedTime: elapsedTime,
              estimatedTimeRemaining: estimatedTimeRemaining
            } 
          }));
          
          // Update notification with real progress
          const downloadedMB = (receivedLength / (1024 * 1024)).toFixed(2);
          const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
          const timeRemainingText = estimatedTimeRemaining > 0 ? ` - ${estimatedTimeRemaining}s remaining` : '';
          
          updateNotification(notifId, {
            message: totalSize > 0 
              ? `${downloadedMB} MB / ${totalMB} MB (${progress}%)${timeRemainingText}`
              : `${downloadedMB} MB downloaded`,
            progress: progress
          });
        }
      }
      
      // Combine chunks into a single Uint8Array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }
      
      // Create blob from the combined data
      const blob = new Blob([chunksAll]);
      const actualSize = blob.size;
      
      // Update with actual file size
      setDownloadProgress(prev => ({ 
        ...prev, 
        [fileId]: { 
          ...prev[fileId],
          fileSize: actualSize,
          downloadedSize: actualSize
        } 
      }));
      
      // Set to 100%
      setDownloadProgress(prev => ({ 
        ...prev, 
        [fileId]: { 
          ...prev[fileId],
          progress: 100
        } 
      }));
      
      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = getShortFilename(subject, file, fileIndex);
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      // Mark as complete
      setDownloadProgress(prev => ({ 
        ...prev, 
        [fileId]: { 
          isDownloading: false, 
          progress: 100,
          isComplete: true,
          fileSize: actualSize,
          downloadedSize: actualSize
        } 
      }));
      
      const fileSizeMB = (actualSize / (1024 * 1024)).toFixed(2);
      updateNotification(notifId, {
        type: 'success',
        title: 'Download Complete',
        message: `${file.name} (${fileSizeMB} MB) has been downloaded.`,
        progress: 100
      });
      
      // Clean up download tracking
      setFileDownloads(prev => ({ ...prev, [fileId]: false }));
      
    } catch (error) {
      console.error('Error downloading file:', error);
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
  };

  // Function to download all files in a subject
  const handleDownloadAllSubject = (subject: Subject, semesterName: string) => {
    const subjectId = subject.name;
    
    // Already downloading
    if (subjectDownloadProgress[subjectId]?.downloading) return;
    
    // Set downloading state
    setSubjectDownloadProgress(prev => ({
      ...prev,
      [subjectId]: { downloading: true, progress: 0 }
    }));
    
    // Add all files to queue
    subject.files.forEach((file, index) => {
      addToQueue(subject, file, index, semesterName);
    });
    
    // Add notification
    addNotification({
      type: 'downloading',
      title: `Queued ${subject.name}`,
      message: `${subject.files.length} files added to download queue`,
      progress: 0
    });
  };

  // Toggle subject expansion
  const toggleSubject = (subjectName: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectName]: !prev[subjectName]
    }));
  };

  // Check if subject is expanded
  const isSubjectExpanded = (subjectName: string) => {
    return !!expandedSubjects[subjectName];
  };

  // Monitor download progress to update subject download progress
  useEffect(() => {
    Object.keys(subjectDownloadProgress).forEach(subjectName => {
      if (!subjectDownloadProgress[subjectName]?.downloading) return;
      
      const subject = semesters[activeSemester].subjects.find((s: Subject) => s.name === subjectName);
      if (!subject) return;
      
      const totalFiles = subject.files.length;
      const completedFiles = subject.files.filter((file: PDFFile) => {
        const fileId = `${subjectName}-${file.name}`;
        return downloadProgress[fileId]?.isComplete;
      }).length;
      
      const progress = Math.round((completedFiles / totalFiles) * 100);
      
      if (progress !== subjectDownloadProgress[subjectName].progress) {
        setSubjectDownloadProgress(prev => ({
          ...prev,
          [subjectName]: { downloading: completedFiles < totalFiles, progress }
        }));
        
        // Reset after completion
        if (completedFiles === totalFiles) {
          setTimeout(() => {
            setSubjectDownloadProgress(prev => {
              const newState = { ...prev };
              delete newState[subjectName];
              return newState;
            });
          }, 3000);
        }
      }
    });
  }, [downloadProgress, subjectDownloadProgress, activeSemester]);

  return (
    <div className="pdf-store-container">
      <div className="store-header">
        <h2>Electrical Engineering PDF Store</h2>
        <p>Download resources for your semester</p>
      </div>
      
      {/* Hidden div to hold download iframes */}
      <div ref={downloadLinksRef} style={{ display: 'none' }}></div>
      
      {/* Full-screen progress overlay */}
      {Object.values(downloadProgress).some(p => p.isDownloading) && (
        <div className="download-progress-overlay">
          <div className="download-progress-content">
            <div className="download-progress-icon">⬇️</div>
            {Object.entries(downloadProgress).map(([fileId, progress]) => {
              if (progress.isDownloading) {
                const fileSizeMB = progress.fileSize ? (progress.fileSize / (1024 * 1024)).toFixed(2) : null;
                const currentDownloadedMB = progress.downloadedSize 
                  ? (progress.downloadedSize / (1024 * 1024)).toFixed(2)
                  : null;
                
                return (
                  <div key={fileId}>
                    <h3 className="download-progress-title">Downloading...</h3>
                    {progress.semester && progress.subject && progress.fileName && (
                      <p className="download-progress-path">
                        {progress.semester} / {progress.subject} / {progress.fileName}
                      </p>
                    )}
                    <p className="download-progress-message">
                      {fileSizeMB && currentDownloadedMB
                        ? `${currentDownloadedMB} MB / ${fileSizeMB} MB`
                        : 'Please wait while your file downloads'
                      }
                    </p>
                    <div className="download-progress-bar-container">
                      <div 
                        className="download-progress-bar-fill" 
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <div className="download-progress-percentage">
                      {progress.progress}%
                      {fileSizeMB && ` (${fileSizeMB} MB)`}
                    </div>
                    
                    {/* Time information */}
                    {progress.elapsedTime !== undefined && progress.elapsedTime > 0 && (
                      <div className="download-time-info">
                        <div className="time-elapsed">
                          ⏱️ Elapsed: {formatTime(progress.elapsedTime)}
                        </div>
                        {progress.estimatedTimeRemaining !== undefined && progress.estimatedTimeRemaining > 0 && (
                          <div className="time-remaining">
                            ⏳ Remaining: {formatTime(progress.estimatedTimeRemaining)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Queue indicator */}
                    {downloadQueue.length > 0 && (
                      <div className="queue-indicator">
                        <p className="queue-count">📋 {downloadQueue.length} file{downloadQueue.length > 1 ? 's' : ''} in queue</p>
                        <div className="queue-list">
                          {downloadQueue.slice(0, 5).map((item, index) => (
                            <div key={item.id} className="queue-item">
                              <span className="queue-position">#{index + 1}</span>
                              <span className="queue-file-name">{item.file.name}</span>
                            </div>
                          ))}
                          {downloadQueue.length > 5 && (
                            <div className="queue-item-more">
                              +{downloadQueue.length - 5} more...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
      
      {/* Notification container */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification ${notification.type}`}>
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
          </div>
        ))}
      </div>
      
      <div className="semester-tabs">
        {semesters.map((semester: SemesterData, index: number) => (
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
        <h3>{semesters[activeSemester].name} Subjects</h3>
        <div className="subjects-grid">
          {semesters[activeSemester].subjects.map((subject: Subject, index: number) => (
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
                  <button 
                    className={`download-all-button ${
                      subjectDownloadProgress[subject.name]?.downloading ? 'downloading' : 
                      subjectDownloadProgress[subject.name]?.progress === 100 ? 'success' : ''
                    }`}
                    onClick={() => handleDownloadAllSubject(subject, semesters[activeSemester].name)}
                    disabled={subjectDownloadProgress[subject.name]?.downloading}
                    style={{
                      '--progress-width': `${subjectDownloadProgress[subject.name]?.progress || 0}%`
                    } as React.CSSProperties}
                  >
                    <span>
                      {subjectDownloadProgress[subject.name]?.downloading
                        ? `Downloading... ${subjectDownloadProgress[subject.name]?.progress}%`
                        : subjectDownloadProgress[subject.name]?.progress === 100
                          ? '✓ Downloaded All'
                          : `Download All (${subject.files.length})`
                      }
                    </span>
                  </button>
                  
                  <button 
                    className="toggle-files-button"
                    onClick={() => toggleSubject(subject.name)}
                  >
                    {isSubjectExpanded(subject.name) ? 'Hide Files' : 'Show Individual Files'}
                  </button>
                  
                  {isSubjectExpanded(subject.name) && (
                    <div className="files-list">
                      {subject.files.map((file: PDFFile, fileIndex: number) => {
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
                              href={getFileUrl(file.path)}
                              download={getShortFilename(subject, file, fileIndex)}
                              className={`download-file-button ${
                                isFileDownloading ? 'downloading' : 
                                fileProgress?.isComplete ? 'success' : 
                                fileProgress?.queuePosition ? 'queued' : ''
                              }`}
                              target="_blank"
                              onClick={() => downloadFile(subject, file, fileIndex, semesters[activeSemester].name)}
                            >
                              <span>
                                {isFileDownloading 
                                  ? `${fileProgress?.progress || 0}%` 
                                  : fileProgress?.queuePosition
                                    ? `Queue #${fileProgress.queuePosition}`
                                    : fileProgress?.isComplete 
                                      ? 'Downloaded' 
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