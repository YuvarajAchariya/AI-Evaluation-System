import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';

const TestUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('http://localhost:5000/api/upload-debug/answers', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Upload Successful! File: ${data.data.originalName}`);
      } else {
        setMessage(`❌ Upload Failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header>
        <h4>Test File Upload</h4>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Select Test File</Form.Label>
            <Form.Control 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Test File'}
          </Button>
        </Form>

        {message && (
          <Alert variant={message.includes('✅') ? 'success' : 'danger'} className="mt-3">
            {message}
          </Alert>
        )}

        <div className="mt-4">
          <h6>Test Links:</h6>
          <ul>
            <li><a href="http://localhost:5000/api/upload-debug/debug/files" target="_blank" rel="noopener noreferrer">Debug Files Info</a></li>
            <li><a href="http://localhost:5000/api/upload-debug/" target="_blank" rel="noopener noreferrer">Get All Files</a></li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TestUpload;