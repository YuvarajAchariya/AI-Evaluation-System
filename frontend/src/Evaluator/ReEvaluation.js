import React, { useState } from 'react';
import { Card, Table, Button, Form, Modal, Badge, Alert } from 'react-bootstrap';

const ReEvaluation = ({ subjectId }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [reEvaluationData, setReEvaluationData] = useState({
    newMarks: '',
    comments: ''
  });

  // Sample data for re-evaluation
  const [answers, setAnswers] = useState([
    {
      id: 1,
      studentId: 'STU001',
      studentName: 'John Doe',
      question: 'What is React?',
      originalMarks: 8,
      maxMarks: 10,
      answer: 'React is a JavaScript library for building user interfaces...',
      status: 'Evaluated'
    },
    {
      id: 2,
      studentId: 'STU002',
      studentName: 'Jane Smith',
      question: 'Explain useState hook',
      originalMarks: 12,
      maxMarks: 15,
      answer: 'useState is a Hook that allows you to have state variables in functional components...',
      status: 'Needs Review'
    },
    {
      id: 3,
      studentId: 'STU003',
      studentName: 'Mike Johnson',
      question: 'What is JSX?',
      originalMarks: 6,
      maxMarks: 8,
      answer: 'JSX is a syntax extension for JavaScript...',
      status: 'Evaluated'
    }
  ]);

  const handleReEvaluate = (answer) => {
    setSelectedAnswer(answer);
    setReEvaluationData({
      newMarks: answer.originalMarks.toString(),
      comments: ''
    });
    setShowModal(true);
  };

  const handleSubmitReEvaluation = () => {
    // Update the answer with new marks
    const updatedAnswers = answers.map(answer => {
      if (answer.id === selectedAnswer.id) {
        return {
          ...answer,
          originalMarks: parseInt(reEvaluationData.newMarks),
          status: 'Re-evaluated',
          reEvaluated: true
        };
      }
      return answer;
    });

    setAnswers(updatedAnswers);
    setShowModal(false);
    setSelectedAnswer(null);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Re-evaluated': return 'warning';
      case 'Needs Review': return 'danger';
      case 'Evaluated': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-warning text-dark">
          <h4 className="mb-0">
            <i className="bi bi-arrow-repeat me-2"></i>
            Re-evaluation Requests
          </h4>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="mb-3">
            <i className="bi bi-info-circle me-2"></i>
            Review and re-evaluate student answers. You can update marks and add comments.
          </Alert>

          <Table responsive striped hover>
            <thead className="table-dark">
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Question</th>
                <th>Original Marks</th>
                <th>Max Marks</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {answers.map(answer => (
                <tr key={answer.id}>
                  <td>{answer.studentId}</td>
                  <td>{answer.studentName}</td>
                  <td>{answer.question}</td>
                  <td>
                    <strong>{answer.originalMarks}</strong>
                  </td>
                  <td>{answer.maxMarks}</td>
                  <td>
                    <Badge bg={getStatusVariant(answer.status)}>
                      {answer.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleReEvaluate(answer)}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Re-evaluate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Re-evaluation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Re-evaluate Answer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAnswer && (
            <>
              <div className="mb-3">
                <strong>Student:</strong> {selectedAnswer.studentName} ({selectedAnswer.studentId})
              </div>
              <div className="mb-3">
                <strong>Question:</strong> {selectedAnswer.question}
              </div>
              <div className="mb-3">
                <strong>Answer:</strong>
                <Card className="mt-2">
                  <Card.Body>
                    {selectedAnswer.answer}
                  </Card.Body>
                </Card>
              </div>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>New Marks (Max: {selectedAnswer.maxMarks})</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max={selectedAnswer.maxMarks}
                    value={reEvaluationData.newMarks}
                    onChange={(e) => setReEvaluationData({
                      ...reEvaluationData,
                      newMarks: e.target.value
                    })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Comments</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={reEvaluationData.comments}
                    onChange={(e) => setReEvaluationData({
                      ...reEvaluationData,
                      comments: e.target.value
                    })}
                    placeholder="Add comments for re-evaluation..."
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitReEvaluation}>
            Submit Re-evaluation
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ReEvaluation;