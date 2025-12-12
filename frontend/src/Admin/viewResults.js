import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import { adminAPI } from '../services/api';  // Changed from ../../ to ../

const ViewResults = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStudents();
      
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      setError('Failed to load student data');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <h3>Loading Results...</h3>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Row>
        <Col>
          <h2>Evaluation Results & Analytics</h2>
          
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}

          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Student Evaluation Results</h5>
              <Button variant="outline-info" onClick={fetchStudents}>
                Refresh Data
              </Button>
            </Card.Header>
            <Card.Body>
              {students.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Evaluations</th>
                      <th>Overall Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <strong>{student.rollNumber}</strong>
                        </td>
                        <td>{student.name}</td>
                        <td>{student.department}</td>
                        <td>{student.year}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {student.evaluations?.length || 0}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            student.overallScore >= 70 ? 'bg-success' : 
                            student.overallScore >= 50 ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {student.overallScore || 0}%
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            student.evaluations?.length > 0 ? 'bg-success' : 'bg-secondary'
                          }`}>
                            {student.evaluations?.length > 0 ? 'Evaluated' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No student data available.</p>
                  <Button variant="primary">Add Students</Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Analytics Cards */}
          <Row className="g-4">
            <Col md={3}>
              <Card className="border-0 bg-primary text-white">
                <Card.Body className="text-center">
                  <h3 className="mb-1">{students.length}</h3>
                  <p className="mb-0">Total Students</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 bg-success text-white">
                <Card.Body className="text-center">
                  <h3 className="mb-1">
                    {students.filter(s => s.evaluations?.length > 0).length}
                  </h3>
                  <p className="mb-0">Evaluated</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 bg-warning text-white">
                <Card.Body className="text-center">
                  <h3 className="mb-1">
                    {students.filter(s => !s.evaluations?.length).length}
                  </h3>
                  <p className="mb-0">Pending</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 bg-info text-white">
                <Card.Body className="text-center">
                  <h3 className="mb-1">
                    {students.length > 0 
                      ? Math.round(students.reduce((sum, s) => sum + (s.overallScore || 0), 0) / students.length)
                      : 0
                    }%
                  </h3>
                  <p className="mb-0">Avg Score</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Export Options */}
          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Export Results</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Button variant="outline-primary" className="w-100 mb-2">
                    Export as Excel
                  </Button>
                </Col>
                <Col md={4}>
                  <Button variant="outline-secondary" className="w-100 mb-2">
                    Export as PDF
                  </Button>
                </Col>
                <Col md={4}>
                  <Button variant="outline-info" className="w-100 mb-2">
                    Generate Report
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ViewResults;