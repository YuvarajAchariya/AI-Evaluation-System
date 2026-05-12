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

  const navItemStyle = (component) => ({
    cursor: 'pointer',
    color: isActive(component) ? '#a78bfa' : 'rgba(255,255,255,0.65)',
    fontWeight: isActive(component) ? '700' : '400',
    background: isActive(component) ? 'rgba(139,92,246,0.15)' : 'transparent',
    borderRadius: 8,
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar
        expand="lg"
        className="mb-0 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '0.75rem 0' }}
      >
        <Container>
          <Navbar.Brand className="fw-bold fs-5" style={{ color: '#a78bfa' }}>
            <i className="bi bi-cpu me-2"></i>
            AI Evaluation System – Admin Panel
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto gap-1">
              {[
                { key: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
                { key: 'upload', icon: 'bi-cloud-upload', label: 'Upload Answers' },
                { key: 'create', icon: 'bi-person-plus', label: 'Create ID' },
                { key: 'view', icon: 'bi-graph-up', label: 'View Results' },
                { key: 'contact', icon: 'bi-telephone', label: 'Contact' },
              ].map(({ key, icon, label }) => (
                <Nav.Item key={key}>
                  <Nav.Link
                    onClick={() => setActiveComponent(key)}
                    style={navItemStyle(key)}
                    className="px-3 py-2"
                  >
                    <i className={`bi ${icon} me-1`}></i>
                    {label}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
            <Nav className="align-items-center gap-2">
              <span className="text-white-50 small">
                Welcome, <strong className="text-white">{user?.displayName || user?.username}</strong>
              </span>
              <Button
                size="sm"
                variant="outline-light"
                onClick={onLogout}
                className="rounded-pill px-3"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Page content */}
      <div style={{ background: '#f1f5f9', minHeight: 'calc(100vh - 62px)' }}>
        {activeComponent !== 'dashboard' ? renderComponent() : (
          <Container className="py-5">
            {/* Welcome banner */}
            <div
              className="rounded-4 p-4 mb-5 d-flex align-items-center justify-content-between shadow-sm"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff' }}
            >
              <div>
                <h4 className="fw-bold mb-1">Welcome back, {user?.displayName || user?.username || 'Admin'}! 👋</h4>
                <p className="mb-0 opacity-75 small">Last login: {new Date().toLocaleString()}</p>
              </div>
              <i className="bi bi-shield-check" style={{ fontSize: 48, opacity: 0.3 }}></i>
            </div>

            {/* Action cards */}
            <Row className="g-4 mb-5">
              {[
                {
                  key: 'upload', icon: 'bi-cloud-upload', label: 'Upload Answers',
                  desc: 'Upload and manage answer sheets for evaluation',
                  gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  btnLabel: 'Go to Upload',
                },
                {
                  key: 'create', icon: 'bi-person-plus', label: 'Create IDs',
                  desc: 'Generate new student and evaluator IDs',
                  gradient: 'linear-gradient(135deg, #10b981, #059669)',
                  btnLabel: 'Create IDs',
                },
                {
                  key: 'view', icon: 'bi-graph-up', label: 'View Results',
                  desc: 'Analyze and view evaluation results',
                  gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  btnLabel: 'View Results',
                },
                {
                  key: 'contact', icon: 'bi-telephone', label: 'Contact',
                  desc: 'Manage contact information and communications',
                  gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  btnLabel: 'Contact',
                },
              ].map(({ key, icon, label, desc, gradient, btnLabel }) => (
                <Col md={6} lg={3} key={key}>
                  <Card
                    className="h-100 border-0 rounded-4 shadow-sm"
                    style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <Card.Body className="text-center p-4">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width: 60, height: 60, background: gradient }}
                      >
                        <i className={`bi ${icon} text-white fs-3`}></i>
                      </div>
                      <Card.Title className="fw-bold text-dark">{label}</Card.Title>
                      <Card.Text className="text-secondary small">{desc}</Card.Text>
                      <Button
                        onClick={() => setActiveComponent(key)}
                        className="w-100 fw-semibold border-0 text-white rounded-3"
                        style={{ background: gradient }}
                      >
                        {btnLabel}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Quick Stats */}
            <h6 className="text-secondary fw-semibold mb-3 text-uppercase" style={{ letterSpacing: 1 }}>Quick Stats</h6>
            <Row className="g-4">
              {[
                { value: '1,234', label: 'Total Students', gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)', icon: 'bi-people' },
                { value: '45', label: 'Evaluators', gradient: 'linear-gradient(135deg, #10b981, #059669)', icon: 'bi-person-badge' },
                { value: '89%', label: 'Evaluation Complete', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', icon: 'bi-check2-circle' },
                { value: '12', label: 'Pending Tasks', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: 'bi-clock-history' },
              ].map(({ value, label, gradient, icon }) => (
                <Col md={3} key={label}>
                  <Card
                    className="border-0 rounded-4 shadow-sm text-white"
                    style={{ background: gradient }}
                  >
                    <Card.Body className="d-flex align-items-center justify-content-between p-4">
                      <div>
                        <h3 className="fw-bold mb-1">{value}</h3>
                        <p className="mb-0 opacity-75 small">{label}</p>
                      </div>
                      <i className={`bi ${icon}`} style={{ fontSize: 36, opacity: 0.3 }}></i>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;