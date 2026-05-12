import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { adminAPI } from '../services/api';

const CreateID = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const [studentForm, setStudentForm] = useState({
    name: '', email: '', rollNumber: '', department: '', year: '', semester: ''
  });

  const [evaluatorForm, setEvaluatorForm] = useState({
    name: '', email: '', department: '', specialization: '', contact: ''
  });

  const loadRecords = async () => {
    try {
      setLoadingRecords(true);
      const [studentsResponse, evaluatorsResponse] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getEvaluators()
      ]);
      if (studentsResponse.data.success) setStudents(studentsResponse.data.data);
      if (evaluatorsResponse.data.success) setEvaluators(evaluatorsResponse.data.data);
    } catch (error) {
      console.error('Error loading records:', error);
      setMessage('Failed to load existing records');
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => { loadRecords(); }, []);

  const handleStudentChange = (e) => setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  const handleEvaluatorChange = (e) => setEvaluatorForm({ ...evaluatorForm, [e.target.name]: e.target.value });

  const createStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
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
        setStudentForm({ name: '', email: '', rollNumber: '', department: '', year: '', semester: '' });
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
    if (!evaluatorForm.name || !evaluatorForm.email || !evaluatorForm.department) {
      setMessage('❌ Please fill in all required fields');
      setLoading(false);
      return;
    }
    try {
      const response = await adminAPI.createEvaluator(evaluatorForm);
      if (response.data.success) {
        setMessage('✅ Evaluator created successfully!');
        setEvaluatorForm({ name: '', email: '', department: '', specialization: '', contact: '' });
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

  const inputStyle = { borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc' };
  const labelStyle = { fontWeight: 600, color: '#374151', fontSize: 14, marginBottom: 4 };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          {/* Page Header */}
          <div
            className="rounded-4 p-4 mb-4 d-flex align-items-center justify-content-between shadow-sm"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}
          >
            <div>
              <h4 className="fw-bold mb-1"><i className="bi bi-person-plus me-2"></i>Create IDs</h4>
              <p className="mb-0 opacity-75 small">Create and manage student and evaluator accounts</p>
            </div>
            <i className="bi bi-person-badge" style={{ fontSize: 48, opacity: 0.25 }}></i>
          </div>

          {message && (
            <Alert
              variant={message.includes('✅') ? 'success' : 'danger'}
              className="rounded-3 mb-4"
            >
              {message}
            </Alert>
          )}

          {/* Tabs Card */}
          <Card className="border-0 rounded-4 shadow-sm mb-4">
            <Card.Body className="p-4">

              {/* Custom Tab Switcher */}
              <div className="d-flex gap-2 mb-4">
                {[
                  { key: 'student', label: 'Create Student ID', icon: 'bi-mortarboard', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
                  { key: 'evaluator', label: 'Create Evaluator ID', icon: 'bi-person-check', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: activeTab === tab.key ? tab.gradient : '#f1f5f9',
                      color: activeTab === tab.key ? '#fff' : '#64748b',
                      boxShadow: activeTab === tab.key ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    }}
                  >
                    <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                  </button>
                ))}
              </div>

              {/* Student Tab */}
              {activeTab === 'student' && (
                <Row className="g-4">
                  <Col md={6}>
                    <div className="rounded-4 p-4 h-100" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="d-flex align-items-center gap-2 mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle"
                          style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                          <i className="bi bi-mortarboard text-white small"></i>
                        </div>
                        <h6 className="mb-0 fw-bold text-dark">Create New Student</h6>
                      </div>
                      <Form onSubmit={createStudent}>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Full Name *</Form.Label>
                          <Form.Control type="text" name="name" value={studentForm.name} onChange={handleStudentChange} placeholder="Enter student name" required style={inputStyle} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Email *</Form.Label>
                          <Form.Control type="email" name="email" value={studentForm.email} onChange={handleStudentChange} placeholder="Enter email" required style={inputStyle} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Roll Number *</Form.Label>
                          <Form.Control type="text" name="rollNumber" value={studentForm.rollNumber} onChange={handleStudentChange} placeholder="Enter roll number" required style={inputStyle} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Department *</Form.Label>
                          <Form.Control type="text" name="department" value={studentForm.department} onChange={handleStudentChange} placeholder="Enter department" required style={inputStyle} />
                        </Form.Group>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label style={labelStyle}>Year *</Form.Label>
                              <Form.Control type="text" name="year" value={studentForm.year} onChange={handleStudentChange} placeholder="e.g., 2024" required style={inputStyle} />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label style={labelStyle}>Semester *</Form.Label>
                              <Form.Control type="text" name="semester" value={studentForm.semester} onChange={handleStudentChange} placeholder="e.g., 6" required style={inputStyle} />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-100 border-0 text-white fw-semibold rounded-3 py-2"
                          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                        >
                          {loading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Creating...</>
                          ) : (
                            <><i className="bi bi-plus-circle me-2"></i>Create Student ID</>
                          )}
                        </Button>
                      </Form>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="rounded-4 p-4 h-100" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-inline-flex align-items-center justify-content-center rounded-circle"
                            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #64748b, #475569)' }}>
                            <i className="bi bi-list-ul text-white small"></i>
                          </div>
                          <h6 className="mb-0 fw-bold text-dark">Existing Students</h6>
                        </div>
                        <Badge style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }} className="rounded-3 px-2">{students.length}</Badge>
                      </div>
                      {loadingRecords ? (
                        <div className="text-center py-4">
                          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                          <p className="mt-2 text-secondary small">Loading students...</p>
                        </div>
                      ) : students.length > 0 ? (
                        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                          <Table hover className="mb-0 align-middle" size="sm">
                            <thead style={{ background: '#e2e8f0', position: 'sticky', top: 0 }}>
                              <tr>
                                {['Roll No', 'Name', 'Department', ''].map(h => (
                                  <th key={h} className="text-secondary fw-semibold small text-uppercase py-2 px-2" style={{ letterSpacing: 0.5 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {students.map((student) => (
                                <tr key={student._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td className="px-2"><Badge style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }} className="rounded-2">{student.rollNumber}</Badge></td>
                                  <td className="px-2 text-dark small fw-semibold">{student.name}</td>
                                  <td className="px-2 text-secondary small">{student.department}</td>
                                  <td className="px-2">
                                    <Button variant="outline-danger" size="sm" className="rounded-2" style={{ fontSize: 11 }} onClick={() => deleteStudent(student._id)}>
                                      <i className="bi bi-trash"></i>
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="bi bi-person-x display-6 text-secondary"></i>
                          <p className="mt-2 text-secondary small">No students created yet.</p>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              )}

              {/* Evaluator Tab */}
              {activeTab === 'evaluator' && (
                <Row className="g-4">
                  <Col md={6}>
                    <div className="rounded-4 p-4 h-100" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="d-flex align-items-center gap-2 mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle"
                          style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                          <i className="bi bi-person-check text-white small"></i>
                        </div>
                        <h6 className="mb-0 fw-bold text-dark">Create New Evaluator</h6>
                      </div>
                      <Form onSubmit={createEvaluator}>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Full Name *</Form.Label>
                          <Form.Control type="text" name="name" value={evaluatorForm.name} onChange={handleEvaluatorChange} placeholder="Enter evaluator name" required style={inputStyle} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Email *</Form.Label>
                          <Form.Control type="email" name="email" value={evaluatorForm.email} onChange={handleEvaluatorChange} placeholder="Enter email" required style={inputStyle} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Department *</Form.Label>
                          <Form.Control type="text" name="department" value={evaluatorForm.department} onChange={handleEvaluatorChange} placeholder="Enter department" required style={inputStyle} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Specialization</Form.Label>
                          <Form.Control type="text" name="specialization" value={evaluatorForm.specialization} onChange={handleEvaluatorChange} placeholder="e.g., Computer Science, Mathematics" style={inputStyle} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Contact Information</Form.Label>
                          <Form.Control type="text" name="contact" value={evaluatorForm.contact} onChange={handleEvaluatorChange} placeholder="Phone number or other contact info" style={inputStyle} />
                        </Form.Group>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-100 border-0 text-white fw-semibold rounded-3 py-2"
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                          {loading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Creating...</>
                          ) : (
                            <><i className="bi bi-plus-circle me-2"></i>Create Evaluator ID</>
                          )}
                        </Button>
                      </Form>
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="rounded-4 p-4 h-100" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-inline-flex align-items-center justify-content-center rounded-circle"
                            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #64748b, #475569)' }}>
                            <i className="bi bi-list-ul text-white small"></i>
                          </div>
                          <h6 className="mb-0 fw-bold text-dark">Existing Evaluators</h6>
                        </div>
                        <Badge style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} className="rounded-3 px-2">{evaluators.length}</Badge>
                      </div>
                      {loadingRecords ? (
                        <div className="text-center py-4">
                          <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                          <p className="mt-2 text-secondary small">Loading evaluators...</p>
                        </div>
                      ) : evaluators.length > 0 ? (
                        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                          <Table hover className="mb-0 align-middle" size="sm">
                            <thead style={{ background: '#e2e8f0', position: 'sticky', top: 0 }}>
                              <tr>
                                {['Name', 'Email', 'Department', ''].map(h => (
                                  <th key={h} className="text-secondary fw-semibold small text-uppercase py-2 px-2" style={{ letterSpacing: 0.5 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {evaluators.map((evaluator) => (
                                <tr key={evaluator._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td className="px-2 text-dark small fw-semibold">{evaluator.name}</td>
                                  <td className="px-2 text-secondary small">{evaluator.email}</td>
                                  <td className="px-2 text-secondary small">{evaluator.department}</td>
                                  <td className="px-2">
                                    <Button variant="outline-danger" size="sm" className="rounded-2" style={{ fontSize: 11 }} onClick={() => deleteEvaluator(evaluator._id)}>
                                      <i className="bi bi-trash"></i>
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="bi bi-person-x display-6 text-secondary"></i>
                          <p className="mt-2 text-secondary small">No evaluators created yet.</p>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              )}

            </Card.Body>
          </Card>

          {/* Database Info Card */}
          <Card className="border-0 rounded-4 shadow-sm">
            <Card.Header
              className="py-3 px-4"
              style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', borderBottom: '1px solid #e2e8f0' }}
            >
              <div className="d-flex align-items-center gap-2">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <i className="bi bi-database text-white small"></i>
                </div>
                <h5 className="mb-0 fw-semibold text-dark">Database Information</h5>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                {[
                  { value: students.length, label: 'Students in Database', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', icon: 'bi-mortarboard' },
                  { value: evaluators.length, label: 'Evaluators in Database', gradient: 'linear-gradient(135deg, #10b981, #059669)', icon: 'bi-person-check' },
                  { value: students.filter(s => s.evaluations?.length > 0).length, label: 'Evaluated Students', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', icon: 'bi-check2-all' },
                ].map(({ value, label, gradient, icon }) => (
                  <Col md={4} key={label}>
                    <div className="rounded-4 p-4 text-center text-white shadow-sm" style={{ background: gradient }}>
                      <i className={`bi ${icon}`} style={{ fontSize: 28, opacity: 0.7 }}></i>
                      <h3 className="fw-bold mt-2 mb-1">{value}</h3>
                      <p className="mb-0 small opacity-75">{label}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

        </Col>
      </Row>
    </Container>
  );
};

export default CreateID;