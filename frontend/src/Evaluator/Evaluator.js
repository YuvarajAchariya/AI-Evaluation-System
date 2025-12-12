import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const EvaluatorLogin = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({
    subjectId: '',
    name: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'subjectId') {
      // Only allow numbers and limit to 5 digits
      const numbersOnly = value.replace(/[^0-9]/g, '');
      if (numbersOnly.length <= 5) {
        setFormData({
          ...formData,
          [name]: numbersOnly
        });
      }
    } else {
      // For name and password, limit to 10 characters
      if (value.length <= 10) {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.subjectId || !formData.name || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Subject ID validation - must be exactly 5 numbers
    if (formData.subjectId.length !== 5) {
      setError('Subject ID must be exactly 5 numbers');
      return;
    }

    // Name validation - must be at least 3 characters
    if (formData.name.length < 3) {
      setError('Name must be at least 3 characters long');
      return;
    }

    // Password validation - must be at least 6 characters
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Here you would typically make an API call
    console.log('Evaluator Login Attempt:', formData);
    
    // For demo purposes, simulate successful login
    if (formData.password === 'eval123') {
      setError('');
      onLogin && onLogin({ 
        role: 'evaluator', 
        subjectId: formData.subjectId,
        name: formData.name 
      });
    } else {
      setError('Invalid credentials');
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
                  <h2 className="text-success fw-bold">AI Evaluation System</h2>
                  <h4 className="text-muted">Evaluator Login</h4>
                </div>
                
                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subject ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="subjectId"
                      value={formData.subjectId}
                      onChange={handleChange}
                      placeholder="Enter 5-digit subject ID"
                      className="py-2"
                      maxLength="5"
                      inputMode="numeric"
                    />
                    <Form.Text className="text-muted">
                     
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name (max 10 characters)"
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
                      variant="success" 
                      type="submit" 
                      className="py-2 fw-semibold"
                      size="lg"
                    >
                      Login as Evaluator
                    </Button>
                  </div>
                </Form>
                
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Subject Evaluator Access
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default EvaluatorLogin;