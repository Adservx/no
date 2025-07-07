import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import './PDFContactSheet.css';
import { notifyServiceWorkerDownload, notifyServiceWorkerComplete, updateServiceWorkerProgress } from '../utils/notificationUtils';
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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const buttonRef = useRef(null);
    useEffect(() => {
        // Create sparkles when component mounts
        if (buttonRef.current) {
            const sparkleInterval = setInterval(() => {
                createRandomSparkle();
            }, 1000);
            
            return () => {
                clearInterval(sparkleInterval);
                // Cleanup on unmount
                if (pdfFile) {
                    URL.revokeObjectURL(URL.createObjectURL(pdfFile));
                }
            };
        }
        
        return () => {
            // Cleanup on unmount
            if (pdfFile) {
                URL.revokeObjectURL(URL.createObjectURL(pdfFile));
            }
        };
    }, [pdfFile, buttonRef.current]);
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
    const handleGenerateClick = (event) => {
        // Create particle burst effect on click
        createParticleBurst(event);
        
        // Play sound effect
        playButtonSound();
        
        // Show confirmation dialog
        setShowConfirmDialog(true);
        setPendingGeneration(true);
    };
    
    // Function to create a particle burst effect
    const createParticleBurst = (event) => {
        if (!event || !event.currentTarget) return;
        
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        
        // Create a container for the particles if it doesn't exist
        let particleContainer = document.querySelector('.particle-container');
        if (!particleContainer) {
            particleContainer = document.createElement('div');
            particleContainer.className = 'particle-container';
            document.body.appendChild(particleContainer);
        }
        
        // Create particles
        const particleCount = 30;
        const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f472b6', '#22d3ee'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position around click point
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 80 + 20;
            const x = buttonCenterX + Math.cos(angle) * distance;
            const y = buttonCenterY + Math.sin(angle) * distance;
            
            // Set random color
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.backgroundColor = randomColor;
            
            // Set random size
            const size = Math.random() * 10 + 5;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Set initial position
            particle.style.left = `${buttonCenterX}px`;
            particle.style.top = `${buttonCenterY}px`;
            
            // Set custom properties for animation
            particle.style.setProperty('--x', `${Math.cos(angle) * (distance * 3)}px`);
            particle.style.setProperty('--y', `${Math.sin(angle) * (distance * 3)}px`);
            
            // Add to container
            particleContainer.appendChild(particle);
            
            // Animate and remove after animation completes
            particle.style.animation = `particleDrift ${Math.random() * 1 + 0.5}s ease-out forwards`;
            setTimeout(() => {
                particle.remove();
            }, 1500);
        }
    };
    
    // Function to play button sound effect
    const playButtonSound = () => {
        try {
            const audio = new Audio();
            audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbsAb29vb29vb29vb29vb29vb29vb29vb29vbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm4AAABMYXZjNTguMTM0LjEwMQAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxMQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
            console.log('Sound effect failed to play:', error);
        }
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
        // Generate a unique ID for this notification for service worker
        const notificationId = 'pdf-contact-sheet-' + new Date().getTime();
        // Send notification to service worker if in PWA mode
        if (type === 'downloading' && progress !== undefined) {
            updateServiceWorkerProgress(progress, 'Generating PDF', message, notificationId);
        }
        else if (type === 'success') {
            notifyServiceWorkerComplete('PDF Generated', message, notificationId);
        }
        else if (type === 'error') {
            notifyServiceWorkerDownload('Error', message, notificationId);
        }
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
    // Function to create random sparkles around the button
    const createRandomSparkle = () => {
        if (!buttonRef.current) return;
        
        const button = buttonRef.current;
        const buttonRect = button.getBoundingClientRect();
        
        // Create sparkle container if it doesn't exist
        let sparkleContainer = document.querySelector('.sparkle-container');
        if (!sparkleContainer) {
            sparkleContainer = document.createElement('div');
            sparkleContainer.className = 'particle-container';
            document.body.appendChild(sparkleContainer);
        }
        
        // Create a new sparkle
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        
        // Set random position around the button (with a bit of margin)
        const margin = 40;
        const posX = buttonRect.left - margin + Math.random() * (buttonRect.width + margin * 2);
        const posY = buttonRect.top - margin + Math.random() * (buttonRect.height + margin * 2);
        
        sparkle.style.left = `${posX}px`;
        sparkle.style.top = `${posY}px`;
        
        // Set random size
        const size = Math.random() * 15 + 10;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;
        
        // Set random animation duration
        const duration = Math.random() * 2 + 1;
        sparkle.style.animation = `sparkle ${duration}s ease-in-out forwards`;
        
        // Add to container
        sparkleContainer.appendChild(sparkle);
        
        // Remove after animation completes
        setTimeout(() => {
            sparkle.remove();
        }, duration * 1000);
    };
    // Function to handle mouse move for magnetic effect
    const handleButtonMouseMove = (event) => {
        if (!buttonRef.current) return;
        
        const button = buttonRef.current;
        const buttonRect = button.getBoundingClientRect();
        
        // Randomly create sparkles during mouse movement (20% chance)
        if (Math.random() < 0.2) {
            createRandomSparkle();
        }
        
        // Calculate mouse position relative to button center
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        const mouseX = event.clientX - buttonCenterX;
        const mouseY = event.clientY - buttonCenterY;
        
        // Calculate distance from center (normalized)
        const distanceX = mouseX / (buttonRect.width / 2);
        const distanceY = mouseY / (buttonRect.height / 2);
        
        // Calculate transform amount (maximum 10px movement)
        const transformX = distanceX * 10;
        const transformY = distanceY * 10;
        
        // Apply transform
        button.style.transform = `translate3d(${transformX}px, ${transformY}px, 30px) rotateX(${-distanceY * 10}deg) rotateY(${distanceX * 10}deg)`;
        
        // Update mouse position for glow effect
        setMousePosition({ x: distanceX, y: distanceY });
        
        // Add glow effect
        const glowX = 50 + distanceX * 40; // 10-90% range
        const glowY = 50 + distanceY * 40; // 10-90% range
        
        // Create radial gradient for glow
        button.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6, #06b6d4, #3b82f6)`;
        button.style.backgroundSize = '200% 200%, 400% 400%';
    };
    
    // Function to handle mouse leave
    const handleButtonMouseLeave = () => {
        if (!buttonRef.current) return;
        
        const button = buttonRef.current;
        
        // Reset transform and background
        button.style.transform = '';
        button.style.background = '';
        
        // Reset mouse position
        setMousePosition({ x: 0, y: 0 });
    };
    return (_jsxs("div", { className: "pdf-contact-sheet", children: [_jsxs("div", { className: "upload-section", children: [_jsx("h3", { className: "upload-section-title", children: "Upload PDF" }), _jsxs("div", { ...getRootProps(), className: "dropzone", children: [_jsx("input", { ...getInputProps() }), _jsx("div", { className: "dropzone-icon", children: "\uD83D\uDCC4" }), _jsx("p", { children: "Drag & drop a PDF file here" })] }), _jsx("button", { className: "pdf-select-button", onClick: openFileDialog, children: "Select PDF File" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "application/pdf", onChange: handleFileSelect, style: { display: 'none' } })] }), error && _jsx("div", { className: "error-message", children: error }), pdfFile && (_jsxs(_Fragment, { children: [_jsx(Document, { file: pdfFile, onLoadSuccess: onDocumentLoadSuccess, onLoadError: onDocumentLoadError, loading: _jsx("div", { className: "loading", children: "Loading PDF..." }), error: _jsx("div", { className: "error-message", children: "Failed to load PDF" }), children: null /* We don't need to render pages here */ }), _jsxs("div", { className: "pdf-preview", children: [_jsx("p", { className: "file-name", children: pdfFile.name }), _jsx("button", { 
        ref: buttonRef,
        onClick: handleGenerateClick, 
        onMouseMove: handleButtonMouseMove,
        onMouseLeave: handleButtonMouseLeave,
        disabled: isGenerating || !numPages || pendingGeneration, 
        className: `generate-button ${isGenerating ? 'generating' : ''}`, 
        children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "loading-spinner" }), _jsx("span", { children: `Generating... ${loadingProgress}%` })] })) : (_jsx("span", { children: 'Generate Contact Sheet' })) 
    }), isGenerating && (_jsxs("div", { className: "progress-bar", children: [_jsx("div", { className: "progress", style: { width: `${loadingProgress}%` } }), _jsxs("span", { children: [loadingProgress, "%"] })] }))] })] }), showConfirmDialog && (_jsx("div", { className: "confirmation-dialog", children: _jsxs("div", { className: "confirmation-content", children: [_jsx("h4", { children: "Download Confirmation" }), _jsx("p", { children: "The contact sheet will be downloaded to your device. Do you want to proceed?" }), _jsxs("div", { className: "confirmation-buttons", children: [_jsx("button", { className: "confirm-button", onClick: handleConfirmGeneration, children: "Yes, Download" }), _jsx("button", { className: "cancel-button", onClick: handleCancelGeneration, children: "Cancel" })] })] }) })), _jsx("canvas", { ref: canvasRef, style: { display: 'none' } })] }));
};