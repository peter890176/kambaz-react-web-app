import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Button, ProgressBar, Form, Alert } from 'react-bootstrap';
import { getQuizById, submitAttempt } from './api';
import { FaArrowRight, FaArrowLeft, FaCheck } from 'react-icons/fa';

// 添加接口定義
interface QuizAttemptProps {
  courseId?: string;
}

function QuizAttempt({ courseId: propCourseId }: QuizAttemptProps) {
  const { quizId, cid } = useParams<{ quizId: string; cid?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const attemptId = location.state?.attemptId;
  const courseIdFromState = location.state?.courseId;
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [courseId, setCourseId] = useState<string | undefined>(propCourseId || cid || courseIdFromState);

  // Check parameter validity
  useEffect(() => {
    if (!quizId) {
      setError('Missing quiz ID parameter');
      setLoading(false);
      return;
    }
    
    if (!attemptId) {
      setError('Missing attempt ID parameter, cannot start quiz');
      setLoading(false);
      return;
    }
    
    console.log(`Starting quiz attempt, Quiz ID: ${quizId}, Attempt ID: ${attemptId}, Course ID: ${courseId}`);
  }, [quizId, attemptId, courseId]);

  // Get quiz details
  useEffect(() => {
    if (!quizId || !attemptId) return;
    
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await getQuizById(quizId);
        if (!response || !response.data) {
          throw new Error('Failed to get quiz data');
        }
        
        setQuiz(response.data);
        
        // Set courseId from quiz if not already set
        if (!courseId && response.data.course) {
          console.log("Setting courseId from quiz.course:", response.data.course);
          setCourseId(response.data.course);
        }
        
        // Initialize answers array
        const initialAnswers = response.data.questions.map((q: any) => ({
          question: q._id,
          answerChoice: '',
          answerBoolean: null,
          answerText: ''
        }));
        
        setAnswers(initialAnswers);
        
        // Set countdown
        setTimeLeft(response.data.timeLimit * 60);
        console.log(`Quiz loaded successfully, contains ${response.data.questions.length} questions, time limit ${response.data.timeLimit} minutes`);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to get quiz';
        setError(errorMessage);
        console.error('Failed to get quiz:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, attemptId, courseId]);

  // Countdown
  useEffect(() => {
    if (!quiz || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quiz, timeLeft]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Update answer
  const updateAnswer = (value: any, type: string) => {
    const newAnswers = [...answers];
    if (type === 'choice') {
      newAnswers[currentQuestion].answerChoice = value;
    } else if (type === 'boolean') {
      newAnswers[currentQuestion].answerBoolean = value === 'true';
    } else if (type === 'text') {
      newAnswers[currentQuestion].answerText = value;
    }
    setAnswers(newAnswers);
  };

  // Next question
  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Previous question
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Submit quiz
  const handleSubmit = async () => {
    if (!attemptId) {
      setError('Missing attempt ID, cannot submit');
      return;
    }
    
    try {
      setSubmitting(true);
      console.log(`Submitting quiz attempt, Quiz ID: ${quizId}, Attempt ID: ${attemptId}`);
      console.log("Quiz object:", quiz);
      console.log("Quiz course property:", quiz?.course);
      console.log("Course ID from params or state:", courseId);
      
      // Get the final courseId value, with fallbacks
      const finalCourseId = courseId || quiz?.course || quiz?.courseCode;
      console.log("Final course ID for results navigation:", finalCourseId);
      
      // Clean answer data, remove empty values
      const processedAnswers = answers.map(answer => {
        const result = { ...answer };
        
        // Process multiple choice answers
        if (!result.answerChoice || result.answerChoice === '') {
          delete result.answerChoice;
        }
        
        // Process empty string answers
        if (result.answerText === '') {
          delete result.answerText;
        }
        
        return result;
      });
      
      console.log("Submitting processed answers:", processedAnswers);
      const response = await submitAttempt(attemptId, processedAnswers);
      
      console.log("Quiz submission successful, score:", response.score);
      
      // Navigate to results with courseId
      if (finalCourseId) {
        navigate(`/Kambaz/Courses/${finalCourseId}/Quizzes/${quizId}/results`, { 
          state: { 
            attemptId: attemptId,
            score: response.score,
            totalPoints: quiz?.totalPoints,
            courseId: finalCourseId
          } 
        });
      } else {
        // Fallback if no courseId is available
        navigate(`/Kambaz/Quizzes/${quizId}/results`, { 
          state: { 
            attemptId: attemptId,
            score: response.score,
            totalPoints: quiz?.totalPoints
          } 
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit quiz';
      setError(errorMessage);
      console.error('Failed to submit quiz:', err);
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-danger">Error: {error}</div>;
  if (!quiz) return <div>Quiz not found</div>;
  if (!attemptId) return <div className="text-danger">Missing attempt ID, please restart the quiz</div>;

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Container className="my-4">
      <Card className="mb-3">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4>{quiz.title}</h4>
            <div className="text-danger">Time remaining: {formatTime(timeLeft)}</div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <ProgressBar now={progress} label={`${currentQuestion + 1} / ${quiz.questions.length}`} />
          </div>

          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between">
                <div>Question {currentQuestion + 1}</div>
                <div>{question.points} points</div>
              </div>
            </Card.Header>
            <Card.Body>
              <Card.Title>{question.title}</Card.Title>
              <Card.Text>{question.questionText}</Card.Text>

              <Form>
                {question.questionType === 'MULTIPLE_CHOICE' && question.choices && (
                  <div>
                    {question.choices.map((choice: any, index: number) => (
                      <Form.Check
                        key={index}
                        type="radio"
                        id={`choice-${index}`}
                        label={choice.text}
                        name="questionChoice"
                        value={choice._id}
                        checked={answers[currentQuestion].answerChoice === choice._id}
                        onChange={(e) => updateAnswer(e.target.value, 'choice')}
                      />
                    ))}
                  </div>
                )}

                {question.questionType === 'TRUE_FALSE' && (
                  <div>
                    <Form.Check
                      type="radio"
                      id="true-option"
                      label="True"
                      name="questionBoolean"
                      value="true"
                      checked={answers[currentQuestion].answerBoolean === true}
                      onChange={(e) => updateAnswer(e.target.value, 'boolean')}
                    />
                    <Form.Check
                      type="radio"
                      id="false-option"
                      label="False"
                      name="questionBoolean"
                      value="false"
                      checked={answers[currentQuestion].answerBoolean === false}
                      onChange={(e) => updateAnswer(e.target.value, 'boolean')}
                    />
                  </div>
                )}

                {question.questionType === 'FILL_BLANK' && (
                  <Form.Group>
                    <Form.Label>Your answer</Form.Label>
                    <Form.Control
                      type="text"
                      value={answers[currentQuestion].answerText || ''}
                      onChange={(e) => updateAnswer(e.target.value, 'text')}
                    />
                  </Form.Group>
                )}
              </Form>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between">
            <Button 
              variant="outline-secondary" 
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <FaArrowLeft className="me-1" /> Previous
            </Button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <Button 
                variant="outline-primary" 
                onClick={nextQuestion}
              >
                Next <FaArrowRight className="ms-1" />
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                <FaCheck className="me-1" /> Submit Quiz
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default QuizAttempt;