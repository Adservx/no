import { useState, useEffect } from 'react';
import { pdfHelpers } from '../utils/supabase';
import '../styles/AdminFileManager.css';

interface AdminFileManagerProps {
  onClose: () => void;
  onFileDeleted?: () => void;
}

interface PDFFileRecord {
  id: string;
  semester: string;
  subject: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export const AdminFileManager = ({ onClose, onFileDeleted }: AdminFileManagerProps) => {
  const [files, setFiles] = useState<PDFFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const semesters = [
    'First Semester',
    'Second Semester',
    'Third Semester',
    'Fourth Semester',
    'Fifth Semester',
    'Sixth Semester'
  ];

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await pdfHelpers.getAllFiles();

    if (fetchError) {
      // Handle both string errors and Error objects
      const errorMessage = typeof fetchError === 'string' ? fetchError : fetchError.message || 'Unknown error';
      setError('Failed to load files: ' + errorMessage);
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (file: PDFFileRecord) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}" from ${file.subject}?`)) {
      return;
    }

    setDeleting(file.id);
    setError(null);
    setSuccess(null);

    try {
      // Delete from R2 via API (handles auth and clears cache)
      const { error: deleteError } = await pdfHelpers.deleteFile(file.file_path);

      if (deleteError) {
        setError(`Failed to delete: ${deleteError}`);
      } else {
        setSuccess(`Successfully deleted "${file.file_name}"`);
        // Remove from local state
        setFiles(files.filter(f => f.id !== file.id));

        // Notify parent to refresh
        if (onFileDeleted) {
          onFileDeleted();
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesSemester = filterSemester === 'all' || file.semester === filterSemester;
    const matchesSearch = searchQuery === '' ||
      file.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSemester && matchesSearch;
  });

  return (
    <div className="admin-manager-overlay" onClick={onClose}>
      <div className="admin-manager-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>

        <div className="admin-manager-header">
          <h2>🗂️ Manage PDF Files</h2>
          <p>View and delete uploaded files</p>
        </div>

        <div className="admin-manager-filters">
          <div className="filter-group">
            <label htmlFor="semester-filter">Filter by Semester:</label>
            <select
              id="semester-filter"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
            >
              <option value="all">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              placeholder="Search by file or subject name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="files-table-container">
          {loading ? (
            <div className="loading-message">Loading files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="empty-message">
              {files.length === 0 ? 'No files uploaded yet' : 'No files match your filters'}
            </div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Subject</th>
                  <th>Semester</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="file-name-cell">
                      <span className="file-icon">📄</span>
                      {file.file_name}
                    </td>
                    <td>{file.subject}</td>
                    <td>{file.semester}</td>
                    <td>{formatFileSize(file.file_size)}</td>
                    <td>{formatDate(file.created_at)}</td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(file)}
                        disabled={deleting === file.id}
                      >
                        {deleting === file.id ? '⏳' : '🗑️'} Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="manager-footer">
          <p className="file-count">
            Showing {filteredFiles.length} of {files.length} files
          </p>
        </div>
      </div>
    </div>
  );
};
