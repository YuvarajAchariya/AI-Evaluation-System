import React, { useState } from 'react';
import { Container, Nav, Navbar, Card, Button, Row, Col, Table, Badge } from 'react-bootstrap';

const StudentHome = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('results');
  
  // Sample student results data
  const [studentResults, setStudentResults] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      marks: 85,
      maxMarks: 100,
      percentage: 85,
      grade: 'A',
      evaluationDate: '2024-01-15',
      status: 'Evaluated'
    },
    {
      id: 2,
      subject: 'Physics',
      marks: 78,
      maxMarks: 100,
      percentage: 78,
      grade: 'B+',
      evaluationDate: '2024-01-14',
      status: 'Evaluated'
    },
    {
      id: 3,
      subject: 'Chemistry',
      marks: 92,
      maxMarks: 100,
      percentage: 92,
      grade: 'A+',
      evaluationDate: '2024-01-16',
      status: 'Evaluated'
    }
  ]);

  // Sample re-evaluation requests
  const [reEvaluationRequests, setReEvaluationRequests] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      question: 'Question 3 - Calculus Problem',
      originalMarks: 8,
      maxMarks: 10,
      reason: 'I believe my solution was correct',
      status: 'Pending',
      requestDate: '2024-01-16'
    }
  ]);

  // Safety check - if user is null, show loading or error
  if (!user) {
    return (
      <Container className="text-center mt-5">
        <Card className="shadow">
          <Card.Body>
            <h3 className="text-danger">Error: User not found</h3>
            <p>Please login again.</p>
            <Button variant="primary" onClick={onLogout}>
              Return to Login
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Safety check for studentId
  const studentId = user.studentId || 'Unknown Student';

  const handleReEvaluationRequest = (subject, question, currentMarks, maxMarks) => {
    const newRequest = {
      id: reEvaluationRequests.length + 1,
      subject: subject,
      question: question,
      originalMarks: currentMarks,
      maxMarks: maxMarks,
      reason: '',
      status: 'Pending',
      requestDate: new Date().toISOString().split('T')[0]
    };
    setReEvaluationRequests([...reEvaluationRequests, newRequest]);
    setActiveTab('re-evaluation');
  };

  const ViewResults = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-success text-white">
        <h4 className="mb-0">
          <i className="bi bi-bar-chart me-2"></i>
          My Evaluation Results
        </h4>
      </Card.Header>
      <Card.Body>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3 className="text-primary">{studentResults.length}</h3>
                <small className="text-muted">Subjects Evaluated</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3 className="text-success">
                  {(studentResults.reduce((sum, result) => sum + result.marks, 0) / studentResults.length).toFixed(1)}%
                </h3>
                <small className="text-muted">Average Score</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3 className="text-warning">
                  {studentResults.filter(r => r.grade === 'A+' || r.grade === 'A').length}
                </h3>
                <small className="text-muted">A Grades</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3 className="text-info">
                  {reEvaluationRequests.length}
                </h3>
                <small className="text-muted">Re-evaluation Requests</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="table-responsive">
          <Table striped hover>
            <thead className="table-dark">
              <tr>
                <th>Subject</th>
                <th>Marks Obtained</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Evaluation Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentResults.map(result => (
                <tr key={result.id}>
                  <td>
                    <strong>{result.subject}</strong>
                  </td>
                  <td>
                    <span className="fw-bold">{result.marks}</span> / {result.maxMarks}
                  </td>
                  <td>
                    <Badge bg={result.percentage >= 80 ? 'success' : result.percentage >= 60 ? 'warning' : 'danger'}>
                      {result.percentage}%
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={
                      result.grade === 'A+' ? 'success' : 
                      result.grade === 'A' ? 'success' : 
                      result.grade === 'B+' ? 'warning' : 
                      result.grade === 'B' ? 'warning' : 'info'
                    }>
                      {result.grade}
                    </Badge>
                  </td>
                  <td>{result.evaluationDate}</td>
                  <td>
                    <Badge bg="success">{result.status}</Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleReEvaluationRequest(
                        result.subject, 
                        'Overall Evaluation', 
                        result.marks, 
                        result.maxMarks
                      )}
                    >
                      <i className="bi bi-arrow-repeat me-1"></i>
                      Request Re-evaluation
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );

  const ApplyReEvaluation = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-warning text-dark">
        <h4 className="mb-0">
          <i className="bi bi-arrow-repeat me-2"></i>
          Re-evaluation Requests
        </h4>
      </Card.Header>
      <Card.Body>
        <div className="mb-4">
          <h5>Submit New Re-evaluation Request</h5>
          <Card className="bg-light">
            <Card.Body>
              <p className="mb-3">
                If you believe there has been an error in the evaluation of your answer script, 
                you can submit a request for re-evaluation.
              </p>
              <Button 
                variant="warning" 
                onClick={() => setActiveTab('results')}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Go to Results to Request Re-evaluation
              </Button>
            </Card.Body>
          </Card>
        </div>

        <h5>My Re-evaluation Requests</h5>
        {reEvaluationRequests.length > 0 ? (
          <div className="table-responsive">
            <Table striped hover>
              <thead className="table-dark">
                <tr>
                  <th>Subject</th>
                  <th>Question</th>
                  <th>Original Marks</th>
                  <th>Max Marks</th>
                  <th>Request Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reEvaluationRequests.map(request => (
                  <tr key={request.id}>
                    <td>{request.subject}</td>
                    <td>{request.question}</td>
                    <td>
                      <strong>{request.originalMarks}</strong>
                    </td>
                    <td>{request.maxMarks}</td>
                    <td>{request.requestDate}</td>
                    <td>
                      <Badge bg={
                        request.status === 'Pending' ? 'warning' : 
                        request.status === 'Approved' ? 'success' : 
                        request.status === 'Rejected' ? 'danger' : 'secondary'
                      }>
                        {request.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <Card className="text-center py-4">
            <Card.Body>
              <i className="bi bi-inbox display-4 text-muted mb-3"></i>
              <h5 className="text-muted">No Re-evaluation Requests</h5>
              <p className="text-muted">
                You haven't submitted any re-evaluation requests yet.
              </p>
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'results':
        return <ViewResults />;
      case 're-evaluation':
        return <ApplyReEvaluation />;
      default:
        return <ViewResults />;
    }
  };

  return (
    <div>
      {/* Student Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow">
        <Container>
          <Navbar.Brand>
            <strong>AI Evaluation System - Student Portal</strong>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="student-navbar" />
          <Navbar.Collapse id="student-navbar">
            <Nav className="me-auto">
              <Nav.Link 
                active={activeTab === 'results'}
                onClick={() => setActiveTab('results')}
                className="fw-semibold"
              >
                <i className="bi bi-bar-chart me-1"></i>
                View Results
              </Nav.Link>
              <Nav.Link 
                active={activeTab === 're-evaluation'}
                onClick={() => setActiveTab('re-evaluation')}
                className="fw-semibold"
              >
                <i className="bi bi-arrow-repeat me-1"></i>
                Apply Re-evaluation
              </Nav.Link>
            </Nav>
            <Nav>
              <Navbar.Text className="me-3">
                Welcome, <strong>{studentId}</strong>
              </Navbar.Text>
              <Button variant="outline-light" onClick={onLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="bg-light min-vh-100 py-4">
        <Container>
          {/* Welcome Card */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Body className="bg-primary text-white rounded">
              <Row className="align-items-center">
                <Col>
                  <h3 className="mb-1">Welcome to Student Portal</h3>
                  <p className="mb-0">Student ID: {studentId}</p>
                </Col>
                <Col xs="auto">
                  <i className="bi bi-person-circle display-4"></i>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Dynamic Content */}
          {renderContent()}
        </Container>
      </Container>
    </div>
  );
};

export default StudentHome;