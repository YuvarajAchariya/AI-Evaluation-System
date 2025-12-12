import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
// REMOVE this line: import AdminDashboard from './AdminDashboard';

const AdminLogin = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Limit input to 10 characters
    if (value.length <= 10) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Length validation
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Default credentials
    const defaultAdmins = [
      { username: 'admin', password: 'admin123' },
      { username: 'superadmin', password: 'super123' },
      { username: 'administrator', password: 'admin@2024' }
    ];

    // Check against default credentials
    const isValidAdmin = defaultAdmins.find(
      admin => admin.username === formData.username && admin.password === formData.password
    );

    if (isValidAdmin) {
      setError('');
      // Pass proper user object to onLogin
      onLogin({ 
        role: 'admin', 
        username: formData.username,
        id: `admin_${formData.username}`,
        loginTime: new Date().toISOString(),
        displayName: formData.username.charAt(0).toUpperCase() + formData.username.slice(1)
      });
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <Container fluid className="bg-light min-vh-100 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            {/* Back Button */}
            <div className="mb-3">
              <Button 
                variant="outline-secondary" 
                onClick={onBack}
                className="d-flex align-items-center"
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Home
              </Button>
            </div>

            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h2 className="text-primary fw-bold">AI Evaluation System</h2>
                  <h4 className="text-muted">Admin Login</h4>
                </div>
                
                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username (max 10 characters)"
                      className="py-2"
                      maxLength="10"
                    />
                    <Form.Text className="text-muted">
                     
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password (max 10 characters)"
                      className="py-2"
                      maxLength="10"
                    />
                    <Form.Text className="text-muted">
                    
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="py-2 fw-semibold"
                      size="lg"
                    >
                      Login as Admin
                    </Button>
                  </div>
                </Form>
                
                <div className="text-center mt-4">
                  <div className="border-top pt-3">
                    <h6 className="text-muted mb-2"></h6>
                    
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default AdminLogin;