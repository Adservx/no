import { useState, useEffect } from 'react';
import { uploadToR2 } from '../utils/r2Storage';
import { supabase, pdfHelpers } from '../utils/supabase';
import '../styles/AdminFileUpload.css';

interface AdminFileUploadProps {
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export const AdminFileUpload = ({ onClose, onUploadSuccess }: AdminFileUploadProps) => {
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [existingSubjects, setExistingSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isCustomSubject, setIsCustomSubject] = useState(false);

  const semesters = [
    'First Semester',
    'Second Semester',
    'Third Semester',
    'Fourth Semester',
    'Fifth Semester',
    'Sixth Semester'
  ];

  // Fetch existing subjects when semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!semester) {
        setExistingSubjects([]);
        setIsCustomSubject(false);
        setSubject('');
        return;
      }

      setLoadingSubjects(true);
      const { data, error } = await pdfHelpers.getFilesBySemester(semester);
      
      if (!error && data) {
        // Extract unique subjects
        const subjects = [...new Set(data.map((file: any) => file.subject as string))];
        setExistingSubjects(subjects as string[]);
        // If no existing subjects, automatically enable custom input
        if (subjects.length === 0) {
          setIsCustomSubject(true);
        } else {
          setIsCustomSubject(false);
          setSubject('');
        }
      } else {
        setExistingSubjects([]);
        setIsCustomSubject(true);
      }
      setLoadingSubjects(false);
    };

    fetchSubjects();
  }, [semester]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const fileArray = Array.from(selectedFiles);
      
      // Check if all files are PDFs
      const nonPdfFiles = fileArray.filter(file => file.type !== 'application/pdf');
      if (nonPdfFiles.length > 0) {
        setError('Please select only PDF files');
        return;
      }
      
      setFiles(fileArray);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0 || !semester || !subject) {
      setError('Please fill all fields and select at least one file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setTotalProgress(0);
    setUploadedCount(0);
    setCurrentFileIndex(0);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const semesterFolder = semester.toLowerCase().replace(' ', '-');
      let successCount = 0;
      let failedFiles: string[] = [];

      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileIndex(i + 1);
        
        // Use original filename without .pdf extension
        const fileName = file.name.replace('.pdf', '');
        const r2Path = `${semesterFolder}/${subject}/${fileName}.pdf`;

        try {
          // Upload to R2
          const result = await uploadToR2(file, r2Path, (progressPercent) => {
            // Calculate total progress across all files
            const fileProgress = progressPercent / files.length;
            const previousFilesProgress = (i / files.length) * 100;
            setTotalProgress(Math.round(previousFilesProgress + fileProgress));
          });

          if (result.success) {
            // Save file metadata to database
            const { error: dbError } = await supabase
              .from('pdf_files')
              .insert({
                semester: semester,
                subject: subject,
                file_name: fileName,
                file_path: r2Path,
                file_size: file.size,
                uploaded_by: userData.user?.id
              });

            if (dbError) {
              console.error('Error saving to database:', dbError);
              failedFiles.push(file.name);
            } else {
              successCount++;
              setUploadedCount(successCount);
            }
          } else {
            failedFiles.push(file.name);
          }
        } catch (err) {
          console.error('Error uploading file:', err);
          failedFiles.push(file.name);
        }
      }

      // Show results
      if (successCount === files.length) {
        setSuccess(`Successfully uploaded all ${successCount} files!`);
      } else if (successCount > 0) {
        setSuccess(`Uploaded ${successCount} of ${files.length} files`);
        if (failedFiles.length > 0) {
          setError(`Failed to upload: ${failedFiles.join(', ')}`);
        }
      } else {
        setError('All uploads failed');
      }

      // Notify parent component to refresh
      if (onUploadSuccess && successCount > 0) {
        onUploadSuccess();
      }

      // Reset form after delay
      setTimeout(() => {
        setFiles([]);
        setTotalProgress(0);
        setUploadedCount(0);
        setCurrentFileIndex(0);
        if (successCount === files.length) {
          setSuccess(null);
        }
      }, 3000);

    } catch (err) {
      setError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-upload-overlay" onClick={onClose}>
      <div className="admin-upload-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="admin-upload-header">
          <h2>📤 Admin File Upload</h2>
          <p>Upload PDF files to R2 storage</p>
        </div>

        <form onSubmit={handleUpload} className="admin-upload-form">
          <div className="form-group">
            <label htmlFor="semester">Semester *</label>
            <select
              id="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
              disabled={uploading}
            >
              <option value="">Select Semester</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject Name *</label>
            {loadingSubjects ? (
              <div className="loading-subjects">
                <small className="loading-text">Loading subjects...</small>
              </div>
            ) : existingSubjects.length > 0 && !isCustomSubject ? (
              <>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomSubject(true);
                      setSubject('');
                    } else {
                      setSubject(e.target.value);
                    }
                  }}
                  required
                  disabled={uploading}
                >
                  <option value="">Select Existing Subject</option>
                  {existingSubjects.map((subj, index) => (
                    <option key={index} value={subj}>{subj}</option>
                  ))}
                  <option value="__custom__">➕ Add New Subject</option>
                </select>
                <small className="info-text">
                  📚 {existingSubjects.length} existing subject{existingSubjects.length > 1 ? 's' : ''} available
                </small>
              </>
            ) : (
              <>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Communication Nepali"
                  required
                  disabled={uploading || !semester}
                />
                {existingSubjects.length > 0 && (
                  <button
                    type="button"
                    className="switch-to-select-button"
                    onClick={() => {
                      setIsCustomSubject(false);
                      setSubject('');
                    }}
                  >
                    ← Select from existing subjects
                  </button>
                )}
                {semester && existingSubjects.length === 0 && (
                  <small className="info-text">
                    ℹ️ No subjects yet for this semester. You'll create the first one!
                  </small>
                )}
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="files">PDF Files *</label>
            <input
              type="file"
              id="files"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              required
              disabled={uploading}
            />
            <small>You can select multiple PDF files at once</small>
            {files.length > 0 && (
              <div className="files-list">
                <p className="files-count">📄 {files.length} file{files.length > 1 ? 's' : ''} selected</p>
                <div className="selected-files">
                  {files.map((file, index) => (
                    <div key={index} className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {uploading && (
            <div className="upload-progress">
              <p className="upload-status">
                Uploading file {currentFileIndex} of {files.length}... ({uploadedCount} completed)
              </p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <p>{totalProgress}% total progress</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="upload-button"
              disabled={uploading || files.length === 0}
            >
              {uploading ? `Uploading... (${uploadedCount}/${files.length})` : 'Upload Files'}
            </button>
          </div>
        </form>

        <div className="upload-info">
          <h4>📋 Upload Guidelines</h4>
          <ul>
            <li>Only PDF files are allowed</li>
            <li>Files will be stored in: <code>semester/subject/filename.pdf</code></li>
            <li>You can upload multiple PDF files at once</li>
            <li>File names will be taken from the original PDF filenames</li>
            <li>Subject names should match existing subjects for consistency</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
