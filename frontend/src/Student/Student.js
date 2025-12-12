import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const StudentLogin = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({
    studentId: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.studentId.trim()) {
      setError('Please enter your Student ID');
      return;
    }

    // Validate student ID format (basic check)
    if (formData.studentId.trim().length < 3) {
      setError('Please enter a valid Student ID (at least 3 characters)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Here you would typically make an API call
      console.log('Student Login Attempt:', formData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, simulate successful login
      const userData = { 
        role: 'student', 
        studentId: formData.studentId.trim(),
        name: `Student ${formData.studentId.trim()}`, // Add name for consistency
        loginTime: new Date().toISOString()
      };
      
      console.log('Login successful:', userData);
      setError('');
      
      // Ensure onLogin is called with proper data
      if (onLogin) {
        onLogin(userData);
      } else {
        console.error('onLogin callback is not provided');
        setError('Login system error. Please try again.');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Home
              </Button>
            </div>

            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h2 className="text-info fw-bold">AI Evaluation System</h2>
                  <h4 className="text-muted">Student Login</h4>
                </div>
                
                {error && (
                  <Alert variant="danger" className="mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Student ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="Enter your Student ID"
                      className="py-2"
                      disabled={isLoading}
                      maxLength={50}
                    />
                    <Form.Text className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Enter your unique student identification number
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button 
                      variant="info" 
                      type="submit" 
                      className="py-2 fw-semibold text-white"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Logging in...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Login as Student
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
                
                <div className="text-center mt-4">
                  <Card className="bg-light border-0">
                    <Card.Body className="py-3">
                      <small className="text-muted">
                        <i className="bi bi-shield-check me-1"></i>
                        Secure Student Access Portal
                      </small>
                      <br />
                      <small className="text-muted">
                        Demo: Enter any Student ID to login
                      </small>
                    </Card.Body>
                  </Card>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default StudentLogin;