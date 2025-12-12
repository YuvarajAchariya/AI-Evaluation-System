import React, { useState, lazy, Suspense } from 'react';
import { Container, Row, Col, Nav, Card, Spinner, Button, Alert, Modal } from 'react-bootstrap';

// Use lazy loading to avoid circular dependencies
const UploadAnswerSchema = lazy(() => import('./UploadAns'));
const ReEvaluation = lazy(() => import('./ReEvaluation'));
const ViewResults = lazy(() => import('./ViewResults'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="text-center py-5">
    <Spinner animation="border" role="status" variant="primary">
      <span className="visually-hidden">Loading...</span>
    </Spinner>
    <p className="mt-2">Loading component...</p>
  </div>
);

const EvaluatorHome = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState(null); // 'loading', 'success', 'error'
  const [evaluationMessage, setEvaluationMessage] = useState('');
  const [evaluationResults, setEvaluationResults] = useState(null);

  const triggerEvaluation = async () => {
    setShowEvaluationModal(true);
    setEvaluationStatus('loading');
    setEvaluationMessage('Starting AI evaluation process...');
    setEvaluationResults(null);

    try {
      const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId: user.subjectId,
          evaluatorName: user.name
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEvaluationStatus('success');
        setEvaluationMessage(data.message || 'Evaluation completed successfully!');
        setEvaluationResults(data.results);
      } else {
        setEvaluationStatus('error');
        setEvaluationMessage(data.error || 'Evaluation failed. Please try again.');
      }
    } catch (error) {
      setEvaluationStatus('error');
      setEvaluationMessage('Failed to connect to evaluation service. Please ensure the backend server is running.');
      console.error('Evaluation error:', error);
    }
  };

  const closeModal = () => {
    setShowEvaluationModal(false);
    setEvaluationStatus(null);
    setEvaluationMessage('');
    setEvaluationResults(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <UploadAnswerSchema user={user} subjectId={user.subjectId} />
          </Suspense>
        );
      case 're-evaluate':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ReEvaluation user={user} subjectId={user.subjectId} />
          </Suspense>
        );
      case 'results':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ViewResults user={user} subjectId={user.subjectId} />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <UploadAnswerSchema user={user} subjectId={user.subjectId} />
          </Suspense>
        );
    }
  };

  return (
    <Container fluid className="bg-light min-vh-100">
      {/* Header */}
      <Row className="bg-white shadow-sm py-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-success mb-0">AI Evaluation System</h2>
              <small className="text-muted">
                Welcome, {user.name} (Subject: {user.subjectId})
              </small>
            </div>
            <div>
              <Button 
                variant="success" 
                className="me-2"
                onClick={triggerEvaluation}
                disabled={evaluationStatus === 'loading'}
              >
                <i className="bi bi-robot me-2"></i>
                {evaluationStatus === 'loading' ? 'Evaluating...' : 'Run AI Evaluation'}
              </Button>
              <button 
                className="btn btn-outline-danger"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={3}>
          {/* Sidebar Navigation */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Evaluation Dashboard</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'upload'}
                    onClick={() => setActiveTab('upload')}
                    className="rounded-0 border-bottom"
                  >
                    <i className="bi bi-upload me-2"></i>
                    Upload Answer Schema
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 're-evaluate'}
                    onClick={() => setActiveTab('re-evaluate')}
                    className="rounded-0 border-bottom"
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Re-evaluation
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'results'}
                    onClick={() => setActiveTab('results')}
                    className="rounded-0"
                  >
                    <i className="bi bi-bar-chart me-2"></i>
                    View Results
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>

          {/* Quick Actions Card */}
          <Card className="shadow-sm mt-3">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <Button 
                variant="outline-success" 
                className="w-100 mb-2"
                onClick={triggerEvaluation}
                disabled={evaluationStatus === 'loading'}
              >
                <i className="bi bi-robot me-2"></i>
                {evaluationStatus === 'loading' ? 'Processing...' : 'Run AI Evaluation'}
              </Button>
              <small className="text-muted">
                Run the AI evaluation process to evaluate all uploaded answer sheets against reference answers.
              </small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          {/* Main Content */}
          {renderContent()}
        </Col>
      </Row>

      {/* Evaluation Modal */}
      <Modal show={showEvaluationModal} onHide={closeModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-robot me-2"></i>
            AI Evaluation Process
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {evaluationStatus === 'loading' && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" className="mb-3" size="lg" />
              <h5>Evaluating Answers...</h5>
              <p className="mb-2">{evaluationMessage}</p>
              <small className="text-muted">
                This may take a few moments depending on the number of answers to evaluate...
              </small>
            </div>
          )}
          
          {evaluationStatus === 'success' && (
            <div>
              <Alert variant="success" className="mb-4">
                <Alert.Heading>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Evaluation Complete!
                </Alert.Heading>
                <p className="mb-0">{evaluationMessage}</p>
              </Alert>

              {evaluationResults && (
                <div className="evaluation-results">
                  <h6 className="mb-3">Evaluation Summary:</h6>
                  <Row className="g-3">
                    <Col md={6}>
                      <Card className="bg-light">
                        <Card.Body className="text-center">
                          <h4 className="text-primary mb-1">{evaluationResults.totalEvaluated}</h4>
                          <small className="text-muted">Questions Evaluated</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="bg-light">
                        <Card.Body className="text-center">
                          <h4 className="text-success mb-1">{evaluationResults.overallPercentage}%</h4>
                          <small className="text-muted">Overall Score</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  {evaluationResults.detailedResults && evaluationResults.detailedResults.length > 0 && (
                    <div className="mt-3">
                      <h6 className="mb-2">Detailed Results:</h6>
                      <div className="small">
                        {evaluationResults.detailedResults.map((result, index) => (
                          <div key={index} className="d-flex justify-content-between border-bottom py-1">
                            <span>{result.questionId}</span>
                            <span className="fw-bold">{result.marksAwarded}/{result.maxMarks}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {evaluationStatus === 'error' && (
            <Alert variant="danger" className="mb-0">
              <Alert.Heading>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Evaluation Failed
              </Alert.Heading>
              <p className="mb-0">{evaluationMessage}</p>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          {evaluationStatus !== 'loading' && (
            <Button variant="primary" onClick={closeModal}>
              Close
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EvaluatorHome;