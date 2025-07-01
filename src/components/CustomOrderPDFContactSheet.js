import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import { jsPDF } from 'jspdf';
import './PDFContactSheet.css';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const CustomOrderPDFContactSheet = ({ config }) => {
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
    // Helper function to visualize page arrangement as a grid
    const visualizeAsGrid = (pages, cols, rows) => {
        console.log('Grid visualization:');
        for (let r = 0; r < rows; r++) {
            let rowStr = '';
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                if (idx < pages.length) {
                    rowStr += pages[idx].toString().padStart(2, ' ') + ' ';
                }
                else {
                    rowStr += '-- ';
                }
            }
            console.log(rowStr);
        }
    };
    // Custom ordering function that creates the alternating pattern
    const getCustomPageOrder = (totalPages, columns, rows) => {
        console.log(`Creating page order for ${totalPages} pages with ${columns}x${rows} grid`);
        const pagesPerSheet = columns * rows;
        const result = [];
        // For the specific pattern requested:
        // Sheet 1: [1,3,5,7,9,11,13,15,17]
        // Sheet 2: [6,4,2,12,10,8,18,16,14]
        // And so on...
        // Calculate how many sheets we need for odd and even pages
        const oddSheetCount = Math.ceil(Math.ceil(totalPages / 2) / pagesPerSheet);
        const evenSheetCount = Math.ceil(Math.floor(totalPages / 2) / pagesPerSheet);
        const maxSheetCount = Math.max(oddSheetCount, evenSheetCount);
        // Create sheets in alternating order (first odd, then even)
        for (let sheetIndex = 0; sheetIndex < maxSheetCount; sheetIndex++) {
            // First create the odd pages sheet (if needed)
            if (sheetIndex < oddSheetCount) {
                const oddSheetPages = [];
                // Calculate the starting page number for this sheet
                const startingOddPage = sheetIndex * pagesPerSheet * 2 + 1;
                // Add odd pages to this sheet
                for (let i = 0; i < pagesPerSheet; i++) {
                    const pageNum = startingOddPage + i * 2;
                    if (pageNum <= totalPages) {
                        oddSheetPages.push(pageNum);
                    }
                }
                if (oddSheetPages.length > 0) {
                    console.log(`Odd pages sheet ${sheetIndex + 1}: ${oddSheetPages}`);
                    visualizeAsGrid(oddSheetPages, columns, rows);
                    result.push(oddSheetPages);
                }
            }
            // Then create the even pages sheet (if needed)
            if (sheetIndex < evenSheetCount) {
                const evenSheetPages = [];
                // Create a temporary grid to help visualize the ordering
                const tempGrid = Array(rows).fill(0).map(() => Array(columns).fill(0));
                // Fill the grid with even pages (2, 4, 6, ...) in ascending order
                let pageIndex = 0;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < columns; c++) {
                        // Calculate the even page number
                        const baseEvenPage = sheetIndex * pagesPerSheet * 2 + 2;
                        const pageNum = baseEvenPage + pageIndex * 2;
                        if (pageNum <= totalPages) {
                            tempGrid[r][c] = pageNum;
                        }
                        pageIndex++;
                    }
                }
                // Now read the grid in the required order (right-to-left within each row)
                for (let r = 0; r < rows; r++) {
                    for (let c = columns - 1; c >= 0; c--) {
                        if (tempGrid[r][c] > 0) {
                            evenSheetPages.push(tempGrid[r][c]);
                        }
                    }
                }
                if (evenSheetPages.length > 0) {
                    console.log(`Even pages sheet ${sheetIndex + 1}: ${evenSheetPages}`);
                    visualizeAsGrid(evenSheetPages, columns, rows);
                    result.push(evenSheetPages);
                }
            }
        }
        console.log(`Final page order:`, result);
        // Verify the output with some examples
        if (columns === 3 && rows === 3 && totalPages >= 18) {
            // These are the exact expected outputs for a 3x3 grid
            const expected1 = [1, 3, 5, 7, 9, 11, 13, 15, 17];
            const expected2 = [6, 4, 2, 12, 10, 8, 18, 16, 14];
            console.log('Verification for 3x3 grid:');
            console.log(`Sheet 1 expected: ${expected1}`);
            console.log(`Sheet 1 actual: ${result[0]}`);
            console.log('Expected grid layout for Sheet 1:');
            visualizeAsGrid(expected1, columns, rows);
            console.log('Actual grid layout for Sheet 1:');
            visualizeAsGrid(result[0], columns, rows);
            console.log(`Sheet 2 expected: ${expected2}`);
            console.log(`Sheet 2 actual: ${result[1]}`);
            console.log('Expected grid layout for Sheet 2:');
            visualizeAsGrid(expected2, columns, rows);
            console.log('Actual grid layout for Sheet 2:');
            visualizeAsGrid(result[1], columns, rows);
            // Check if the pages match the expected pattern
            const sheet1Correct = JSON.stringify(result[0]) === JSON.stringify(expected1);
            const sheet2Correct = JSON.stringify(result[1]) === JSON.stringify(expected2);
            console.log(`Sheet 1 correct: ${sheet1Correct}`);
            console.log(`Sheet 2 correct: ${sheet2Correct}`);
        }
        return result;
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
        let notification = document.querySelector('.notification.custom-order-pdf');
        if (!notification || type === 'success' || type === 'error') {
            // Create new notification
            notification = document.createElement('div');
            notification.className = `notification ${type} custom-order-pdf`;
            // Add notification content based on type
            const icon = type === 'downloading' ? '⬇️' : type === 'success' ? '✅' : '❌';
            const title = type === 'downloading' ? 'Generating Custom PDF' : type === 'success' ? 'Download Complete' : 'Error';
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
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
            // Auto remove after some time for success/error
            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    notification.classList.add('closing');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
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
            // Define standard page sizes in points (72 dpi)
            let pageWidth, pageHeight;
            switch (config.pageSize) {
                case 'A3':
                    pageWidth = 842; // A3 width in portrait (297mm)
                    pageHeight = 1191; // A3 height in portrait (420mm)
                    break;
                case 'Letter':
                    pageWidth = 612; // Letter width in portrait (8.5in)
                    pageHeight = 792; // Letter height in portrait (11in)
                    break;
                case 'A4':
                default:
                    pageWidth = 595; // A4 width in portrait (210mm)
                    pageHeight = 842; // A4 height in portrait (297mm)
                    break;
            }
            // Apply DPI scaling for rendering
            const dpiScale = config.resolution / 72;
            const renderWidth = pageWidth * dpiScale;
            const renderHeight = pageHeight * dpiScale;
            // Calculate the available space for thumbnails
            const horizontalSpacing = config.spacing * (config.columns + 1) * dpiScale;
            const verticalSpacing = config.spacing * (config.rows + 1) * dpiScale;
            // Calculate thumbnail width based on available space
            const thumbWidth = (renderWidth - horizontalSpacing) / config.columns;
            // Use a fixed aspect ratio (e.g., 1:1.414 which is A4 ratio)
            const aspectRatio = 1.414; // Standard A4 ratio
            const thumbHeight = thumbWidth * aspectRatio;
            // Adjust canvas height if needed to accommodate the thumbnails with fixed ratio
            const calculatedPageHeight = (thumbHeight * config.rows) + verticalSpacing;
            // Set canvas size
            canvas.width = renderWidth;
            canvas.height = calculatedPageHeight > renderHeight ? calculatedPageHeight : renderHeight;
            // Get custom page ordering
            const customPageOrder = getCustomPageOrder(numPages, config.columns, config.rows);
            const totalSheets = customPageOrder.length;
            // Load PDF
            const pdfUrl = URL.createObjectURL(pdfFile);
            const loadingTask = pdfjs.getDocument(pdfUrl);
            const loadedPdf = await loadingTask.promise;
            // Add this at the beginning of generateContactSheet()
            showDownloadNotification('downloading', 'Starting to generate custom contact sheet...', 0);
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
                // Draw feather pattern (same as PDFContactSheet)
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
                // Get pages for this sheet
                const sheetPages = customPageOrder[sheetIndex];
                // Draw pages for current sheet
                for (let i = 0; i < sheetPages.length; i++) {
                    const pageNumber = sheetPages[i];
                    // Calculate position (row, col)
                    const col = i % config.columns;
                    const row = Math.floor(i / config.columns);
                    const progress = (((sheetIndex * config.columns * config.rows) + i) / numPages) * 100;
                    setLoadingProgress(Math.round(progress));
                    try {
                        const page = await loadedPdf.getPage(pageNumber);
                        const viewport = page.getViewport({ scale: 1.0 });
                        // Calculate scale to fit the thumbnail area properly
                        const scale = Math.min(thumbWidth / viewport.width, thumbHeight / viewport.height);
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
                        // Add page number label
                        ctx.font = '12px Arial';
                        ctx.fillStyle = 'black';
                        ctx.fillText(`Page ${pageNumber}`, x + xOffset, y + yOffset + pdfHeight + 15);
                    }
                    catch (err) {
                        console.error(`Error rendering page ${pageNumber}:`, err);
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
                    unit: 'pt',
                    format: pdfFormat
                });
                // Use higher quality for the output PDF
                const imageData = canvas.toDataURL('image/jpeg', 0.95);
                // Calculate dimensions to fit the PDF page properly
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                // Add image with proper scaling to fit the page
                pdf.addImage(imageData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                // Save with sheet number in filename
                const filename = `custom-order-sheet-${sheetIndex + 1}-${pdfFile.name}`;
                pdf.save(filename);
                // When the PDF is complete:
                showDownloadNotification('success', 'Custom contact sheet has been downloaded successfully!');
            }
            // Cleanup
            URL.revokeObjectURL(pdfUrl);
        }
        catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'Error generating contact sheet');
            // In case of errors:
            showDownloadNotification('error', `Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        finally {
            setIsGenerating(false);
            setLoadingProgress(100);
        }
    };
    return (_jsxs("div", { className: "pdf-contact-sheet", children: [_jsxs("div", { className: "upload-section", children: [_jsx("h3", { className: "upload-section-title", children: "Upload PDF" }), _jsxs("div", { ...getRootProps(), className: "dropzone", children: [_jsx("input", { ...getInputProps() }), _jsx("div", { className: "dropzone-icon", children: "\uD83D\uDCC4" }), _jsx("p", { children: "Drag & drop a PDF file here" })] }), _jsx("button", { className: "pdf-select-button", onClick: openFileDialog, children: "Select PDF File" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "application/pdf", onChange: handleFileSelect, style: { display: 'none' } })] }), error && _jsx("div", { className: "error-message", children: error }), pdfFile && (_jsxs(_Fragment, { children: [_jsx(Document, { file: pdfFile, onLoadSuccess: onDocumentLoadSuccess, onLoadError: onDocumentLoadError, loading: _jsx("div", { className: "loading", children: "Loading PDF..." }), error: _jsx("div", { className: "error-message", children: "Failed to load PDF" }), children: null /* We don't need to render pages here */ }), _jsxs("div", { className: "pdf-preview", children: [_jsx("p", { className: "file-name", children: pdfFile.name }), _jsxs("div", { className: "custom-order-info", children: [_jsx("p", { children: "This will create contact sheets with the following page ordering pattern:" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "First set of sheets:" }), " Odd pages in ascending order"] }), _jsxs("li", { children: [_jsx("strong", { children: "Second set of sheets:" }), " Even pages in descending order within each row"] })] }), _jsx("p", { children: "For a 3\u00D73 grid example:" }), _jsxs("ul", { children: [_jsx("li", { children: "Sheet 1: Pages 1, 3, 5, 7, 9, 11, 13, 15, 17" }), _jsx("li", { children: "Sheet 2: Pages 6, 4, 2, 12, 10, 8, 18, 16, 14" }), _jsx("li", { children: "Sheet 3: Pages 19, 21, 23, 25, 27, 29, 31, 33, 35" }), _jsx("li", { children: "Sheet 4: Pages 24, 22, 20, 30, 28, 26, 36, 34, 32" }), _jsx("li", { children: "And so on..." })] })] }), _jsx("button", { onClick: handleGenerateClick, disabled: isGenerating || !numPages || pendingGeneration, className: `generate-button ${isGenerating ? 'generating' : ''}`, children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "loading-spinner" }), "Generating... ", loadingProgress, "%"] })) : ('Generate Custom Order Sheet') }), isGenerating && (_jsxs("div", { className: "progress-bar", children: [_jsx("div", { className: "progress", style: { width: `${loadingProgress}%` } }), _jsxs("span", { children: [loadingProgress, "%"] })] }))] })] })), showConfirmDialog && (_jsx("div", { className: "confirmation-dialog", children: _jsxs("div", { className: "confirmation-content", children: [_jsx("h4", { children: "Download Confirmation" }), _jsx("p", { children: "The custom order contact sheet will be downloaded to your device. Do you want to proceed?" }), _jsxs("div", { className: "confirmation-buttons", children: [_jsx("button", { className: "confirm-button", onClick: handleConfirmGeneration, children: "Yes, Download" }), _jsx("button", { className: "cancel-button", onClick: handleCancelGeneration, children: "Cancel" })] })] }) })), _jsx("canvas", { ref: canvasRef, style: { display: 'none' } })] }));
};
