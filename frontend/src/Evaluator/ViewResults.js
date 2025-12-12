import React, { useState } from 'react';
import { Card, Table, Form, Button, Badge, ProgressBar, Row, Col } from 'react-bootstrap';

const ViewResults = ({ subjectId }) => {
  const [filter, setFilter] = useState('all');

  // Sample results data
  const [results, setResults] = useState([
    {
      id: 1,
      studentId: 'STU001',
      studentName: 'John Doe',
      totalMarks: 85,
      maxMarks: 100,
      percentage: 85,
      grade: 'A',
      submissionDate: '2024-01-15',
      status: 'Completed'
    },
    {
      id: 2,
      studentId: 'STU002',
      studentName: 'Jane Smith',
      totalMarks: 92,
      maxMarks: 100,
      percentage: 92,
      grade: 'A+',
      submissionDate: '2024-01-15',
      status: 'Completed'
    },
    {
      id: 3,
      studentId: 'STU003',
      studentName: 'Mike Johnson',
      totalMarks: 78,
      maxMarks: 100,
      percentage: 78,
      grade: 'B+',
      submissionDate: '2024-01-14',
      status: 'Completed'
    },
    {
      id: 4,
      studentId: 'STU004',
      studentName: 'Sarah Wilson',
      totalMarks: 65,
      maxMarks: 100,
      percentage: 65,
      grade: 'C',
      submissionDate: '2024-01-14',
      status: 'Re-evaluated'
    }
  ]);

  const getGradeVariant = (grade) => {
    switch (grade) {
      case 'A+': return 'success';
      case 'A': return 'success';
      case 'B+': return 'warning';
      case 'B': return 'warning';
      case 'C': return 'info';
      case 'D': return 'secondary';
      case 'F': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Re-evaluated': return 'warning';
      case 'Pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredResults = filter === 'all' 
    ? results 
    : results.filter(result => result.status === filter);

  // Statistics
  const totalStudents = results.length;
  const averageMarks = results.reduce((sum, result) => sum + result.totalMarks, 0) / totalStudents;
  const topPerformer = results.reduce((top, current) => 
    current.totalMarks > top.totalMarks ? current : top, results[0]);

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-info text-white">
        <h4 className="mb-0">
          <i className="bi bi-bar-chart me-2"></i>
          Evaluation Results
        </h4>
      </Card.Header>
      <Card.Body>
        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3 className="text-primary">{totalStudents}</h3>
                <small className="text-muted">Total Students</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3 className="text-success">{averageMarks.toFixed(1)}%</h3>
                <small className="text-muted">Average Marks</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3 className="text-warning">{topPerformer.grade}</h3>
                <small className="text-muted">Highest Grade</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3 className="text-info">
                  {results.filter(r => r.status === 'Re-evaluated').length}
                </h3>
                <small className="text-muted">Re-evaluated</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Filter by Status:</Form.Label>
              <Form.Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Re-evaluated">Re-evaluated</option>
                <option value="Pending">Pending</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex align-items-end">
            <Button variant="outline-success" className="ms-auto">
              <i className="bi bi-download me-2"></i>
              Export Results
            </Button>
          </Col>
        </Row>

        {/* Results Table */}
        <Table responsive striped hover>
          <thead className="table-dark">
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Status</th>
              <th>Submission Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map(result => (
              <tr key={result.id}>
                <td>{result.studentId}</td>
                <td>{result.studentName}</td>
                <td>
                  <strong>{result.totalMarks}</strong> / {result.maxMarks}
                  <ProgressBar 
                    now={result.percentage} 
                    variant={result.percentage >= 80 ? 'success' : result.percentage >= 60 ? 'warning' : 'danger'}
                    className="mt-1"
                  />
                </td>
                <td>
                  <Badge bg={result.percentage >= 80 ? 'success' : result.percentage >= 60 ? 'warning' : 'danger'}>
                    {result.percentage}%
                  </Badge>
                </td>
                <td>
                  <Badge bg={getGradeVariant(result.grade)}>
                    {result.grade}
                  </Badge>
                </td>
                <td>
                  <Badge bg={getStatusVariant(result.status)}>
                    {result.status}
                  </Badge>
                </td>
                <td>{result.submissionDate}</td>
                <td>
                  <Button variant="outline-primary" size="sm">
                    <i className="bi bi-eye me-1"></i>
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {filteredResults.length === 0 && (
          <div className="text-center py-4">
            <i className="bi bi-inbox display-1 text-muted"></i>
            <p className="text-muted mt-2">No results found for the selected filter.</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ViewResults;