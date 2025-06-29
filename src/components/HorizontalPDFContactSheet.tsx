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

      // Calculate dimensions for 2 PDFs per page
      const spacing = config.spacing * dpiScale;
      const thumbWidth = (pageWidth - (spacing * 3)) / 2; // 2 columns with spacing
      const thumbHeight = pageHeight - (spacing * 2); // Full height minus spacing

      // Calculate total sheets needed (2 PDFs per sheet)
      const totalSheets = Math.ceil(pdfPages.length / 2);

      for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
        // Clear canvas for new sheet
        ctx.fillStyle = 'white';
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
            
            // Calculate scale to fit
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
              background: 'white',
              intent: 'print'
            }).promise;

            // Position the PDF on the sheet (left or right)
            const x = spacing + i * (thumbWidth + spacing);
            const y = spacing;

            // Center the PDF vertically if needed
            const yOffset = (thumbHeight - scaledViewport.height) / 2;
            ctx.drawImage(tempCanvas, x, y + yOffset, scaledViewport.width, scaledViewport.height);
            
            // Add filename below the PDF
            ctx.font = '12px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(pageItem.name, x, y + yOffset + scaledViewport.height + 15);

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
      <h2>Two n T</h2>
      
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
          
          <button
            className="generate-button"
            onClick={generateContactSheet}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Horizontal Contact Sheet'}
          </button>
          
          {isGenerating && (
            <div className="progress-bar">
              <div className="progress" style={{ width: `${loadingProgress}%` }}></div>
              <span>{loadingProgress}%</span>
            </div>
          )}
        </>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}; 