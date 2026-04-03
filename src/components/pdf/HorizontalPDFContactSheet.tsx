import React, { useState, useRef, useEffect } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import './PDFContactSheet.css'; // Reusing the existing CSS
import { notifyServiceWorkerDownload, notifyServiceWorkerComplete, updateServiceWorkerProgress, isPWA } from '../utils/notificationUtils';

// Worker is already initialized in main.tsx
// No need to initialize PDF.js worker here

interface HorizontalPDFContactSheetProps {
  config: {
    spacing: number;
    resolution: number;
  };
}

interface PDFPageItem {
  originalFile: File;
  pageNumber: number;
  name: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const HorizontalPDFContactSheet: React.FC<HorizontalPDFContactSheetProps> = ({ config }) => {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfPages, setPdfPages] = useState<PDFPageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      pdfFiles.forEach(file => {
        URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [pdfFiles]);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 100MB limit');
      return false;
    }
    if (!file.type.includes('pdf')) {
      setError('Only PDF files are supported');
      return false;
    }
    return true;
  };

  const extractPagesFromPDF = async (file: File) => {
    let fileUrl: string | null = null;
    try {
      setIsExtracting(true);
      setExtractionProgress(0);

      fileUrl = URL.createObjectURL(file);
      const loadingTask = pdfjs.getDocument(fileUrl);

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const newPages: PDFPageItem[] = [];

      for (let i = 1; i <= numPages; i++) {
        newPages.push({
          originalFile: file,
          pageNumber: i,
          name: `${file.name} (Page ${i} of ${numPages})`
        });

        setExtractionProgress(Math.round((i / numPages) * 100));
      }

      setPdfPages(prevPages => [...prevPages, ...newPages]);
    } catch (err) {
      console.error('Error extracting pages:', err);
      setError(`Error extracting pages from ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      setIsExtracting(false);
      setExtractionProgress(100);
    }
  };

  const processUploadedFiles = async (files: File[]) => {
    setError(null);
    setPdfFiles(prevFiles => [...prevFiles, ...files]);

    // Process each file to extract pages
    for (const file of files) {
      await extractPagesFromPDF(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_FILE_SIZE,
    onDrop: async (acceptedFiles) => {
      setError(null);
      const validFiles = acceptedFiles.filter(validateFile);
      await processUploadedFiles(validFiles);
    },
    onDropRejected: (rejectedFiles) => {
      const error = rejectedFiles[0]?.errors[0]?.message || 'Invalid file';
      setError(error);
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setError(null);
      const validFiles = Array.from(files).filter(validateFile);
      await processUploadedFiles(validFiles);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removePage = (index: number) => {
    setPdfPages(prevPages => prevPages.filter((_, i) => i !== index));
  };

  const removeFile = (file: File) => {
    setPdfFiles(prevFiles => prevFiles.filter(f => f !== file));
    setPdfPages(prevPages => prevPages.filter(page => page.originalFile !== file));
  };

  const clearAllFiles = () => {
    setPdfFiles([]);
    setPdfPages([]);
  };

  const handleGenerateClick = () => {
    setShowConfirmDialog(true);
    setPendingGeneration(true);
  };

  const handleConfirmGeneration = () => {
    setShowConfirmDialog(false);
    setPendingGeneration(false);
    generateContactSheet();
  };

  const handleCancelGeneration = () => {
    setShowConfirmDialog(false);
    setPendingGeneration(false);
  };

  // Function to show download notifications
  const showDownloadNotification = (type: 'downloading' | 'success' | 'error', message: string, progress?: number) => {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }

    // Check if there's an existing download notification to update
    let notification = document.querySelector('.notification.horizontal-pdf-contact-sheet');

    // Generate a unique ID for this notification for service worker
    const notificationId = 'horizontal-pdf-contact-sheet-' + new Date().getTime();

    // Send notification to service worker if in PWA mode
    if (type === 'downloading' && progress !== undefined) {
      updateServiceWorkerProgress(progress, 'Generating 2nT PDF', message, notificationId);
    } else if (type === 'success') {
      notifyServiceWorkerComplete('2nT PDF Generated', message, notificationId);
    } else if (type === 'error') {
      notifyServiceWorkerDownload('Error', message, notificationId);
    }

    if (!notification || type === 'success' || type === 'error') {
      // Remove existing notification if transitioning to success/error
      if (notification && (type === 'success' || type === 'error')) {
        notification.remove();
      }

      // Create new notification
      notification = document.createElement('div');
      notification.className = `notification ${type} horizontal-pdf-contact-sheet`;

      // Add notification content based on type
      const icon = type === 'downloading' ? '⬇️' : type === 'success' ? '✅' : '❌';
      const title = type === 'downloading' ? 'Generating 2nT PDF' : type === 'success' ? 'Download Complete' : 'Error';

      notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
          <h4>${title}</h4>
          <p>${message}</p>
          ${progress !== undefined ? `
          <div class="notification-progress">
            <div class="notification-progress-bar" style="width: ${progress}%"></div>
          </div>
          ` : ''}
        </div>
        <button class="notification-close">✕</button>
      `;

      // Add to container
      notificationContainer.appendChild(notification);

      // Add close event
      const closeButton = notification.querySelector('.notification-close');
      closeButton?.addEventListener('click', () => {
        if (notification) {
          notification.classList.add('closing');
          setTimeout(() => {
            notification?.remove();
          }, 300);
        }
      });

      // Auto remove after some time for success/error
      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          if (notification) {
            notification.classList.add('closing');
            setTimeout(() => {
              notification?.remove();
            }, 300);
          }
        }, 5000);
      }
    } else {
      // Update existing notification
      const progressBar = notification.querySelector('.notification-progress-bar') as HTMLElement;
      const messageEl = notification.querySelector('.notification-content p') as HTMLElement;

      if (progressBar && progress !== undefined) {
        progressBar.style.width = `${progress}%`;
      }

      if (messageEl) {
        messageEl.textContent = message;
      }
    }

    return notification;
  };

  const generateContactSheet = async () => {
    // Show processing notification
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }

    const processingNotification = document.createElement('div');
    processingNotification.className = 'notification downloading';
    processingNotification.innerHTML = `
      <div class="notification-icon">⬇️</div>
      <div class="notification-content">
        <h4>Processing PDF</h4>
        <p>Generating Two n T layout...</p>
        <div class="notification-progress">
          <div class="notification-progress-bar" style="width: 0%"></div>
        </div>
      </div>
    `;

    notificationContainer.appendChild(processingNotification);
    const progressBar = processingNotification.querySelector('.notification-progress-bar') as HTMLElement;

    if (!canvasRef.current) return;

    setIsGenerating(true);
    setLoadingProgress(0);
    setError(null);

    // A4 dimensions in landscape orientation
    const dpiScale = config.resolution / 72;
    const pageWidth = 842 * dpiScale; // A4 width in landscape (297mm)
    const pageHeight = 595 * dpiScale; // A4 height in landscape (210mm)

    // Set canvas size
    canvasRef.current.width = pageWidth;
    canvasRef.current.height = pageHeight;

    // Calculate dimensions for 2 PDFs per page to fully occupy the space
    const spacing = config.spacing * dpiScale;
    const thumbWidth = (pageWidth - (spacing * 3)) / 2; // 2 columns with spacing
    const thumbHeight = pageHeight - (spacing * 2); // Full height minus spacing

    // Calculate total sheets needed (2 PDFs per sheet)
    const totalSheets = Math.ceil(pdfPages.length / 2);

    // Update the notification progress bar
    const updateNotificationProgress = (progress: number) => {
      setLoadingProgress(progress);
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    };

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
        // Clear canvas for new sheet with pure white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);


        // Process 2 PDFs for this sheet
        for (let i = 0; i < 2; i++) {
          const pageIndex = sheetIndex * 2 + i;
          if (pageIndex >= pdfPages.length) break; // No more pages

          const pageItem = pdfPages[pageIndex];
          const progress = ((pageIndex + 1) / pdfPages.length) * 100;
          setLoadingProgress(Math.round(progress));

          try {
            // Load PDF
            const pdfUrl = URL.createObjectURL(pageItem.originalFile);
            const loadingTask = pdfjs.getDocument(pdfUrl);
            const loadedPdf = await loadingTask.promise;

            // Get the specific page
            const page = await loadedPdf.getPage(pageItem.pageNumber);
            const viewport = page.getViewport({ scale: 1.0 });

            // Calculate scale to fill the entire thumbnail space
            const scale = Math.min(
              thumbWidth / viewport.width,
              thumbHeight / viewport.height
            );

            const scaledViewport = page.getViewport({ scale });
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = scaledViewport.width;
            tempCanvas.height = scaledViewport.height;
            const tempCtx = tempCanvas.getContext('2d');

            if (!tempCtx) throw new Error('Could not create temporary canvas');

            await page.render({
              canvasContext: tempCtx,
              viewport: scaledViewport,
              background: 'transparent',
              intent: 'print'
            }).promise;

            // Position the PDF on the sheet (left or right)
            const x = spacing + i * (thumbWidth + spacing);
            const y = spacing;

            // Draw the PDF to fill the entire thumbnail space
            ctx.drawImage(tempCanvas, x, y, thumbWidth, thumbHeight);

            // Cleanup
            URL.revokeObjectURL(pdfUrl);
          } catch (err) {
            console.error(`Error rendering PDF page ${pageIndex + 1}:`, err);
          }
        }

        // Create and save PDF for current sheet
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        const imageData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imageData, 'JPEG', 0, 0, canvas.width, canvas.height);

        // Save with sheet number in filename
        const filename = `horizontal-contact-sheet-${sheetIndex + 1}.pdf`;
        pdf.save(filename);

        // Update progress
        const progress = ((sheetIndex + 1) / totalSheets) * 100;
        setLoadingProgress(Math.round(progress));
        updateNotificationProgress(Math.round(progress));
      }

      // When PDF is ready to download
      updateNotificationProgress(100);

      // Remove processing notification
      processingNotification.classList.add('closing');
      setTimeout(() => {
        processingNotification.remove();

        // Show download complete notification
        showDownloadNotification('success', 'Two n T sheet has been downloaded successfully.');
      }, 300);
    } catch (error) {
      console.error('Error generating contact sheet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);

      // Show error notification
      showDownloadNotification('error', `Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsExtracting(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="pdf-contact-sheet">
      <div className="upload-section">
        <h3 className="upload-section-title">Upload PDF Files</h3>
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          <div className="dropzone-icon">📄</div>
          <p>Drag & drop PDF files here</p>
        </div>

        <button className="pdf-select-button" onClick={openFileDialog}>
          Select PDF Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          multiple
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {isExtracting && (
        <div className="extraction-status">
          <p>Extracting pages from PDF...</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${extractionProgress}%` }}></div>
            <span>{extractionProgress}%</span>
          </div>
        </div>
      )}

      {pdfFiles.length > 0 && (
        <div className="pdf-file-list">
          <h3>Uploaded Files ({pdfFiles.length})</h3>
          <button className="clear-button" onClick={clearAllFiles}>
            Clear All
          </button>
          <ul>
            {pdfFiles.map((file, index) => (
              <li key={index}>
                {file.name}
                <button onClick={() => removeFile(file)} className="remove-button">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pdfPages.length > 0 && (
        <>
          <div className="pdf-pages-list">
            <h3>Extracted Pages ({pdfPages.length})</h3>
            <ul>
              {pdfPages.map((page, index) => (
                <li key={index}>
                  {page.name}
                  <button onClick={() => removePage(index)} className="remove-button">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pdf-preview">
            <button
              className={`generate-button ${isGenerating ? 'generating' : ''}`}
              onClick={handleGenerateClick}
              disabled={isGenerating || pendingGeneration}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner"></span>
                  Generating... {loadingProgress}%
                </>
              ) : (
                'Generate Two n T'
              )}
            </button>

            {isGenerating && (
              <div className="progress-bar">
                <div className="progress" style={{ width: `${loadingProgress}%` }}></div>
                <span>{loadingProgress}%</span>
              </div>
            )}
          </div>
        </>
      )}

      {showConfirmDialog && (
        <div className="confirmation-dialog">
          <div className="confirmation-content">
            <h4>Download Confirmation</h4>
            <p>The Two n T sheet will be downloaded to your device. Do you want to proceed?</p>
            <div className="confirmation-buttons">
              <button className="confirm-button" onClick={handleConfirmGeneration}>Yes, Download</button>
              <button className="cancel-button" onClick={handleCancelGeneration}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}; 