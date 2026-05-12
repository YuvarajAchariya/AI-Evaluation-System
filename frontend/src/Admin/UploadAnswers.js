import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Modal } from 'react-bootstrap';

const UploadAnswers = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showExtractedModal, setShowExtractedModal] = useState(false);
  const [manualAnswers, setManualAnswers] = useState(['', '', '', '', '']);
  const [extractedAnswersData, setExtractedAnswersData] = useState([]);
  const [loadingExtracted, setLoadingExtracted] = useState(false);
  const [viewMode, setViewMode] = useState('file');

  const [uploadForm, setUploadForm] = useState({
    fileId: '',
    description: '',
    studentId: '',
    subject: ''
  });

  const API_BASE = 'http://localhost:5000/api';

  const loadUploadedFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await fetch(`${API_BASE}/upload`);
      const data = await response.json();
      if (data.success) {
        setUploadedFiles(data.data);
        setMessage(`Loaded ${data.data.length} files`);
      } else {
        setMessage('Failed to load files: ' + data.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setMessage('Failed to load files: ' + error.message);
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
    if (name === 'fileId') {
      const numbersOnly = value.replace(/\D/g, '');
      const fourDigits = numbersOnly.slice(0, 4);
      setUploadForm({ ...uploadForm, [name]: fourDigits });
    } else {
      setUploadForm({ ...uploadForm, [name]: value });
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
      formData.append('studentId', uploadForm.studentId);
      formData.append('subject', uploadForm.subject);
      console.log('Uploading file:', file.name);
      const response = await fetch(`${API_BASE}/upload/answers`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      console.log('Upload response:', data);
      if (data.success) {
        const extractedCount = data.data.extractedAnswersCount || data.data.totalAnswers || 0;
        const msg = extractedCount > 0
          ? `✅ File uploaded! ID: ${data.data.fileId}. Extracted ${extractedCount} answers.`
          : `⚠️ File uploaded! ID: ${data.data.fileId}. No answers extracted.`;
        setMessage(msg);
        setFile(null);
        setUploadForm({ fileId: '', description: '', studentId: '', subject: '' });
        setShowUploadModal(false);
        document.getElementById('fileInput').value = '';
        await loadUploadedFiles();
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('❌ Network error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleViewAnswers = async (file, mode = 'file') => {
    try {
      setSelectedFile(file);
      setViewMode(mode);
      if (mode === 'file') {
        const response = await fetch(`${API_BASE}/upload/${file.fileId}/answers`);
        const data = await response.json();
        if (data.success) {
          setSelectedFile(data.data);
          setShowAnswersModal(true);
        } else {
          setMessage('❌ Error loading answers: ' + data.error);
        }
      } else if (mode === 'extracted') {
        setLoadingExtracted(true);
        const response = await fetch(`${API_BASE}/upload/extracted/file/${file.fileId}`);
        const data = await response.json();
        if (data.success) {
          setExtractedAnswersData(data.data);
          setShowExtractedModal(true);
        } else {
          setMessage('❌ Error loading extracted answers: ' + data.error);
        }
      }
    } catch (error) {
      setMessage('❌ Network error: ' + error.message);
    } finally {
      setLoadingExtracted(false);
    }
  };

  const handleReExtract = async (fileId) => {
    if (window.confirm('Re-extract answers from this file?')) {
      try {
        const response = await fetch(`${API_BASE}/upload/${fileId}/extract`, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
          setMessage(`✅ Re-extracted ${data.data.length} answers`);
          await loadUploadedFiles();
        } else {
          setMessage('❌ Error: ' + data.error);
        }
      } catch (error) {
        setMessage('❌ Network error: ' + error.message);
      }
    }
  };

  const handleManualEntry = (file) => {
    setSelectedFile(file);
    setManualAnswers(['', '', '', '', '']);
    setShowManualModal(true);
  };

  const handleManualAnswerChange = (index, value) => {
    const newAnswers = [...manualAnswers];
    newAnswers[index] = value;
    setManualAnswers(newAnswers);
  };

  const handleSaveManualAnswers = async () => {
    const emptyAnswers = manualAnswers.filter(ans => !ans.trim());
    if (emptyAnswers.length > 0) {
      setMessage('❌ Please fill all 5 answers');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/upload/${selectedFile.fileId}/answers/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: manualAnswers })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`✅ Added ${data.data.length} answers manually`);
        setShowManualModal(false);
        await loadUploadedFiles();
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Network error: ' + error.message);
    }
  };

  const handleDeleteFile = async (fileId, mongoId) => {
    if (window.confirm('Delete this file and all extracted answers?')) {
      try {
        const response = await fetch(`${API_BASE}/upload/${mongoId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          setMessage('✅ File and extracted answers deleted');
          await loadUploadedFiles();
        } else {
          setMessage('❌ Error: ' + data.error);
        }
      } catch (error) {
        setMessage('❌ Network error: ' + error.message);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status, totalAnswers) => {
    if (status === 'processed' && totalAnswers > 0) return <Badge bg="success">{totalAnswers}/5 answers</Badge>;
    else if (status === 'processed') return <Badge bg="warning">No answers</Badge>;
    else if (status === 'error') return <Badge bg="danger">Error</Badge>;
    else return <Badge bg="primary">Uploaded</Badge>;
  };

  const viewAllExtractedAnswers = async () => {
    try {
      setLoadingExtracted(true);
      const response = await fetch(`${API_BASE}/upload/extracted/all`);
      const data = await response.json();
      if (data.success) {
        setExtractedAnswersData(data.data);
        setShowExtractedModal(true);
        setSelectedFile(null);
      } else {
        setMessage('❌ Error loading all extracted answers: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Network error: ' + error.message);
    } finally {
      setLoadingExtracted(false);
    }
  };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          {/* Page Header */}
          <div
            className="rounded-4 p-4 mb-4 d-flex align-items-center justify-content-between shadow-sm"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' }}
          >
            <div>
              <h4 className="fw-bold mb-1">
                <i className="bi bi-cloud-upload me-2"></i>Upload Answer Sheets
              </h4>
              <p className="mb-0 opacity-75 small">Manage and upload student answer sheets for AI evaluation</p>
            </div>
            <i className="bi bi-file-earmark-text" style={{ fontSize: 48, opacity: 0.25 }}></i>
          </div>

          {/* Info Card */}
          <Card className="mb-4 border-0 rounded-4 shadow-sm">
            <Card.Header
              className="d-flex justify-content-between align-items-center py-3 px-4"
              style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', borderBottom: '1px solid #e2e8f0' }}
            >
              <div className="d-flex align-items-center gap-2">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <i className="bi bi-info-circle text-white small"></i>
                </div>
                <h5 className="mb-0 fw-semibold text-dark">Upload Text File with Answers</h5>
              </div>
              <div className="d-flex gap-2">
                <Button className="border-0 text-white rounded-3 fw-semibold"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
                  onClick={viewAllExtractedAnswers}>
                  <i className="bi bi-database me-2"></i>View All Extracted Answers
                </Button>
                <Button className="border-0 text-white rounded-3 fw-semibold"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                  onClick={() => setShowUploadModal(true)}>
                  <i className="bi bi-upload me-2"></i>Upload File
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {message && (
                <Alert variant={message.includes('✅') ? 'success' : message.includes('❌') ? 'danger' : message.includes('⚠️') ? 'warning' : 'info'} className="rounded-3">
                  {message}
                </Alert>
              )}
              <Row className="g-3">
                <Col md={6}>
                  <div className="rounded-3 p-3 h-100" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p className="fw-bold text-dark mb-2"><i className="bi bi-file-earmark-text me-2 text-primary"></i>Upload a text file containing 5 answers.</p>
                    <p className="fw-semibold text-secondary mb-2">Supported formats:</p>
                    <div className="rounded-3 p-3" style={{ background: '#1e293b', fontFamily: 'monospace' }}>
                      <p className="fw-bold mb-1" style={{ color: '#94a3b8', fontSize: 12 }}>Format 1:</p>
                      {['1. This is answer one...', '2. This is answer two...', '3. This is answer three...', '4. This is answer four...', '5. This is answer five...'].map((line, i) => (
                        <div key={i} style={{ color: '#7dd3fc', fontSize: 13 }}>{line}</div>
                      ))}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="rounded-3 p-3 h-100" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p className="fw-semibold text-dark mb-2"><i className="bi bi-lightbulb me-2 text-warning"></i>Example from your file:</p>
                    <div className="rounded-3 p-3" style={{ background: '#1e293b', fontFamily: 'monospace' }}>
                      {['1.Answer one..java...', '2.Answer two ..Reactjs...', '3.Answer three.. Aiml...', '4.Answer four..Angular...', '5.Answer five..CAssanadara...'].map((line, i) => (
                        <div key={i} style={{ color: '#86efac', fontSize: 13 }}>{line}</div>
                      ))}
                    </div>
                    <p className="mt-2 text-secondary small"><i className="bi bi-info-circle me-1"></i>System will clean extra dots and store in MongoDB</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Uploaded Files */}
          <Card className="border-0 rounded-4 shadow-sm">
            <Card.Header
              className="d-flex justify-content-between align-items-center py-3 px-4"
              style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', borderBottom: '1px solid #e2e8f0' }}
            >
              <div className="d-flex align-items-center gap-2">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <i className="bi bi-folder2-open text-white small"></i>
                </div>
                <h5 className="mb-0 fw-semibold text-dark">Uploaded Files ({uploadedFiles.length})</h5>
              </div>
              <Button className="border-0 text-white rounded-3 fw-semibold"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={loadUploadedFiles}>
                <i className="bi bi-arrow-clockwise me-2"></i>Refresh
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {loadingFiles ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-secondary">Loading files...</p>
                </div>
              ) : uploadedFiles.length > 0 ? (
                <Table responsive hover className="mb-0 align-middle">
                  <thead style={{ background: '#f1f5f9' }}>
                    <tr>
                      {['File ID', 'Universal ID', 'File Name', 'Subject', 'Answers', 'Size', 'Upload Date', 'Actions'].map(h => (
                        <th key={h} className="text-secondary fw-semibold small text-uppercase px-3 py-3" style={{ letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((file) => (
                      <tr key={file._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td className="px-3">
                          <Badge style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }} className="rounded-2 px-2">{file.fileId}</Badge>
                        </td>
                        <td className="px-3">
                          <Badge style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }} className="rounded-2 px-2">{file.universalQuestionId || 'UNIV-' + file.fileId}</Badge>
                        </td>
                        <td className="px-3">
                          <strong className="text-dark">{file.originalName}</strong>
                          {file.description && <div><small className="text-secondary">{file.description}</small></div>}
                          {file.studentId && <div><small className="text-secondary"><strong>Student:</strong> {file.studentId}</small></div>}
                        </td>
                        <td className="px-3 text-secondary">{file.subject || <span className="text-muted fst-italic">Not specified</span>}</td>
                        <td className="px-3">{getStatusBadge(file.status, file.totalAnswers)}</td>
                        <td className="px-3 text-secondary small">{formatFileSize(file.fileSize)}</td>
                        <td className="px-3">
                          <span className="text-dark small">{new Date(file.uploadDate).toLocaleDateString()}</span>
                          <br /><small className="text-secondary">{new Date(file.uploadDate).toLocaleTimeString()}</small>
                        </td>
                        <td className="px-3">
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex gap-1">
                              <Button variant="outline-info" size="sm" className="rounded-2" onClick={() => handleViewAnswers(file, 'file')} title="View File Answers"><i className="bi bi-file-text"></i></Button>
                              <Button variant="outline-success" size="sm" className="rounded-2" onClick={() => handleViewAnswers(file, 'extracted')} title="View Extracted Answers (MongoDB)"><i className="bi bi-database"></i></Button>
                            </div>
                            <div className="d-flex gap-1">
                              <Button variant="outline-warning" size="sm" className="rounded-2" onClick={() => handleReExtract(file.fileId)} title="Re-extract"><i className="bi bi-arrow-repeat"></i></Button>
                              <Button variant="outline-secondary" size="sm" className="rounded-2" onClick={() => handleManualEntry(file)} title="Manual Entry"><i className="bi bi-pencil"></i></Button>
                              <Button variant="outline-danger" size="sm" className="rounded-2" onClick={() => handleDeleteFile(file.fileId, file._id)} title="Delete"><i className="bi bi-trash"></i></Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-folder-x display-4 text-secondary"></i>
                  <h5 className="mt-3 text-dark fw-semibold">No Files Uploaded</h5>
                  <p className="text-secondary">Upload a text file to see it here.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
          <Modal.Title className="text-white fw-bold"><i className="bi bi-upload me-2"></i>Upload Answer File</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpload}>
          <Modal.Body className="p-4">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">4-Digit File ID (Optional)</Form.Label>
                  <Form.Control type="text" name="fileId" value={uploadForm.fileId} onChange={handleUploadFormChange} placeholder="e.g., 1001" maxLength="4" className="rounded-3" />
                  <Form.Text className="text-muted">Leave empty for auto-generation (1000-9999)</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">Subject (Optional)</Form.Label>
                  <Form.Control type="text" name="subject" value={uploadForm.subject} onChange={handleUploadFormChange} placeholder="e.g., Computer Science" className="rounded-3" />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">Student ID (Optional)</Form.Label>
                  <Form.Control type="text" name="studentId" value={uploadForm.studentId} onChange={handleUploadFormChange} placeholder="e.g., STU001" className="rounded-3" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark">Description (Optional)</Form.Label>
                  <Form.Control type="text" name="description" value={uploadForm.description} onChange={handleUploadFormChange} placeholder="Brief description" className="rounded-3" />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark">Select Text File *</Form.Label>
              <Form.Control id="fileInput" type="file" accept=".txt" onChange={handleFileChange} disabled={uploading} required className="rounded-3" />
              <Form.Text className="text-muted">Upload .txt file with 5 answers (formats shown above)</Form.Text>
            </Form.Group>
            <Alert variant="info" className="rounded-3">
              <strong>Note:</strong>
              <ul className="mb-0 mt-2">
                <li>Answers will get dynamic IDs: <strong>FileID-1</strong>, <strong>FileID-2</strong>, etc.</li>
                <li>Universal ID: <strong>UNIV-FileID</strong></li>
                <li>Answers will be saved to both <strong>files</strong> and <strong>extractedanswers</strong> collections</li>
              </ul>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" className="rounded-3" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button type="submit" disabled={uploading || !file}
              className="border-0 text-white rounded-3 fw-semibold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              {uploading ? (<><span className="spinner-border spinner-border-sm me-2" role="status"></span>Uploading...</>) : 'Upload File'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* File Answers Modal */}
      <Modal show={showAnswersModal} onHide={() => setShowAnswersModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
          <Modal.Title className="text-white fw-bold"><i className="bi bi-file-text me-2"></i>File Answers - ID: {selectedFile?.fileId}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedFile && (
            <>
              <div className="rounded-3 p-3 mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="mb-1"><strong>Universal ID:</strong> <Badge style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>{selectedFile.universalQuestionId}</Badge></p>
                <p className="mb-1"><strong>File:</strong> <span className="text-secondary">{selectedFile.filename}</span></p>
                <p className="mb-1"><strong>Total Answers:</strong> <span className="text-secondary">{selectedFile.totalAnswers}</span></p>
                <p className="mb-0"><strong>Status:</strong> <span className="text-secondary">{selectedFile.status}</span></p>
              </div>
              {selectedFile.answers && selectedFile.answers.length > 0 ? (
                <Table striped bordered hover>
                  <thead style={{ background: '#f1f5f9' }}>
                    <tr>
                      <th className="text-secondary fw-semibold small">Question ID</th>
                      <th className="text-secondary fw-semibold small">Q.No</th>
                      <th className="text-secondary fw-semibold small">Answer Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFile.answers.map((answer, index) => (
                      <tr key={index}>
                        <td width="150"><Badge bg="dark">{answer.questionId}</Badge></td>
                        <td width="100"><Badge bg="primary">{answer.questionNumber}</Badge></td>
                        <td><div style={{ maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{answer.answerText}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="warning" className="rounded-3">No answers extracted from this file. You can manually enter answers.</Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" className="rounded-3" onClick={() => setShowAnswersModal(false)}>Close</Button>
          {selectedFile && (
            <Button className="border-0 text-white rounded-3 fw-semibold"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
              onClick={() => handleViewAnswers(selectedFile, 'extracted')}>
              <i className="bi bi-database me-2"></i>View in MongoDB
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Extracted Answers Modal (MongoDB) */}
      <Modal show={showExtractedModal} onHide={() => setShowExtractedModal(false)} size="xl" scrollable>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <Modal.Title className="text-white fw-bold">
            <i className="bi bi-database me-2"></i>
            {selectedFile ? `Extracted Answers - File: ${selectedFile.fileId}` : 'All Extracted Answers'}
            <Badge bg="light" text="dark" className="ms-2 small">MongoDB Collection</Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {loadingExtracted ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
              <p className="mt-3 text-secondary">Loading extracted answers...</p>
            </div>
          ) : extractedAnswersData.length > 0 ? (
            <>
              <Alert variant="info" className="rounded-3">
                <i className="bi bi-database me-2"></i>
                Showing {extractedAnswersData.length} answers from the <strong>extractedanswers</strong> collection in MongoDB
                {selectedFile && <span> for file ID: <strong>{selectedFile.fileId}</strong></span>}
              </Alert>
              <div className="table-responsive rounded-3 border" style={{ maxHeight: '500px' }}>
                <Table striped bordered hover size="sm" className="mb-0">
                  <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                    <tr>
                      {['#', 'MongoDB ID', 'File ID', 'Question ID', 'Q.No', 'Answer Text', 'Universal ID', 'Status', 'Extracted Date'].map(h => (
                        <th key={h} className="text-secondary fw-semibold small">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedAnswersData.map((answer, index) => (
                      <tr key={answer._id}>
                        <td>{index + 1}</td>
                        <td><small className="text-muted" title={answer._id}>{answer._id.substring(0, 8)}...</small></td>
                        <td><Badge bg="secondary">{answer.fileId}</Badge></td>
                        <td><Badge bg="dark">{answer.questionId}</Badge></td>
                        <td><Badge bg="primary">{answer.questionNumber}</Badge></td>
                        <td><div style={{ maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{answer.answerText}</div></td>
                        <td><Badge bg="info">{answer.universalId}</Badge></td>
                        <td><Badge bg={answer.status === 'extracted' ? 'success' : 'warning'}>{answer.status}</Badge></td>
                        <td><small>{new Date(answer.extractionDate).toLocaleDateString()}<br />{new Date(answer.extractionDate).toLocaleTimeString()}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="mt-3">
                <Alert variant="success" className="rounded-3">
                  <strong>Summary:</strong> {extractedAnswersData.length} answers found{selectedFile && ` for File ID: ${selectedFile.fileId}`}
                </Alert>
              </div>
            </>
          ) : (
            <Alert variant="warning" className="rounded-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No extracted answers found in the database.{selectedFile && ` for File ID: ${selectedFile.fileId}`}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" className="rounded-3" onClick={() => setShowExtractedModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal show={showManualModal} onHide={() => setShowManualModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
          <Modal.Title className="text-white fw-bold"><i className="bi bi-pencil me-2"></i>Manual Answer Entry - File ID: {selectedFile?.fileId}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedFile && (
            <>
              <Alert variant="info" className="rounded-3">
                <strong>Note:</strong> Answers will get IDs: <strong>{selectedFile.fileId}-1</strong>, <strong>{selectedFile.fileId}-2</strong>, etc.
                and will be saved to both collections.
              </Alert>
              {[1, 2, 3, 4, 5].map((num) => (
                <Form.Group key={num} className="mb-3">
                  <Form.Label className="fw-semibold text-dark">
                    Answer {num} <span className="text-secondary small">(ID: {selectedFile.fileId}-{num})</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={manualAnswers[num - 1]}
                    onChange={(e) => handleManualAnswerChange(num - 1, e.target.value)}
                    placeholder={`Enter answer for question ${num}...`}
                    className="rounded-3"
                  />
                </Form.Group>
              ))}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" className="rounded-3" onClick={() => setShowManualModal(false)}>Cancel</Button>
          <Button className="border-0 text-white rounded-3 fw-semibold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
            onClick={handleSaveManualAnswers}>
            Save All Answers
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UploadAnswers;