import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <Container>
      <Row>
        <Col md={8}>
          <h2>Contact Support</h2>
          
          {submitted && (
            <Alert variant="success">
              Thank you for your message! We'll get back to you soon.
            </Alert>
          )}

          <Card>
            <Card.Header>
              <h5 className="mb-0">Send us a Message</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Your Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter subject"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Message *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Enter your message"
                    required
                  />
                </Form.Group>

                <Button variant="warning" type="submit" size="lg">
                  Send Message
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="bg-light">
            <Card.Body>
              <h5>Contact Information</h5>
              <div className="mb-3">
                <strong>Email:</strong><br />
                support@aievaluation.com
              </div>
              <div className="mb-3">
                <strong>Phone:</strong><br />
                +1 (555) 123-4567
              </div>
              <div className="mb-3">
                <strong>Office Hours:</strong><br />
                Monday - Friday: 9:00 AM - 5:00 PM
              </div>
              <div>
                <strong>Emergency Support:</strong><br />
                24/7 for critical system issues
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Contact;