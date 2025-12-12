import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Modal } from 'react-bootstrap';

const UploadAnswers = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    fileId: '', // Manual 4-digit ID
    description: ''
  });

  const API_BASE = 'http://localhost:5000/api';

  // Load uploaded files from database
  const loadUploadedFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await fetch(`${API_BASE}/upload`);
      const data = await response.json();
      
      if (data.success) {
        setUploadedFiles(data.data);
        setMessage(`✅ Loaded ${data.data.length} files`);
      } else {
        setMessage('Failed to load uploaded files: ' + data.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setMessage('Failed to load uploaded files: ' + error.message);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-format fileId to only allow 4 digits
    if (name === 'fileId') {
      const numbersOnly = value.replace(/\D/g, ''); // Remove non-digits
      const fourDigits = numbersOnly.slice(0, 4); // Take only first 4 digits
      setUploadForm({
        ...uploadForm,
        [name]: fourDigits
      });
    } else {
      setUploadForm({
        ...uploadForm,
        [name]: value
      });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileId', uploadForm.fileId);
      formData.append('description', uploadForm.description);

      const response = await fetch(`${API_BASE}/upload/answers`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ File uploaded successfully! File ID: ${data.data.fileId}`);
        setFile(null);
        setUploadForm({
          fileId: '',
          description: ''
        });
        setShowUploadModal(false);
        document.getElementById('fileInput').value = '';
        
        // Reload the files list
        await loadUploadedFiles();
      } else {
        setMessage('❌ Error uploading file: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Network error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const response = await fetch(`${API_BASE}/upload/${fileId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (data.success) {
          setMessage('✅ File deleted successfully');
          await loadUploadedFiles();
        } else {
          setMessage('❌ Error deleting file: ' + data.error);
        }
      } catch (error) {
        setMessage('❌ Network error: ' + error.message);
      }
    }
  };

  const handleDownload = async (filename) => {
    try {
      window.open(`${API_BASE}/uploads/${filename}`, '_blank');
    } catch (error) {
      setMessage('❌ Error downloading file: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'uploaded': return 'primary';
      case 'processing': return 'warning';
      case 'processed': return 'success';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Container>
      <Row>
        <Col>
          <h2>Upload Answer Sheets</h2>
          
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Upload New Answers</h5>
              <Button 
                variant="primary" 
                onClick={() => setShowUploadModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Upload New File
              </Button>
            </Card.Header>
            <Card.Body>
              {message && (
                <Alert variant={message.includes('✅') ? 'success' : 'danger'}>
                  {message}
                </Alert>
              )}
              
              <div className="text-center py-4">
                <i className="bi bi-cloud-arrow-up display-4 text-muted"></i>
                <h5 className="mt-3 text-muted">File Upload Management</h5>
                <p className="text-muted">
                  Click "Upload New File" to add answer sheets with unique 4-digit IDs.
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Uploaded Files from Database */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Uploaded Files ({uploadedFiles.length})</h5>
              <Button variant="outline-primary" onClick={loadUploadedFiles}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              {loadingFiles ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading files...</p>
                </div>
              ) : uploadedFiles.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>File ID</th>
                      <th>Original Name</th>
                      <th>Description</th>
                      <th>Size</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((file, index) => (
                      <tr key={file._id || file.id}>
                        <td>
                          <Badge bg="dark">{file.fileId}</Badge>
                        </td>
                        <td>
                          <strong>{file.originalName}</strong>
                          <br />
                          <small className="text-muted">
                            {file.filename}
                          </small>
                        </td>
                        <td>
                          {file.description || (
                            <span className="text-muted">No description</span>
                          )}
                        </td>
                        <td>{formatFileSize(file.fileSize)}</td>
                        <td>
                          <Badge bg="info">{file.mimetype}</Badge>
                        </td>
                        <td>
                          <Badge bg={getStatusVariant(file.status)}>
                            {file.status}
                          </Badge>
                        </td>
                        <td>
                          {new Date(file.uploadDate).toLocaleDateString()}
                          <br />
                          <small>
                            {new Date(file.uploadDate).toLocaleTimeString()}
                          </small>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleDownload(file.filename)}
                              title="Download"
                            >
                              <i className="bi bi-download"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteFile(file._id || file.id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-folder-x display-4 text-muted"></i>
                  <h5 className="mt-3 text-muted">No Files Uploaded Yet</h5>
                  <p className="text-muted">Upload some files to see them here.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload New Answer Sheet</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpload}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>4-Digit File ID (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="fileId"
                    value={uploadForm.fileId}
                    onChange={handleUploadFormChange}
                    placeholder="e.g., 1234"
                    pattern="[0-9]{4}"
                    maxLength="4"
                  />
                  <Form.Text className="text-muted">
                    Leave empty for auto-generation (1000-9999)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="description"
                    value={uploadForm.description}
                    onChange={handleUploadFormChange}
                    placeholder="Brief description of the file"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Select Answer Sheet File *</Form.Label>
              <Form.Control
                id="fileInput"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                disabled={uploading}
                required
              />
              <Form.Text className="text-muted">
                Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
              </Form.Text>
            </Form.Group>

            <Alert variant="info">
              <strong>Note:</strong> Each file will have a unique 4-digit ID for easy reference.
              You can provide your own ID or let the system generate one automatically.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading || !file}>
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UploadAnswers;