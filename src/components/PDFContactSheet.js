import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import './PDFContactSheet.css';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const PDFContactSheet = ({ config }) => {
    const [pdfFile, setPdfFile] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingGeneration, setPendingGeneration] = useState(false);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (pdfFile) {
                URL.revokeObjectURL(URL.createObjectURL(pdfFile));
            }
        };
    }, [pdfFile]);
    const validateFile = (file) => {
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
    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: MAX_FILE_SIZE,
        onDrop: (acceptedFiles) => {
            setError(null);
            const file = acceptedFiles[0];
            if (file && validateFile(file)) {
                setPdfFile(file);
            }
        },
        onDropRejected: (rejectedFiles) => {
            const error = rejectedFiles[0]?.errors[0]?.message || 'Invalid file';
            setError(error);
        }
    });
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setError(null);
            setPdfFile(file);
        }
        else {
            setError('Please select a valid PDF file');
        }
    };
    const openFileDialog = () => {
        fileInputRef.current?.click();
    };
    const onDocumentLoadSuccess = ({ numPages }) => {
        setError(null);
        setNumPages(numPages);
        console.log(`PDF loaded with ${numPages} pages`);
    };
    const onDocumentLoadError = (error) => {
        console.error('PDF load error:', error);
        setError(`Error loading PDF: ${error.message}`);
        setNumPages(null);
        setPdfFile(null);
    };
    const getGridPosition = (index) => {
        if (config.layoutDirection === 'down') {
            const col = Math.floor(index / config.rows);
            const row = index % config.rows;
            return { row, col };
        }
        else { // across first
            const row = Math.floor(index / config.columns);
            const col = index % config.columns;
            return { row, col };
        }
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
    const showDownloadNotification = (type, message, progress) => {
        // Create notification container if it doesn't exist
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        // Check if there's an existing download notification to update
        let notification = document.querySelector('.notification.pdf-contact-sheet');
        if (!notification || type === 'success' || type === 'error') {
            // Create new notification
            notification = document.createElement('div');
            notification.className = `notification ${type} pdf-contact-sheet`;
            // Add notification content based on type
            const icon = type === 'downloading' ? '⬇️' : type === 'success' ? '✅' : '❌';
            const title = type === 'downloading' ? 'Generating PDF' : type === 'success' ? 'Download Complete' : 'Error';
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
        }
        else {
            // Update existing notification
            const progressBar = notification.querySelector('.notification-progress-bar');
            const messageEl = notification.querySelector('.notification-content p');
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
        if (!pdfFile || !numPages || !canvasRef.current) {
            setError('Please select a valid PDF file first');
            return;
        }
        setIsGenerating(true);
        setLoadingProgress(0);
        setError(null);
        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx)
                throw new Error('Could not get canvas context');
            // Calculate dimensions with DPI based on page size
            const dpiScale = config.resolution / 72;
            let pageWidth, pageHeight;
            switch (config.pageSize) {
                case 'A3':
                    pageWidth = 842 * dpiScale; // A3 width in portrait (297mm)
                    pageHeight = 1191 * dpiScale; // A3 height in portrait (420mm)
                    break;
                case 'Letter':
                    pageWidth = 612 * dpiScale; // Letter width in portrait (8.5in)
                    pageHeight = 792 * dpiScale; // Letter height in portrait (11in)
                    break;
                case 'A4':
                default:
                    pageWidth = 595 * dpiScale; // A4 width in portrait (210mm)
                    pageHeight = 842 * dpiScale; // A4 height in portrait (297mm)
                    break;
            }
            // Calculate the available space for thumbnails
            const horizontalSpacing = config.spacing * (config.columns + 1) * dpiScale;
            const verticalSpacing = config.spacing * (config.rows + 1) * dpiScale;
            // Calculate thumbnail width based on available space
            const thumbWidth = (pageWidth - horizontalSpacing) / config.columns;
            // Use a fixed aspect ratio (e.g., 1:1.414 which is A4 ratio)
            const aspectRatio = 1.414; // Standard A4 ratio
            const thumbHeight = thumbWidth * aspectRatio;
            // Adjust canvas height if needed to accommodate the thumbnails with fixed ratio
            const calculatedPageHeight = (thumbHeight * config.rows) + verticalSpacing;
            // Set canvas size
            canvas.width = pageWidth;
            canvas.height = calculatedPageHeight > pageHeight ? calculatedPageHeight : pageHeight;
            // Calculate total sheets needed
            const pagesPerSheet = config.rows * config.columns;
            const totalSheets = Math.ceil(numPages / pagesPerSheet);
            // Load PDF
            const pdfUrl = URL.createObjectURL(pdfFile);
            const loadingTask = pdfjs.getDocument(pdfUrl);
            const loadedPdf = await loadingTask.promise;
            // Update progress periodically as pages are processed
            let currentProgress = 0;
            const updateProgress = (progress) => {
                currentProgress = progress;
                setLoadingProgress(progress);
                showDownloadNotification('downloading', `Processing page ${Math.ceil(numPages * progress / 100)} of ${numPages}...`, progress);
            };
            // Generate each sheet
            for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
                // Clear canvas for new sheet with bluebird feather theme
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#4ade80'); // Light Green-400
                gradient.addColorStop(0.3, '#7dd3fc'); // Sky Blue-300
                gradient.addColorStop(0.7, '#38bdf8'); // Sky Blue-400
                gradient.addColorStop(1, '#22c55e'); // Green-500
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // Add feather pattern
                const featherSize = 80 * dpiScale;
                const featherCount = Math.ceil(canvas.width / featherSize) * Math.ceil(canvas.height / featherSize);
                // Draw feather pattern
                for (let i = 0; i < featherCount; i++) {
                    const row = Math.floor(i / Math.ceil(canvas.width / featherSize));
                    const col = i % Math.ceil(canvas.width / featherSize);
                    const x = col * featherSize;
                    const y = row * featherSize;
                    // Skip some feathers randomly for a more natural look
                    if (Math.random() > 0.7)
                        continue;
                    // Draw feather
                    ctx.save();
                    ctx.translate(x + featherSize / 2, y + featherSize / 2);
                    ctx.rotate(Math.random() * Math.PI * 2); // Random rotation
                    // Draw feather shaft
                    ctx.beginPath();
                    ctx.moveTo(0, -featherSize / 3);
                    ctx.lineTo(0, featherSize / 3);
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)'; // Sky blue
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    // Draw feather barbs
                    const barbCount = 10;
                    const barbLength = featherSize / 4;
                    for (let j = 0; j < barbCount; j++) {
                        const barbY = -featherSize / 3 + (j * featherSize / barbCount) * 0.66;
                        // Right side barbs
                        ctx.beginPath();
                        ctx.moveTo(0, barbY);
                        ctx.bezierCurveTo(barbLength / 3, barbY + featherSize / 60, barbLength / 2, barbY + featherSize / 30, barbLength, barbY);
                        ctx.strokeStyle = 'rgba(125, 211, 252, 0.07)'; // Light sky blue
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        // Left side barbs
                        ctx.beginPath();
                        ctx.moveTo(0, barbY);
                        ctx.bezierCurveTo(-barbLength / 3, barbY + featherSize / 60, -barbLength / 2, barbY + featherSize / 30, -barbLength, barbY);
                        ctx.strokeStyle = 'rgba(74, 222, 128, 0.07)'; // Light green
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                const startPage = sheetIndex * pagesPerSheet + 1;
                const endPage = Math.min((sheetIndex + 1) * pagesPerSheet, numPages);
                let currentPage = startPage;
                // Draw pages for current sheet
                for (let i = 0; i < pagesPerSheet && currentPage <= endPage; i++) {
                    const position = getGridPosition(i);
                    if (!position)
                        continue;
                    const { row, col } = position;
                    const progress = (((sheetIndex * pagesPerSheet) + (currentPage - startPage)) / numPages) * 100;
                    updateProgress(progress);
                    try {
                        const page = await loadedPdf.getPage(currentPage);
                        const viewport = page.getViewport({ scale: 1.0 });
                        const scale = Math.min(thumbWidth / viewport.width, thumbHeight / viewport.height) * 1.5;
                        const scaledViewport = page.getViewport({ scale });
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = scaledViewport.width;
                        tempCanvas.height = scaledViewport.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (!tempCtx)
                            throw new Error('Could not create temporary canvas');
                        await page.render({
                            canvasContext: tempCtx,
                            viewport: scaledViewport,
                            background: 'transparent',
                            intent: 'print'
                        }).promise;
                        const x = config.spacing * dpiScale + col * (thumbWidth + config.spacing * dpiScale);
                        const y = config.spacing * dpiScale + row * (thumbHeight + config.spacing * dpiScale);
                        // Center the PDF within its allocated space if it doesn't fill the entire area
                        const pdfWidth = Math.min(thumbWidth, scaledViewport.width);
                        const pdfHeight = Math.min(thumbHeight, scaledViewport.height);
                        const xOffset = (thumbWidth - pdfWidth) / 2;
                        const yOffset = (thumbHeight - pdfHeight) / 2;
                        // Draw white background for the PDF thumbnail
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x + xOffset - 5, y + yOffset - 5, pdfWidth + 10, pdfHeight + 10);
                        // Draw the PDF on top of the white background
                        ctx.drawImage(tempCanvas, x + xOffset, y + yOffset, pdfWidth, pdfHeight);
                        currentPage++;
                    }
                    catch (err) {
                        console.error(`Error rendering page ${currentPage}:`, err);
                    }
                }
                // Create and save PDF for current sheet with proper page size
                let pdfFormat;
                switch (config.pageSize) {
                    case 'A3':
                        pdfFormat = 'a3';
                        break;
                    case 'Letter':
                        pdfFormat = 'letter';
                        break;
                    case 'A4':
                    default:
                        pdfFormat = 'a4';
                        break;
                }
                const pdf = new jsPDF({
                    orientation: pageHeight > pageWidth ? 'portrait' : 'landscape',
                    unit: 'px',
                    format: pdfFormat
                });
                const imageData = canvas.toDataURL('image/jpeg', 1.0);
                pdf.addImage(imageData, 'JPEG', 0, 0, canvas.width, canvas.height);
                // Save with sheet number in filename
                const filename = `contact-sheet-${sheetIndex + 1}-${pdfFile.name}`;
                pdf.save(filename);
            }
            // Cleanup
            URL.revokeObjectURL(pdfUrl);
            // When finished
            updateProgress(100);
            showDownloadNotification('success', 'Contact sheet has been downloaded successfully!');
        }
        catch (err) {
            console.error('Generation error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            showDownloadNotification('error', `Failed to generate PDF: ${errorMessage}`);
        }
        finally {
            setIsGenerating(false);
            setLoadingProgress(100);
        }
    };
    return (_jsxs("div", { className: "pdf-contact-sheet", children: [_jsxs("div", { className: "upload-section", children: [_jsx("h3", { className: "upload-section-title", children: "Upload PDF" }), _jsxs("div", { ...getRootProps(), className: "dropzone", children: [_jsx("input", { ...getInputProps() }), _jsx("div", { className: "dropzone-icon", children: "\uD83D\uDCC4" }), _jsx("p", { children: "Drag & drop a PDF file here" })] }), _jsx("button", { className: "pdf-select-button", onClick: openFileDialog, children: "Select PDF File" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "application/pdf", onChange: handleFileSelect, style: { display: 'none' } })] }), error && _jsx("div", { className: "error-message", children: error }), pdfFile && (_jsxs(_Fragment, { children: [_jsx(Document, { file: pdfFile, onLoadSuccess: onDocumentLoadSuccess, onLoadError: onDocumentLoadError, loading: _jsx("div", { className: "loading", children: "Loading PDF..." }), error: _jsx("div", { className: "error-message", children: "Failed to load PDF" }), children: null /* We don't need to render pages here */ }), _jsxs("div", { className: "pdf-preview", children: [_jsx("p", { className: "file-name", children: pdfFile.name }), _jsx("button", { onClick: handleGenerateClick, disabled: isGenerating || !numPages || pendingGeneration, className: `generate-button ${isGenerating ? 'generating' : ''}`, children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "loading-spinner" }), "Generating... ", loadingProgress, "%"] })) : ('Generate Contact Sheet') }), isGenerating && (_jsxs("div", { className: "progress-bar", children: [_jsx("div", { className: "progress", style: { width: `${loadingProgress}%` } }), _jsxs("span", { children: [loadingProgress, "%"] })] }))] })] })), showConfirmDialog && (_jsx("div", { className: "confirmation-dialog", children: _jsxs("div", { className: "confirmation-content", children: [_jsx("h4", { children: "Download Confirmation" }), _jsx("p", { children: "The contact sheet will be downloaded to your device. Do you want to proceed?" }), _jsxs("div", { className: "confirmation-buttons", children: [_jsx("button", { className: "confirm-button", onClick: handleConfirmGeneration, children: "Yes, Download" }), _jsx("button", { className: "cancel-button", onClick: handleCancelGeneration, children: "Cancel" })] })] }) })), _jsx("canvas", { ref: canvasRef, style: { display: 'none' } })] }));
};
