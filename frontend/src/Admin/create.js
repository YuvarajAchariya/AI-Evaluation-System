import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { adminAPI } from '../services/api';

const CreateID = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for existing records
  const [students, setStudents] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Student form state
  const [studentForm, setStudentForm] = useState({
    name: '', email: '', rollNumber: '', department: '', year: '', semester: ''
  });

  // Evaluator form state
  const [evaluatorForm, setEvaluatorForm] = useState({
    name: '', email: '', department: '', specialization: '', contact: ''
  });

  // Load existing students and evaluators from database
  const loadRecords = async () => {
    try {
      setLoadingRecords(true);
      const [studentsResponse, evaluatorsResponse] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getEvaluators()
      ]);

      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.data);
      }
      if (evaluatorsResponse.data.success) {
        setEvaluators(evaluatorsResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading records:', error);
      setMessage('Failed to load existing records');
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleStudentChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handleEvaluatorChange = (e) => {
    setEvaluatorForm({ ...evaluatorForm, [e.target.name]: e.target.value });
  };

  const createStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!studentForm.name || !studentForm.email || !studentForm.rollNumber || 
        !studentForm.department || !studentForm.year || !studentForm.semester) {
      setMessage('❌ Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await adminAPI.createStudent(studentForm);
      
      if (response.data.success) {
        setMessage(`✅ Student created successfully! ID: ${response.data.data.rollNumber}`);
        // Reset form
        setStudentForm({ name: '', email: '', rollNumber: '', department: '', year: '', semester: '' });
        // Reload students list
        await loadRecords();
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || 'Failed to create student'}`);
    } finally {
      setLoading(false);
    }
  };

  const createEvaluator = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!evaluatorForm.name || !evaluatorForm.email || !evaluatorForm.department) {
      setMessage('❌ Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await adminAPI.createEvaluator(evaluatorForm);
      
      if (response.data.success) {
        setMessage(`✅ Evaluator created successfully!`);
        // Reset form
        setEvaluatorForm({ name: '', email: '', department: '', specialization: '', contact: '' });
        // Reload evaluators list
        await loadRecords();
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || 'Failed to create evaluator'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const response = await adminAPI.deleteStudent(studentId);
        if (response.data.success) {
          setMessage('✅ Student deleted successfully');
          await loadRecords();
        }
      } catch (error) {
        setMessage('❌ Error deleting student: ' + (error.response?.data?.error || 'Delete failed'));
      }
    }
  };

  const deleteEvaluator = async (evaluatorId) => {
    if (window.confirm('Are you sure you want to delete this evaluator?')) {
      try {
        const response = await adminAPI.deleteEvaluator(evaluatorId);
        if (response.data.success) {
          setMessage('✅ Evaluator deleted successfully');
          await loadRecords();
        }
      } catch (error) {
        setMessage('❌ Error deleting evaluator: ' + (error.response?.data?.error || 'Delete failed'));
      }
    }
  };

  return (
    <Container>
      <Row>
        <Col>
          <h2>Create IDs</h2>
          
          {message && (
            <Alert variant={message.includes('✅') ? 'success' : 'danger'}>
              {message}
            </Alert>
          )}

          <Card>
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)} className="mb-3">
                
                {/* Student Tab */}
                <Tab eventKey="student" title="Create Student ID">
                  <Row>
                    <Col md={6}>
                      <h5>Create New Student</h5>
                      <Form onSubmit={createStudent}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={studentForm.name}
                            onChange={handleStudentChange}
                            placeholder="Enter student name"
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Email *</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={studentForm.email}
                            onChange={handleStudentChange}
                            placeholder="Enter email"
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Roll Number *</Form.Label>
                          <Form.Control
                            type="text"
                            name="rollNumber"
                            value={studentForm.rollNumber}
                            onChange={handleStudentChange}
                            placeholder="Enter roll number"
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Department *</Form.Label>
                          <Form.Control
                            type="text"
                            name="department"
                            value={studentForm.department}
                            onChange={handleStudentChange}
                            placeholder="Enter department"
                            required
                          />
                        </Form.Group>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Year *</Form.Label>
                              <Form.Control
                                type="text"
                                name="year"
                                value={studentForm.year}
                                onChange={handleStudentChange}
                                placeholder="e.g., 2024"
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Semester *</Form.Label>
                              <Form.Control
                                type="text"
                                name="semester"
                                value={studentForm.semester}
                                onChange={handleStudentChange}
                                placeholder="e.g., 6"
                                required
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Button 
                          variant="success" 
                          type="submit" 
                          disabled={loading}
                          className="w-100"
                        >
                          {loading ? 'Creating...' : 'Create Student ID'}
                        </Button>
                      </Form>
                    </Col>

                    <Col md={6}>
                      <h5>Existing Students ({students.length})</h5>
                      {loadingRecords ? (
                        <p>Loading students...</p>
                      ) : students.length > 0 ? (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <Table striped bordered size="sm">
                            <thead>
                              <tr>
                                <th>Roll No</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.map((student) => (
                                <tr key={student._id}>
                                  <td>
                                    <Badge bg="primary">{student.rollNumber}</Badge>
                                  </td>
                                  <td>{student.name}</td>
                                  <td>{student.department}</td>
                                  <td>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => deleteStudent(student._id)}
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-muted">No students created yet.</p>
                      )}
                    </Col>
                  </Row>
                </Tab>

                {/* Evaluator Tab */}
                <Tab eventKey="evaluator" title="Create Evaluator ID">
                  <Row>
                    <Col md={6}>
                      <h5>Create New Evaluator</h5>
                      <Form onSubmit={createEvaluator}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={evaluatorForm.name}
                            onChange={handleEvaluatorChange}
                            placeholder="Enter evaluator name"
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Email *</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={evaluatorForm.email}
                            onChange={handleEvaluatorChange}
                            placeholder="Enter email"
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Department *</Form.Label>
                          <Form.Control
                            type="text"
                            name="department"
                            value={evaluatorForm.department}
                            onChange={handleEvaluatorChange}
                            placeholder="Enter department"
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Specialization</Form.Label>
                          <Form.Control
                            type="text"
                            name="specialization"
                            value={evaluatorForm.specialization}
                            onChange={handleEvaluatorChange}
                            placeholder="e.g., Computer Science, Mathematics"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Contact Information</Form.Label>
                          <Form.Control
                            type="text"
                            name="contact"
                            value={evaluatorForm.contact}
                            onChange={handleEvaluatorChange}
                            placeholder="Phone number or other contact info"
                          />
                        </Form.Group>

                        <Button 
                          variant="success" 
                          type="submit" 
                          disabled={loading}
                          className="w-100"
                        >
                          {loading ? 'Creating...' : 'Create Evaluator ID'}
                        </Button>
                      </Form>
                    </Col>

                    <Col md={6}>
                      <h5>Existing Evaluators ({evaluators.length})</h5>
                      {loadingRecords ? (
                        <p>Loading evaluators...</p>
                      ) : evaluators.length > 0 ? (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <Table striped bordered size="sm">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {evaluators.map((evaluator) => (
                                <tr key={evaluator._id}>
                                  <td>{evaluator.name}</td>
                                  <td>{evaluator.email}</td>
                                  <td>{evaluator.department}</td>
                                  <td>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => deleteEvaluator(evaluator._id)}
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-muted">No evaluators created yet.</p>
                      )}
                    </Col>
                  </Row>
                </Tab>

              </Tabs>
            </Card.Body>
          </Card>

          {/* Database Info Card */}
          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Database Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <div className="text-center">
                    <h4 className="text-primary">{students.length}</h4>
                    <p className="mb-0">Students in Database</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <h4 className="text-success">{evaluators.length}</h4>
                    <p className="mb-0">Evaluators in Database</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <h4 className="text-info">{students.filter(s => s.evaluations?.length > 0).length}</h4>
                    <p className="mb-0">Evaluated Students</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateID;