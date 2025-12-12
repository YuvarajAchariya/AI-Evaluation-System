import React, { useState } from 'react';
import { Container, Nav, Navbar, Button, Row, Col, Card } from 'react-bootstrap';

// Correct import paths for components inside the same Admin folder
import UploadAnswers from './UploadAnswers.js';
import CreateID from './create.js';
import ViewResults from './viewResults.js';
import Contact from './Contact.js';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeComponent, setActiveComponent] = useState('dashboard');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'upload':
        return <UploadAnswers />;
      case 'create':
        return <CreateID />;
      case 'view':
        return <ViewResults />;
      case 'contact':
        return <Contact />;
      default:
        return (
          <Container className="mt-4">
            <Row className="text-center mb-5">
              <Col>
                <p className="lead">Welcome back, {user?.displayName || user?.username || 'Admin'}!</p>
                <p className="text-muted">Last login: {new Date().toLocaleString()}</p>
              </Col>
            </Row>
            
            <Row className="g-4">
              <Col md={6} lg={3}>
                <Card className="h-100 shadow-sm border-0 hover-shadow">
                  <Card.Body className="text-center">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                      <i className="bi bi-cloud-upload fs-1 text-primary"></i>
                    </div>
                    <Card.Title>Upload Answers</Card.Title>
                    <Card.Text className="text-muted">
                      Upload and manage answer sheets for evaluation
                    </Card.Text>
                    <Button 
                      variant="primary" 
                      onClick={() => setActiveComponent('upload')}
                      className="w-100"
                    >
                      Go to Upload
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3}>
                <Card className="h-100 shadow-sm border-0 hover-shadow">
                  <Card.Body className="text-center">
                    <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                      <i className="bi bi-person-plus fs-1 text-success"></i>
                    </div>
                    <Card.Title>Create IDs</Card.Title>
                    <Card.Text className="text-muted">
                      Generate new student and evaluator IDs
                    </Card.Text>
                    <Button 
                      variant="success" 
                      onClick={() => setActiveComponent('create')}
                      className="w-100"
                    >
                      Create IDs
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3}>
                <Card className="h-100 shadow-sm border-0 hover-shadow">
                  <Card.Body className="text-center">
                    <div className="bg-info bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                      <i className="bi bi-graph-up fs-1 text-info"></i>
                    </div>
                    <Card.Title>View Results</Card.Title>
                    <Card.Text className="text-muted">
                      Analyze and view evaluation results
                    </Card.Text>
                    <Button 
                      variant="info" 
                      className="text-white w-100"
                      onClick={() => setActiveComponent('view')}
                    >
                      View Results
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6} lg={3}>
                <Card className="h-100 shadow-sm border-0 hover-shadow">
                  <Card.Body className="text-center">
                    <div className="bg-warning bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                      <i className="bi bi-telephone fs-1 text-warning"></i>
                    </div>
                    <Card.Title>Contact</Card.Title>
                    <Card.Text className="text-muted">
                      Manage contact information and communications
                    </Card.Text>
                    <Button 
                      variant="warning" 
                      className="text-white w-100"
                      onClick={() => setActiveComponent('contact')}
                    >
                      Contact
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Quick Stats */}
            <Row className="mt-5 g-4">
              <Col md={3}>
                <Card className="border-0 bg-primary text-white">
                  <Card.Body className="text-center">
                    <h3 className="mb-1">1,234</h3>
                    <p className="mb-0">Total Students</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-success text-white">
                  <Card.Body className="text-center">
                    <h3 className="mb-1">45</h3>
                    <p className="mb-0">Evaluators</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-info text-white">
                  <Card.Body className="text-center">
                    <h3 className="mb-1">89%</h3>
                    <p className="mb-0">Evaluation Complete</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-warning text-white">
                  <Card.Body className="text-center">
                    <h3 className="mb-1">12</h3>
                    <p className="mb-0">Pending Tasks</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        );
    }
  };

  // Helper function to check if a nav item is active
  const isActive = (component) => activeComponent === component;

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-3">
        <Container>
          <Navbar.Brand>
            <strong>AI Evaluation System - Admin Panel</strong>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Item>
                <Nav.Link 
                  onClick={() => setActiveComponent('dashboard')}
                  style={{ 
                    cursor: 'pointer', 
                    color: isActive('dashboard') ? '#20c997' : 'rgba(255,255,255,.55)',
                    fontWeight: isActive('dashboard') ? 'bold' : 'normal'
                  }}
                >
                  <i className="bi bi-speedometer2 me-1"></i>
                  Dashboard
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  onClick={() => setActiveComponent('upload')}
                  style={{ 
                    cursor: 'pointer', 
                    color: isActive('upload') ? '#20c997' : 'rgba(255,255,255,.55)',
                    fontWeight: isActive('upload') ? 'bold' : 'normal'
                  }}
                >
                  <i className="bi bi-cloud-upload me-1"></i>
                  Upload Answers
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  onClick={() => setActiveComponent('create')}
                  style={{ 
                    cursor: 'pointer', 
                    color: isActive('create') ? '#20c997' : 'rgba(255,255,255,.55)',
                    fontWeight: isActive('create') ? 'bold' : 'normal'
                  }}
                >
                  <i className="bi bi-person-plus me-1"></i>
                  Create ID
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  onClick={() => setActiveComponent('view')}
                  style={{ 
                    cursor: 'pointer', 
                    color: isActive('view') ? '#20c997' : 'rgba(255,255,255,.55)',
                    fontWeight: isActive('view') ? 'bold' : 'normal'
                  }}
                >
                  <i className="bi bi-graph-up me-1"></i>
                  View Results
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  onClick={() => setActiveComponent('contact')}
                  style={{ 
                    cursor: 'pointer', 
                    color: isActive('contact') ? '#20c997' : 'rgba(255,255,255,.55)',
                    fontWeight: isActive('contact') ? 'bold' : 'normal'
                  }}
                >
                  <i className="bi bi-telephone me-1"></i>
                  Contact
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Nav>
              <span className="navbar-text text-light me-3">
                Welcome, <strong>{user?.displayName || user?.username}</strong>
              </span>
              <Button variant="outline-light" onClick={onLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {renderComponent()}
    </div>
  );
};

export default AdminDashboard;