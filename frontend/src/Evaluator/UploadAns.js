import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Table, Row, Col, Badge, Modal } from 'react-bootstrap';
import { questionsAPI } from '../services/api';

const UploadAnswerSchema = ({ user, subjectId }) => {
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Question form state
  const [questionForm, setQuestionForm] = useState({
    questionId: '', // Add manual 4-digit ID field
    questionText: '',
    referenceAnswer: '', // Changed from expectedAnswer to referenceAnswer
    marks: '',
    difficulty: 'medium',
    questionType: 'descriptive',
    keywords: '',
    subjectName: user?.subject || 'General' // Add subject name
  });

  // Load existing questions
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsAPI.getQuestionsBySubject(subjectId);
      if (response.data.success) {
        setQuestions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setMessage('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectId) {
      loadQuestions();
    }
  }, [subjectId]);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!questionForm.questionId || !questionForm.questionText || !questionForm.referenceAnswer || !questionForm.marks) {
      setMessage('Please fill in all required fields including 4-digit ID');
      return;
    }

    // Validate 4-digit ID
    if (!/^\d{4}$/.test(questionForm.questionId)) {
      setMessage('Please enter a valid 4-digit ID (numbers only)');
      return;
    }

    try {
      setLoading(true);
      
      const questionData = {
        questionId: questionForm.questionId, // Send manual ID
        questionText: questionForm.questionText,
        referenceAnswer: questionForm.referenceAnswer, // Changed to referenceAnswer
        maxMarks: parseInt(questionForm.marks), // Changed to maxMarks
        subjectId: subjectId,
        subjectName: questionForm.subjectName,
        difficulty: questionForm.difficulty,
        questionType: questionForm.questionType,
        keywords: questionForm.keywords.split(',').map(k => k.trim()).filter(k => k),
        evaluatorId: user?.id || user?.evaluatorId || null
      };

      console.log('📤 Sending question data:', questionData);

      const response = await questionsAPI.createQuestion(questionData);
      
      if (response.data.success) {
        setMessage(`✅ Question added successfully! ID: ${response.data.data.questionId}`);
        setQuestionForm({
          questionId: '',
          questionText: '',
          referenceAnswer: '',
          marks: '',
          difficulty: 'medium',
          questionType: 'descriptive',
          keywords: '',
          subjectName: user?.subject || 'General'
        });
        setShowModal(false);
        await loadQuestions();
      }
    } catch (error) {
      setMessage('❌ Error adding question: ' + (error.response?.data?.error || 'Failed to add question'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-format questionId to only allow 4 digits
    if (name === 'questionId') {
      const numbersOnly = value.replace(/\D/g, ''); // Remove non-digits
      const fourDigits = numbersOnly.slice(0, 4); // Take only first 4 digits
      setQuestionForm({
        ...questionForm,
        [name]: fourDigits
      });
    } else {
      setQuestionForm({
        ...questionForm,
        [name]: value
      });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const response = await questionsAPI.deleteQuestion(questionId);
        if (response.data.success) {
          setMessage('✅ Question deleted successfully');
          await loadQuestions();
        }
      } catch (error) {
        setMessage('❌ Error deleting question: ' + (error.response?.data?.error || 'Delete failed'));
      }
    }
  };

  const getDifficultyVariant = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'secondary';
    }
  };

  const getTypeVariant = (type) => {
    switch (type) {
      case 'descriptive': return 'primary';
      case 'programming': return 'info';
      case 'theory': return 'dark';
      case 'practical': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <i className="bi bi-question-circle me-2"></i>
            Manage Questions & Answers
          </h4>
          <Button 
            variant="light" 
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add New Question
          </Button>
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert variant={message.includes('✅') ? 'success' : 'danger'}>
              {message}
            </Alert>
          )}

          <Row>
            <Col md={8}>
              <h5>Existing Questions ({questions.length})</h5>
              {loading ? (
                <p>Loading questions...</p>
              ) : questions.length > 0 ? (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Question</th>
                        <th>Reference Answer</th>
                        <th>Marks</th>
                        <th>Difficulty</th>
                        <th>Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((question, index) => (
                        <tr key={question._id}>
                          <td>
                            <Badge bg="dark">{question.questionId}</Badge>
                          </td>
                          <td>
                            <div>
                              <strong>{question.questionText}</strong>
                              {question.keywords && question.keywords.length > 0 && (
                                <div className="mt-1">
                                  {question.keywords.map((keyword, idx) => (
                                    <Badge key={idx} bg="secondary" className="me-1 mb-1" style={{ fontSize: '0.7rem' }}>
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <small className="text-muted">
                              {question.referenceAnswer ? question.referenceAnswer.substring(0, 100) + '...' : 'No answer'}
                            </small>
                          </td>
                          <td>
                            <Badge bg="info">{question.maxMarks}</Badge>
                          </td>
                          <td>
                            <Badge bg={getDifficultyVariant(question.difficulty)}>
                              {question.difficulty}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getTypeVariant(question.questionType)}>
                              {question.questionType}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Card className="text-center py-4">
                  <Card.Body>
                    <i className="bi bi-question-circle display-4 text-muted"></i>
                    <h5 className="mt-3 text-muted">No Questions Added Yet</h5>
                    <p className="text-muted">Click "Add New Question" to create your first question.</p>
                  </Card.Body>
                </Card>
              )}
            </Col>

            <Col md={4}>
              <Card className="bg-light">
                <Card.Header>
                  <h6 className="mb-0">Question Statistics</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Total Questions:</strong> {questions.length}
                  </div>
                  <div className="mb-3">
                    <strong>Total Marks:</strong> {questions.reduce((sum, q) => sum + (q.maxMarks || q.marks || 0), 0)}
                  </div>
                  <div className="mb-3">
                    <strong>By Difficulty:</strong>
                    <div className="mt-1">
                      <Badge bg="success" className="me-1">
                        Easy: {questions.filter(q => q.difficulty === 'easy').length}
                      </Badge>
                      <Badge bg="warning" className="me-1">
                        Medium: {questions.filter(q => q.difficulty === 'medium').length}
                      </Badge>
                      <Badge bg="danger">
                        Hard: {questions.filter(q => q.difficulty === 'hard').length}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <strong>By Type:</strong>
                    <div className="mt-1">
                      {['descriptive', 'programming', 'theory', 'practical'].map(type => (
                        <Badge key={type} bg={getTypeVariant(type)} className="me-1 mb-1">
                          {type}: {questions.filter(q => q.questionType === type).length}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Add Question Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Question</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddQuestion}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>4-Digit Question ID *</Form.Label>
                  <Form.Control
                    type="text"
                    name="questionId"
                    value={questionForm.questionId}
                    onChange={handleQuestionChange}
                    placeholder="e.g., 1234"
                    pattern="[0-9]{4}"
                    maxLength="4"
                    required
                  />
                  <Form.Text className="text-muted">
                    Enter a unique 4-digit number (1000-9999)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="subjectName"
                    value={questionForm.subjectName}
                    onChange={handleQuestionChange}
                    placeholder="Enter subject name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Question Text *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="questionText"
                    value={questionForm.questionText}
                    onChange={handleQuestionChange}
                    placeholder="Enter the question..."
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Reference Answer *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="referenceAnswer"
                    value={questionForm.referenceAnswer}
                    onChange={handleQuestionChange}
                    placeholder="Enter the expected reference answer..."
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Marks *</Form.Label>
                  <Form.Control
                    type="number"
                    name="marks"
                    value={questionForm.marks}
                    onChange={handleQuestionChange}
                    placeholder="Enter marks"
                    min="1"
                    max="100"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty</Form.Label>
                  <Form.Select
                    name="difficulty"
                    value={questionForm.difficulty}
                    onChange={handleQuestionChange}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Question Type</Form.Label>
                  <Form.Select
                    name="questionType"
                    value={questionForm.questionType}
                    onChange={handleQuestionChange}
                  >
                    <option value="descriptive">Descriptive</option>
                    <option value="programming">Programming</option>
                    <option value="theory">Theory</option>
                    <option value="practical">Practical</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Keywords (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="keywords"
                    value={questionForm.keywords}
                    onChange={handleQuestionChange}
                    placeholder="ai, machine learning, neural networks"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Question'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UploadAnswerSchema;