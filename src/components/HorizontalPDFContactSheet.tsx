import React, { useState, useRef } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import './PDFContactSheet.css'; // Reusing the existing CSS

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
    try {
      setIsExtracting(true);
      setExtractionProgress(0);
      
      const fileUrl = URL.createObjectURL(file);
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
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error('Error extracting pages:', err);
      setError(`Error extracting pages from ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
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

  const generateContactSheet = async () => {
    if (pdfPages.length === 0) {
      setError('Please upload at least one PDF file');
      return;
    }

    setIsGenerating(true);
    setLoadingProgress(0);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // A4 dimensions in landscape orientation
      const dpiScale = config.resolution / 72;
      const pageWidth = 842 * dpiScale; // A4 width in landscape (297mm)
      const pageHeight = 595 * dpiScale; // A4 height in landscape (210mm)
      
      // Set canvas size
      canvas.width = pageWidth;
      canvas.height = pageHeight;

      // Calculate dimensions for 2 PDFs per page with fixed aspect ratio
      const spacing = config.spacing * dpiScale;
      const thumbWidth = (pageWidth - (spacing * 3)) / 2; // 2 columns with spacing
      
      // Use a fixed aspect ratio (e.g., 1:1.414 which is A4 ratio)
      const aspectRatio = 1.414; // Standard A4 ratio
      const thumbHeight = thumbWidth / aspectRatio; // Divide by aspect ratio since we're in landscape
      
      // Check if the calculated height fits in the page
      const requiredHeight = (thumbHeight + spacing * 2);
      const finalThumbHeight = requiredHeight > pageHeight ? (pageHeight - spacing * 2) : thumbHeight;

      // Calculate total sheets needed (2 PDFs per sheet)
      const totalSheets = Math.ceil(pdfPages.length / 2);

      for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
        // Clear canvas for new sheet with peacock feather theme
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4ade80');  // Light Green-400
        gradient.addColorStop(0.3, '#7dd3fc'); // Sky Blue-300
        gradient.addColorStop(0.7, '#38bdf8'); // Sky Blue-400
        gradient.addColorStop(1, '#22c55e');  // Green-500
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add peacock feather pattern
        const featherCount = 6;  // Fewer, larger feathers for peacock style
        
        for (let i = 0; i < featherCount; i++) {
          // Position feathers around the edges
          let x, y;
          
          if (i < 3) {
            // Left side
            x = canvas.width * 0.1;
            y = canvas.height * (0.25 + i * 0.25);
          } else {
            // Right side
            x = canvas.width * 0.9;
            y = canvas.height * (0.25 + (i-3) * 0.25);
          }
          
          // Draw peacock feather
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((i % 2 === 0 ? -0.2 : 0.2) + (i < 3 ? -0.3 : 0.3));
          
          // Draw feather stem
          const stemLength = 120 * dpiScale;
          ctx.beginPath();
          ctx.moveTo(0, -stemLength/2);
          ctx.lineTo(0, stemLength/2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'; // Sky blue
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw peacock eye
          const eyeRadius = stemLength * 0.4;
          const eyeY = -stemLength * 0.1;
          
          // Draw eye rings
          const rings = 4;
          for (let r = rings; r > 0; r--) {
            const ringRadius = eyeRadius * (r/rings);
            ctx.beginPath();
            ctx.arc(0, eyeY, ringRadius, 0, Math.PI * 2);
            
            // Different colors for the rings
            let alpha;
            switch(r) {
              case 4: ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)'; break; // Outer - light green
              case 3: ctx.strokeStyle = 'rgba(125, 211, 252, 0.2)'; break; // Light sky blue
              case 2: ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)'; break; // Sky blue
              case 1: ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)'; break; // Green
            }
            
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          
          // Draw eye center
          ctx.beginPath();
          ctx.arc(0, eyeY, eyeRadius * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
          
          // Draw feather barbs
          const barbCount = 20;
          const maxBarbLength = stemLength * 0.6;
          
          for (let j = 0; j < barbCount; j++) {
            const barbY = -stemLength/2 + (j * stemLength/barbCount);
            
            // Skip barbs near the eye
            if (Math.abs(barbY - eyeY) < eyeRadius * 0.8) continue;
            
            // Calculate barb length - shorter near ends, longer in middle
            const barbPosition = j / barbCount;
            const barbLength = maxBarbLength * Math.sin(barbPosition * Math.PI);
            
            // Right side barbs
            ctx.beginPath();
            ctx.moveTo(0, barbY);
            ctx.bezierCurveTo(
              barbLength/3, barbY + stemLength/30,
              barbLength/2, barbY + stemLength/20,
              barbLength, barbY
            );
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Left side barbs
            ctx.beginPath();
            ctx.moveTo(0, barbY);
            ctx.bezierCurveTo(
              -barbLength/3, barbY + stemLength/30,
              -barbLength/2, barbY + stemLength/20,
              -barbLength, barbY
            );
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          
          ctx.restore();
        }

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
            
            // Calculate scale to fit
            const scale = Math.min(
              thumbWidth / viewport.width,
              finalThumbHeight / viewport.height
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

            // Center the PDF within its allocated space if it doesn't fill the entire area
            const pdfWidth = Math.min(thumbWidth, scaledViewport.width);
            const pdfHeight = Math.min(finalThumbHeight, scaledViewport.height);
            const xOffset = (thumbWidth - pdfWidth) / 2;
            const yOffset = (finalThumbHeight - pdfHeight) / 2;
            
            // Draw white background for the PDF thumbnail
            ctx.fillStyle = 'white';
            ctx.fillRect(x + xOffset - 5, y + yOffset - 5, pdfWidth + 10, pdfHeight + 10);
            
            // Draw the PDF on top of the white background
            ctx.drawImage(tempCanvas, x + xOffset, y + yOffset, pdfWidth, pdfHeight);
            
            // Add filename below the PDF
            ctx.font = '12px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(pageItem.name, x + xOffset, y + yOffset + pdfHeight + 15);

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
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Error generating contact sheet');
    } finally {
      setIsGenerating(false);
      setLoadingProgress(100);
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