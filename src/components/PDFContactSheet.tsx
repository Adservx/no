import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import './PDFContactSheet.css';

interface PDFContactSheetProps {
  config: {
    columns: number;
    rows: number;
    spacing: number;
    pageSize: string;
    resolution: number;
    layoutDirection: 'across' | 'down';
  };
}

export const PDFContactSheet: React.FC<PDFContactSheetProps> = ({ config }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    onDrop: (acceptedFiles) => {
      setError(null);
      setPdfFile(acceptedFiles[0]);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setError(null);
      setPdfFile(file);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setError(null);
    setNumPages(numPages);
    console.log(`PDF loaded with ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError(`Error loading PDF: ${error.message}`);
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
      if (!ctx) throw new Error('Could not get canvas context');

      // Calculate dimensions with DPI
      const dpiScale = config.resolution / 72; // Convert from points to pixels
      const pageWidth = 595 * dpiScale; // A4 width
      const pageHeight = 842 * dpiScale; // A4 height
      const thumbWidth = (pageWidth - (config.spacing * (config.columns + 1))) / config.columns;
      const thumbHeight = (pageHeight - (config.spacing * (config.rows + 1))) / config.rows;

      // Set high-resolution canvas size
      canvas.width = pageWidth;
      canvas.height = pageHeight;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load PDF with proper error handling
      const pdfUrl = URL.createObjectURL(pdfFile);
      const loadingTask = pdfjs.getDocument(pdfUrl);
      
      loadingTask.onProgress = (data: { loaded: number; total: number }) => {
        if (data.total > 0) {
          const progress = (data.loaded / data.total) * 30; // First 30%
          setLoadingProgress(Math.round(progress));
        }
      };

      const loadedPdf = await loadingTask.promise;
      let currentPage = 1;
      const totalCells = Math.min(config.rows * config.columns, numPages);

      // Function to calculate grid position based on layout direction
      const getGridPosition = (index: number) => {
        if (config.layoutDirection === 'across') {
          // Across first: fill each row from left to right
          const row = Math.floor(index / config.columns);
          const col = index % config.columns;
          return { row, col };
        } else {
          // Down first: fill each column from top to bottom
          const row = index % config.rows;
          const col = Math.floor(index / config.rows);
          if (col >= config.columns) return null; // Prevent overflow
          return { row, col };
        }
      };

      // Draw pages with better progress tracking
      for (let i = 0; i < totalCells; i++) {
        const position = getGridPosition(i);
        if (!position) continue;
        
        const { row, col } = position;
        const progress = 30 + Math.round((currentPage / totalCells) * 70); // Remaining 70%
        setLoadingProgress(progress);

        try {
          const page = await loadedPdf.getPage(currentPage);
          const viewport = page.getViewport({ scale: 1.0 });
          const scale = Math.min(
            thumbWidth / viewport.width,
            thumbHeight / viewport.height
          ) * 1.5;

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

          const x = config.spacing * dpiScale + col * (thumbWidth + config.spacing * dpiScale);
          const y = config.spacing * dpiScale + row * (thumbHeight + config.spacing * dpiScale);

          ctx.drawImage(tempCanvas, x, y, thumbWidth, thumbHeight);
          currentPage++;
        } catch (err) {
          console.error(`Error rendering page ${currentPage}:`, err);
        }
      }

      // Export as PDF instead of PNG
      setLoadingProgress(95);
      const pdf = new jsPDF({
        orientation: pageHeight > pageWidth ? 'portrait' : 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      // Add the canvas as an image to the PDF
      const imageData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imageData, 'JPEG', 0, 0, canvas.width, canvas.height);

      // Save the PDF
      setLoadingProgress(100);
      pdf.save(`contact-sheet-${pdfFile.name}`);
      
      // Cleanup
      URL.revokeObjectURL(pdfUrl);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Error generating contact sheet');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="pdf-contact-sheet">
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag & drop a PDF file here</p>
      </div>
      
      <button className="pdf-select-button" onClick={openFileDialog}>
        📄 Select PDF File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {error && <div className="error-message">{error}</div>}
      
      {pdfFile && (
        <>
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => setError('Error loading PDF: ' + error.message)}
            loading={<div className="loading">Loading PDF...</div>}
            error={<div className="error-message">Failed to load PDF</div>}
          >
            {null /* We don't need to render pages here */}
          </Document>
          
          <div className="pdf-preview">
            <p className="file-name">{pdfFile.name}</p>
            <button 
              onClick={generateContactSheet} 
              disabled={isGenerating || !numPages}
              className={isGenerating ? 'generating' : ''}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner"></span>
                  Generating... {loadingProgress}%
                </>
              ) : (
                'Generate Contact Sheet'
              )}
            </button>
          </div>
        </>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};
