import { useState, useEffect } from 'react';
import { supabase, pdfHelpers } from '../utils/supabase';
import { uploadFileWithMetadata } from '../utils/r2Storage';
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

      // Allowed file types
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/msword', // .doc
        'application/vnd.ms-excel', // .xls
        'application/vnd.ms-powerpoint', // .ppt
        'text/plain', // .txt
      ];

      // Check if all files are allowed types
      const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Allowed: PDF, Images (JPG, PNG, WebP, GIF), Documents (DOCX, XLSX, PPTX, DOC, XLS, PPT), Text files`);
        return;
      }

      setFiles(fileArray);
      setError(null);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
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
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('You must be logged in to upload files');
        setUploading(false);
        return;
      }

      const semesterFolder = semester.toLowerCase().replace(' ', '-');
      let successCount = 0;
      let failedFiles: string[] = [];

      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileIndex(i + 1);

        // Use original filename with its extension
        const fileName = file.name;
        const r2Path = `${semesterFolder}/${subject}/${fileName}`;

        try {
          // Update progress for reading file
          const previousFilesProgress = (i / files.length) * 100;
          setTotalProgress(Math.round(previousFilesProgress + 10));

          let uploadSuccess = false;

          // Try API first (works in production with Vercel)
          try {
            const fileData = await fileToBase64(file);
            setTotalProgress(Math.round(previousFilesProgress + 30));

            const response = await fetch('/api/upload-file', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                fileName: fileName,
                filePath: r2Path,
                fileData: fileData,
                fileSize: file.size,
                contentType: file.type,
                semester: semester,
                subject: subject,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                uploadSuccess = true;
              }
            }
          } catch {
            // API not available, will use direct upload
          }

          // Fallback: Direct upload to R2 + Supabase metadata
          if (!uploadSuccess) {
            const result = await uploadFileWithMetadata(
              file,
              semester,
              subject,
              (progress) => {
                const fileProgress = previousFilesProgress + (progress / files.length);
                setTotalProgress(Math.round(fileProgress));
              }
            );
            uploadSuccess = result.success;
            if (!uploadSuccess) {
              console.error('Direct upload failed:', result.error);
            }
          }

          if (uploadSuccess) {
            successCount++;
            setUploadedCount(successCount);
            pdfHelpers.clearCache();
          } else {
            failedFiles.push(file.name);
          }

          setTotalProgress(Math.round(((i + 1) / files.length) * 100));
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
            <label htmlFor="files">Files *</label>
            <input
              type="file"
              id="files"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.docx,.xlsx,.pptx,.doc,.xls,.ppt,.txt"
              multiple
              onChange={handleFileChange}
              required
              disabled={uploading}
            />
            <small>You can select multiple files at once (PDF, Images, Documents, Text files)</small>
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
            <li>Allowed formats: PDF, Images (JPG, PNG, WebP, GIF), Documents (DOCX, XLSX, PPTX, DOC, XLS, PPT), Text files</li>
            <li>Files will be stored in: <code>semester/subject/filename.ext</code></li>
            <li>You can upload multiple files at once</li>
            <li>File names will be taken from the original filenames</li>
            <li>Subject names should match existing subjects for consistency</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
