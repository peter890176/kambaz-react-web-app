import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Alert, Button, ProgressBar, ListGroup, Badge, Table, Modal } from 'react-bootstrap';
import { FaHome, FaArrowRight, FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { getQuizById, getAttemptsForQuiz } from './api';
import { useSelector } from 'react-redux';
import './QuizResults.css';

function QuizResults() {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [allAttempts, setAllAttempts] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [attemptLimitReached, setAttemptLimitReached] = useState(false);
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  
  // Get parameters passed from location
  const attemptId = location.state?.attemptId;
  const score = location.state?.score;
  const totalPoints = location.state?.totalPoints;

  useEffect(() => {
    if (!quizId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get quiz details
        const quizResponse = await getQuizById(quizId);
        setQuiz(quizResponse.data);
        
        // Get all quiz attempt records
        const attemptsResponse = await getAttemptsForQuiz(quizId);
        if (Array.isArray(attemptsResponse) && attemptsResponse.length > 0) {
          // Sort by creation time, newest first
          const sortedAttempts = attemptsResponse.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setAllAttempts(sortedAttempts);
          
          // If there's an attemptId from location, use that attempt
          // Otherwise use the latest attempt
          const targetAttempt = attemptId 
            ? sortedAttempts.find(a => a._id === attemptId)
            : sortedAttempts[0];
            
          if (targetAttempt) {
            setAttempt(targetAttempt);
          } else if (sortedAttempts.length > 0) {
            setAttempt(sortedAttempts[0]);
          }
        }
      } catch (err: any) {
        console.error('Failed to get quiz result data:', err);
        setError(err.message || 'Failed to get quiz results');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [quizId, attemptId]);

  // Calculate score percentage
  const calculatePercentage = (score: number, totalPoints: number) => {
    if (!score || !totalPoints) return 0;
    return Math.round((score / totalPoints) * 100);
  };

  // Return color based on score percentage
  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  // Calculate quiz duration (minutes)
  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    return Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
  };

  // View specific attempt record
  const viewAttempt = (attemptId: string) => {
    const selectedAttempt = allAttempts.find(a => a._id === attemptId);
    if (selectedAttempt) {
      setAttempt(selectedAttempt);
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">
          <Alert.Heading>An error occurred</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!attempt || !quiz) {
    return (
      <Container className="my-4">
        <Alert variant="warning">
          <Alert.Heading>Quiz results not found</Alert.Heading>
          <p>Unable to find attempt records for this quiz. Please make sure you have completed the quiz.</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-warning" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const scorePercentage = calculatePercentage(attempt.score, quiz.totalPoints);
  const scoreColor = getScoreColor(scorePercentage);
  const duration = calculateDuration(attempt.startTime, attempt.endTime);

  return (
    <Container className="my-4 quiz-results-container">
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">Quiz Results</h3>
            {allAttempts.length > 1 && (
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => setShowAttemptsModal(true)}
              >
                View All Attempts ({allAttempts.length})
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h4>{quiz.title}</h4>
            {quiz.description && <p className="text-muted">{quiz.description}</p>}
          </div>
          
          <div className="text-center my-4">
            <h2 className={`text-${scoreColor}`}>
              {attempt.score} / {quiz.totalPoints} Points ({scorePercentage}%)
            </h2>
            <ProgressBar 
              variant={scoreColor} 
              now={scorePercentage} 
              label={`${scorePercentage}%`} 
              className="mt-2"
              style={{ height: '1.5rem' }}
            />
          </div>
          
          <Alert variant="info" className="mt-4 d-flex justify-content-between">
            <div>
              <FaCalendarAlt className="me-2" />
              <strong>Completion Time:</strong> {new Date(attempt.endTime).toLocaleString()}
            </div>
            <div>
              <FaClock className="me-2" />
              <strong>Duration:</strong> {duration} minutes
            </div>
          </Alert>
          
          <h5 className="mt-4 mb-3">Question Review</h5>
          <div className="question-review">
            {attempt.answers && attempt.answers.map((answer: any, index: number) => {
              const question = quiz.questions.find((q: any) => q._id === answer.questionId || q._id === answer.question);
              if (!question) return null;
              
              return (
                <Card 
                  key={index} 
                  className={`mb-3 question-card ${answer.isCorrect ? 'correct-answer' : 'incorrect-answer'}`}
                >
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div className="question-header">
                      <span className="question-number">Question {index + 1}</span>
                      <span className="question-title">{question.title}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      {answer.isCorrect ? (
                        <>
                          <FaCheckCircle className="text-success me-2" />
                          <Badge bg="success">{question.points} Points</Badge>
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="text-danger me-2" />
                          <Badge bg="danger">0 Points</Badge>
                        </>
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Card.Text className="question-text">{question.questionText}</Card.Text>
                    
                    <div className="mt-3">
                      <strong>Your Answer:</strong>
                      {question.questionType === 'MULTIPLE_CHOICE' && (
                        <div className="user-answer">
                          {question.choices.find((c: any) => 
                            c._id === answer.answerChoice || c.id === answer.answerChoice
                          )?.text || 'Not Answered'}
                        </div>
                      )}
                      
                      {question.questionType === 'TRUE_FALSE' && (
                        <div className="user-answer">
                          {answer.answerBoolean === true ? 'True' : 
                           answer.answerBoolean === false ? 'False' : 'Not Answered'}
                        </div>
                      )}
                      
                      {question.questionType === 'FILL_BLANK' && (
                        <div className="user-answer">{answer.answerText || 'Not Answered'}</div>
                      )}
                    </div>
                    
                    {quiz.showCorrectAnswers && !answer.isCorrect && (
                      <div className="mt-3 correct-answer-display">
                        <strong>Correct Answer:</strong>
                        {question.questionType === 'MULTIPLE_CHOICE' && (
                          <div>
                            {question.choices.find((c: any) => c.isCorrect)?.text || 'Cannot Display'}
                          </div>
                        )}
                        
                        {question.questionType === 'TRUE_FALSE' && (
                          <div>{question.correctAnswer ? 'True' : 'False'}</div>
                        )}
                        
                        {question.questionType === 'FILL_BLANK' && (
                          <div>{question.correctAnswers?.join(' or ') || 'Cannot Display'}</div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-1" /> Back
          </Button>
          
          {quiz.multipleAttempts && !attemptLimitReached && (
            <Button 
              variant="primary" 
              onClick={() => navigate(`/Kambaz/Quizzes/${quiz._id}`)}
            >
              Try Again <FaArrowRight className="ms-1" />
            </Button>
          )}
        </Card.Footer>
      </Card>
      
      {/* Attempts history dialog */}
      <Modal 
        show={showAttemptsModal} 
        onHide={() => setShowAttemptsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Quiz Attempt History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Duration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allAttempts.map((att, index) => (
                <tr 
                  key={att._id}
                  className={att._id === attempt._id ? 'table-active' : ''}
                >
                  <td>{index + 1}</td>
                  <td>{new Date(att.endTime || att.createdAt).toLocaleString()}</td>
                  <td>{att.score} / {quiz.totalPoints}</td>
                  <td>{calculatePercentage(att.score, quiz.totalPoints)}%</td>
                  <td>{calculateDuration(att.startTime, att.endTime)} minutes</td>
                  <td>
                    <Button 
                      variant={att._id === attempt._id ? 'secondary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => {
                        viewAttempt(att._id);
                        setShowAttemptsModal(false);
                      }}
                      disabled={att._id === attempt._id}
                    >
                      {att._id === attempt._id ? 'Currently Viewing' : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAttemptsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default QuizResults;