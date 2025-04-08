import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Button, 
  Form, 
  ProgressBar, 
  Alert, 
  Badge, 
  InputGroup, 
  ListGroup,
  Table,
  Modal
} from 'react-bootstrap';
import { 
  FaArrowLeft, 
  FaArrowRight, 
  FaEdit, 
  FaSave, 
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaHistory,
  FaUser
} from 'react-icons/fa';
import { getQuizById, createAttempt, submitAttempt, getAttemptsForQuiz } from './api';
import { Question, Choice } from './QuestionEditor';
import './QuizPreview.css';
import { useSelector } from 'react-redux';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  quizType: string;
  timeLimit: number;
  shuffleAnswers: boolean;
  multipleAttempts: boolean;
  attemptsAllowed: number;
  showCorrectAnswers: boolean;
  oneQuestionAtTime: boolean;
  webcamRequired: boolean;
  lockQuestionsAfterAnswering: boolean;
  accessCode: string;
  assignmentGroup: string;
  dueDate?: Date;
  availableDate?: Date;
  untilDate?: Date;
  questions: Question[];
  totalPoints: number;
  course?: string;
  courseCode?: string;
}

// User answer type
interface Answer {
  questionId: string;
  answerChoice?: string; // for multiple choice questions
  answerBoolean?: boolean; // for true/false questions
  answerText?: string; // for fill-in-the-blank questions
  isCorrect?: boolean; // mark if the answer is correct
}

// Quiz attempt type
interface Attempt {
  _id: string;
  quiz: string;
  user: string;
  answers: Answer[];
  score: number;
  completed: boolean;
  startTime: Date;
  endTime?: Date;
  createdAt?: Date;
}

const QuizPreview: React.FC = () => {
  console.log("QuizPreview component loaded! QuizId:", useParams().quizId);
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [startTime, setStartTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<Attempt[]>([]);
  const [attemptLimitReached, setAttemptLimitReached] = useState(false);
  const [showAttemptsHistory, setShowAttemptsHistory] = useState(false);
  const [isViewingAttempt, setIsViewingAttempt] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Load quiz data and attempt records
  useEffect(() => {
    const fetchQuizAndAttempts = async () => {
      if (!quizId) return;
      
      try {
        setLoading(true);
        console.log("Current user:", currentUser);
        
        // Debug: log current user role and state before API call
        console.log("Current user role:", currentUser?.role);
        console.log("Is faculty check:", currentUser && (currentUser.role === "FACULTY" || currentUser.role === "ADMIN"));
        
        const response = await getQuizById(quizId);
        const quizData = response.data;
        console.log("Quiz data received:", quizData);
        setQuiz(quizData);
        
        // Initialize user answers
        const initialAnswers = quizData.questions.map((question: Question) => ({
          questionId: question._id || '',
          answerChoice: undefined,
          answerBoolean: undefined,
          answerText: '',
          isCorrect: false
        }));
        
        // Set time limit
        if (quizData.timeLimit) {
          setTimeRemaining(quizData.timeLimit * 60); // convert to seconds
        }

        // Check if in preview mode (teacher access) - Force enable for easier debugging
        // const isFaculty = currentUser && (currentUser.role === "FACULTY" || currentUser.role === "ADMIN");
        const isFaculty = true; // Force enable for testing
        console.log("Setting preview mode to:", isFaculty);
        setIsPreviewMode(isFaculty);
        
        // Create dummy attempt for faculty preview immediately to ensure it's available
        if (isFaculty) {
          console.log('Creating dummy preview attempt for faculty');
          const dummyAttempt = {
            _id: 'preview-' + new Date().getTime(),
            quiz: quizId,
            user: currentUser?.id || 'preview-user',
            answers: initialAnswers,
            score: 0,
            completed: false,
            startTime: new Date(),
          };
          console.log("Created dummy attempt:", dummyAttempt);
          setAttempt(dummyAttempt);
          setUserAnswers(initialAnswers);
        }
        
        // Get user's previous attempts (only for students)
        try {
          const attemptsResponse = await getAttemptsForQuiz(quizId);
          if (attemptsResponse && attemptsResponse.length > 0) {
            setPreviousAttempts(attemptsResponse);
            
            // Check if attempt limit reached
            if (!isFaculty) {
              const completedAttempts = attemptsResponse.filter(
                (att: Attempt) => att.completed
              );
              
              if (!quizData.multipleAttempts && completedAttempts.length > 0) {
                setAttemptLimitReached(true);
                // Load answers from the last attempt
                const lastAttempt = completedAttempts[0]; // already sorted by time
                if (lastAttempt.answers && lastAttempt.answers.length > 0) {
                  setUserAnswers(lastAttempt.answers);
                  setScore(lastAttempt.score);
                  setShowResults(true);
                  setAttempt(lastAttempt);
                }
              } else if (quizData.multipleAttempts && 
                completedAttempts.length >= quizData.attemptsAllowed) {
                setAttemptLimitReached(true);
                // Load answers from the last attempt
                const lastAttempt = completedAttempts[0]; // already sorted by time
                if (lastAttempt.answers && lastAttempt.answers.length > 0) {
                  setUserAnswers(lastAttempt.answers);
                  setScore(lastAttempt.score);
                  setShowResults(true);
                  setAttempt(lastAttempt);
                }
              } else {
                setUserAnswers(initialAnswers);
              }
            } else {
              // Teacher preview mode
              setUserAnswers(initialAnswers);
            }
          } else {
            setUserAnswers(initialAnswers);
          }
        } catch (attemptsErr) {
          console.error('Failed to get quiz attempt records:', attemptsErr);
          setUserAnswers(initialAnswers);
        }
        
        // For students: Only create a new attempt if attempt limit not reached
        if (!attemptLimitReached && !isViewingAttempt && !showResults && !isFaculty) {
          try {
            const attemptResponse = await createAttempt(quizId);
            console.log("Student attempt created:", attemptResponse.data);
            setAttempt(attemptResponse.data);
            setStartTime(new Date(attemptResponse.data.startTime));
          } catch (attemptErr: any) {
            if (attemptErr.response && attemptErr.response.status === 400 && 
                attemptErr.response.data.message === "Attempt limit reached") {
              setAttemptLimitReached(true);
            } else {
              console.error('Cannot create quiz attempt:', attemptErr);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load quiz:', err);
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizAndAttempts();
    
    // Cleanup function
    return () => {
      if (timerInterval) {
        window.clearInterval(timerInterval);
      }
    };
  }, [quizId, attemptLimitReached, isViewingAttempt, currentUser]);

  // Set timer
  useEffect(() => {
    if (timeRemaining !== null && !showResults && !attemptLimitReached && !isViewingAttempt) {
      const timer = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev > 0) {
            return prev - 1;
          } else {
            // Time's up, auto-submit
            handleSubmitQuiz();
            if (timer) window.clearInterval(timer);
            return 0;
          }
        });
      }, 1000);
      
      setTimerInterval(timer);
      
      return () => window.clearInterval(timer);
    }
  }, [timeRemaining, showResults, attemptLimitReached, isViewingAttempt]);

  // Format remaining time
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle answer change
  const handleAnswerChange = (questionIndex: number, value: any, type: 'choice' | 'boolean' | 'text') => {
    if (showResults || attemptLimitReached || isViewingAttempt) return;
    
    const newAnswers = [...userAnswers];
    
    if (type === 'choice') {
      newAnswers[questionIndex] = {
        ...newAnswers[questionIndex],
        answerChoice: value,
        answerBoolean: undefined,
        answerText: undefined
      };
    } else if (type === 'boolean') {
      newAnswers[questionIndex] = {
        ...newAnswers[questionIndex],
        answerBoolean: value,
        answerChoice: undefined,
        answerText: undefined
      };
    } else if (type === 'text') {
      newAnswers[questionIndex] = {
        ...newAnswers[questionIndex],
        answerText: value,
        answerChoice: undefined,
        answerBoolean: undefined
      };
    }
    
    setUserAnswers(newAnswers);
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Move to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (!quiz) {
      console.error("Cannot submit: quiz is null");
      return;
    }
    
    if (!attempt) {
      console.error("Cannot submit: attempt is null");
      
      // For preview mode, create a temporary attempt if one doesn't exist
      if (isPreviewMode) {
        console.log("Creating a temporary attempt for preview mode submission");
        const tempAttempt = {
          _id: 'preview-' + new Date().getTime(),
          quiz: quizId as string,
          user: currentUser?.id || 'preview-user',
          answers: userAnswers,
          score: 0,
          completed: false,
          startTime: new Date(),
        };
        setAttempt(tempAttempt);
        
        // Continue with scoring using the temp attempt
        calculateAndShowScore(tempAttempt);
        return;
      }
      return;
    }
    
    // Extract the actual score calculation into a separate function
    calculateAndShowScore(attempt);
  };

  // Helper function to calculate score and show results
  const calculateAndShowScore = async (currentAttempt: Attempt) => {
    try {
      // Calculate score
      let totalScore = 0;
      
      const scoredAnswers = userAnswers.map((answer, index) => {
        if (!quiz || !quiz.questions[index]) {
          console.error(`Missing question data at index ${index}`);
          return answer;
        }
        
        const question = quiz.questions[index];
        let isCorrect = false;
        
        if (question.questionType === 'MULTIPLE_CHOICE' && question.choices) {
          // Check multiple choice answer
          const correctChoice = question.choices.find(choice => choice.isCorrect);
          isCorrect = correctChoice ? answer.answerChoice === correctChoice.id : false;
        } else if (question.questionType === 'TRUE_FALSE') {
          // Check true/false answer
          isCorrect = answer.answerBoolean === question.correctAnswer;
        } else if (question.questionType === 'FILL_BLANK' && question.correctAnswers) {
          // Check fill-in-the-blank answer
          isCorrect = question.correctAnswers.some(
            correctAns => answer.answerText?.toLowerCase() === correctAns.toLowerCase()
          );
        }
        
        if (isCorrect) {
          totalScore += question.points;
        }
        
        return {
          ...answer,
          isCorrect
        };
      });
      
      setScore(totalScore);
      setUserAnswers(scoredAnswers);
      
      // For faculty in preview mode, just show results without submitting to server
      if (isPreviewMode && currentAttempt._id.toString().startsWith('preview-')) {
        console.log('Faculty preview mode - not submitting to server');
        setShowResults(true);
        
        // Stop timer
        if (timerInterval) {
          window.clearInterval(timerInterval);
        }
        
        return;
      }
      
      // Submit attempt (only for student mode)
      const attemptData = {
        answers: scoredAnswers,
        score: totalScore,
        completed: true,
        endTime: new Date()
      };
      
      await submitAttempt(currentAttempt._id, attemptData);
      
      // Show results
      setShowResults(true);
      
      // Stop timer
      if (timerInterval) {
        window.clearInterval(timerInterval);
      }
      
      // Refresh attempt records
      const attemptsResponse = await getAttemptsForQuiz(quizId as string);
      setPreviousAttempts(attemptsResponse);
      
      // Check if attempt limit reached
      if (!isPreviewMode && quiz) {
        const completedAttempts = attemptsResponse.filter(
          (att: Attempt) => att.completed
        );
        
        if (!quiz.multipleAttempts) {
          setAttemptLimitReached(true);
        } else if (completedAttempts.length >= quiz.attemptsAllowed) {
          setAttemptLimitReached(true);
        }
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz');
      console.error('Failed to submit quiz:', err);
    }
  };

  // Navigate to edit page
  const handleEditQuiz = () => {
    navigate(`/Kambaz/Quizzes/${quizId}/edit`);
  };

  // Restart quiz
  const handleRestartQuiz = () => {
    if (attemptLimitReached && !isPreviewMode) {
      setError('You have reached the maximum number of attempts for this quiz');
      return;
    }
    
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setIsViewingAttempt(false);
    
    // Reset answers
    if (quiz) {
      const initialAnswers = quiz.questions.map((question: Question) => ({
        questionId: question._id || '',
        answerChoice: undefined,
        answerBoolean: undefined,
        answerText: '',
        isCorrect: false
      }));
      setUserAnswers(initialAnswers);
    }
    
    // Reset time
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60);
    }
    
    // For faculty preview mode, create a new dummy attempt
    if (isPreviewMode) {
      setAttempt({
        _id: 'preview-' + new Date().getTime(),
        quiz: quizId as string,
        user: currentUser?.id || 'preview-user',
        answers: userAnswers,
        score: 0,
        completed: false,
        startTime: new Date(),
      });
      return;
    }
    
    // Create new attempt (for students only)
    const createNewAttempt = async () => {
      if (!quizId) return;
      
      try {
        const attemptResponse = await createAttempt(quizId);
        setAttempt(attemptResponse.data);
        setStartTime(new Date(attemptResponse.data.startTime));
      } catch (err: any) {
        if (err.response && err.response.status === 400 && 
            err.response.data.message === "Attempt limit reached") {
          setAttemptLimitReached(true);
          setError('You have reached the maximum number of attempts for this quiz');
        } else {
          console.error('Cannot create new quiz attempt:', err);
        }
      }
    };
    
    if (!isPreviewMode) {
      createNewAttempt();
    }
  };

  // View specific attempt answers
  const viewAttempt = (attemptToView: Attempt) => {
    setIsViewingAttempt(true);
    setShowResults(true);
    setShowAttemptsHistory(false);
    setAttempt(attemptToView);
    setScore(attemptToView.score);
    setUserAnswers(attemptToView.answers);
    setStartTime(new Date(attemptToView.startTime));
  };

  // Add function to handle navigation back to quiz list
  const handleBackToList = () => {
    console.log("Back button clicked in QuizPreview");
    
    // Try to get course from quiz data
    if (quiz && quiz.course) {
      console.log("Using course from quiz data to return:", quiz.course);
      navigate(`/Kambaz/Courses/${quiz.course}/Quizzes`);
      return;
    }
    
    // Try to use courseCode
    if (quiz && quiz.courseCode) {
      console.log("Using courseCode from quiz data to return:", quiz.courseCode);
      navigate(`/Kambaz/Courses/${quiz.courseCode}/Quizzes`);
      return;
    }
    
    // Otherwise, just go back to previous page
    navigate(-1);
  };

  // Render quiz information
  const renderQuizInfo = () => {
    if (!quiz) {
      console.log("renderQuizInfo: quiz is null");
      return null;
    }
    
    console.log("renderQuizInfo called, quiz exists:", quiz.title);
    
    const attemptsUsed = previousAttempts.filter(a => a.completed).length;
    const attemptsRemaining = quiz.multipleAttempts ? 
      Math.max(0, quiz.attemptsAllowed - attemptsUsed) : 
      (attemptsUsed > 0 ? 0 : 1);
    
    return (
      <Card className="mb-4 quiz-info-card">
        <Card.Header className={isPreviewMode ? "bg-warning text-dark" : "bg-primary text-white"}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                className="me-3"
                onClick={handleBackToList}
              >
                <FaArrowLeft className="me-1" /> Back to Quizzes List
              </Button>
              {isPreviewMode ? (
                <>
                  <FaExclamationTriangle className="me-2" />
                  This is a preview version of the quiz
                </>
              ) : (
                <>
                  <FaUser className="me-2" />
                  Student Quiz
                </>
              )}
            </div>
            {!isPreviewMode && previousAttempts.length > 0 && (
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => setShowAttemptsHistory(true)}
              >
                <FaHistory className="me-1" />
                View Attempt History
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <small className="text-muted">
            {isViewingAttempt ? 'Attempt Time: ' : 'Start Time: '}
            {startTime.toLocaleString()}
          </small>
          <h2 className="mb-3">{quiz.title}</h2>
          <div className="quiz-description mb-3">{quiz.description}</div>
          <div className="d-flex justify-content-between flex-wrap mb-2">
            <div>
              <Badge bg="info" className="me-2">Total Points: {quiz.totalPoints} points</Badge>
              <Badge bg="secondary" className="me-2">Time Limit: {quiz.timeLimit} minutes</Badge>
              <Badge bg="secondary">Number of Questions: {quiz.questions.length}</Badge>
              {!isPreviewMode && (
                <Badge bg={attemptsRemaining > 0 ? "success" : "danger"} className="ms-2">
                  Remaining Attempts: {attemptsRemaining}
                </Badge>
              )}
            </div>
            <div>
              {timeRemaining !== null && !showResults && !attemptLimitReached && !isViewingAttempt && (
                <div className="timer">
                  Time Remaining: <strong>{formatTimeRemaining(timeRemaining)}</strong>
                </div>
              )}
            </div>
          </div>
          {!showResults && !attemptLimitReached && !isViewingAttempt && (
            <div className="mb-3">
              <ProgressBar 
                now={(currentQuestionIndex + 1) / quiz.questions.length * 100} 
                label={`${currentQuestionIndex + 1}/${quiz.questions.length}`} 
                variant="primary" 
              />
            </div>
          )}
          <div className="quiz-instructions">
            <h5>Quiz Instructions</h5>
            {isPreviewMode ? (
              <p>This is preview mode. You can answer questions and submit the quiz, and the system will calculate your score.</p>
            ) : (
              <>
                <p>Complete all questions and submit the quiz. The system will automatically calculate your score.</p>
                {quiz.multipleAttempts && (
                  <p>This quiz allows multiple attempts, up to {quiz.attemptsAllowed} times.</p>
                )}
              </>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  // Render multiple choice question
  const renderMultipleChoiceQuestion = (question: Question, questionIndex: number) => {
    if (!question.choices) return null;
    
    return (
      <Form.Group className="mb-4">
        <Form.Label className="question-text">{question.questionText}</Form.Label>
        {question.choices.map((choice: Choice, choiceIndex) => (
          <Form.Check
            key={choice.id || choiceIndex}
            type="radio"
            id={`question-${questionIndex}-choice-${choiceIndex}`}
            name={`question-${questionIndex}`}
            label={choice.text}
            checked={userAnswers[questionIndex]?.answerChoice === choice.id}
            onChange={() => handleAnswerChange(questionIndex, choice.id, 'choice')}
            className="mb-2"
            disabled={showResults || attemptLimitReached || isViewingAttempt}
          />
        ))}
        {showResults && (
          <div className="mt-3 p-3 result-feedback">
            {userAnswers[questionIndex]?.isCorrect ? (
              <div className="text-success">
                <FaCheckCircle className="me-2" />
                Correct Answer! You earned {question.points} points
              </div>
            ) : (
              <div className="text-danger">
                <FaTimesCircle className="me-2" />
                Incorrect Answer! The correct answer is:
                {question.choices.find(c => c.isCorrect)?.text}
              </div>
            )}
          </div>
        )}
      </Form.Group>
    );
  };

  // Render true/false question
  const renderTrueFalseQuestion = (question: Question, questionIndex: number) => {
    return (
      <Form.Group className="mb-4">
        <Form.Label className="question-text">{question.questionText}</Form.Label>
        <div>
          <Form.Check
            type="radio"
            id={`question-${questionIndex}-true`}
            name={`question-${questionIndex}`}
            label="True"
            checked={userAnswers[questionIndex]?.answerBoolean === true}
            onChange={() => handleAnswerChange(questionIndex, true, 'boolean')}
            className="mb-2"
            disabled={showResults || attemptLimitReached || isViewingAttempt}
          />
          <Form.Check
            type="radio"
            id={`question-${questionIndex}-false`}
            name={`question-${questionIndex}`}
            label="False"
            checked={userAnswers[questionIndex]?.answerBoolean === false}
            onChange={() => handleAnswerChange(questionIndex, false, 'boolean')}
            className="mb-2"
            disabled={showResults || attemptLimitReached || isViewingAttempt}
          />
        </div>
        {showResults && (
          <div className="mt-3 p-3 result-feedback">
            {userAnswers[questionIndex]?.isCorrect ? (
              <div className="text-success">
                <FaCheckCircle className="me-2" />
                Correct Answer! You earned {question.points} points
              </div>
            ) : (
              <div className="text-danger">
                <FaTimesCircle className="me-2" />
                Incorrect Answer! The correct answer is: {question.correctAnswer ? 'True' : 'False'}
              </div>
            )}
          </div>
        )}
      </Form.Group>
    );
  };

  // Render fill-in-the-blank question
  const renderFillBlankQuestion = (question: Question, questionIndex: number) => {
    return (
      <Form.Group className="mb-4">
        <Form.Label className="question-text">{question.questionText}</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter your answer here"
          value={userAnswers[questionIndex]?.answerText || ''}
          onChange={(e) => handleAnswerChange(questionIndex, e.target.value, 'text')}
          disabled={showResults || attemptLimitReached || isViewingAttempt}
        />
        {showResults && (
          <div className="mt-3 p-3 result-feedback">
            {userAnswers[questionIndex]?.isCorrect ? (
              <div className="text-success">
                <FaCheckCircle className="me-2" />
                Correct Answer! You earned {question.points} points
              </div>
            ) : (
              <div className="text-danger">
                <FaTimesCircle className="me-2" />
                Incorrect Answer! Acceptable answers:
                <ul className="mt-1 mb-0">
                  {question.correctAnswers?.map((ans, i) => (
                    <li key={i}>{ans}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Form.Group>
    );
  };

  // Render different question form based on question type
  const renderQuestion = (question: Question, questionIndex: number) => {
    switch (question.questionType) {
      case 'MULTIPLE_CHOICE':
        return renderMultipleChoiceQuestion(question, questionIndex);
      case 'TRUE_FALSE':
        return renderTrueFalseQuestion(question, questionIndex);
      case 'FILL_BLANK':
        return renderFillBlankQuestion(question, questionIndex);
      default:
        return <div>Unsupported question type</div>;
    }
  };

  // Render results summary
  const renderResultSummary = () => {
    if (!quiz) return null;
    
    return (
      <Card className="mb-4 results-card">
        <Card.Header className="bg-primary text-white">
          <h3 className="mb-0">Quiz Results</h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h1>{score} / {quiz.totalPoints}</h1>
            <h4>{Math.round((score / quiz.totalPoints) * 100) || 0}%</h4>
          </div>
          
          <h5>Question Response Summary</h5>
          <ListGroup className="question-summary">
            {quiz.questions.map((question, index) => (
              <ListGroup.Item 
                key={index}
                className={userAnswers[index]?.isCorrect ? 'correct-answer' : 'incorrect-answer'}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="question-title">{index + 1}. {question.title}</div>
                    <div className="question-type-badge">
                      <Badge bg="secondary">
                        {question.questionType === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 
                         question.questionType === 'TRUE_FALSE' ? 'True/False' : 'Fill-in-the-blank'}
                      </Badge>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    {userAnswers[index]?.isCorrect ? (
                      <>
                        <FaCheckCircle className="text-success me-2" />
                        <span>{question.points} points</span>
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="text-danger me-2" />
                        <span>0 points</span>
                      </>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
        <Card.Footer>
          <div className="d-flex justify-content-between">
            {(isPreviewMode || (!attemptLimitReached && !isViewingAttempt)) && (
              <Button variant="primary" onClick={handleRestartQuiz}>
                Restart Quiz
              </Button>
            )}
            {attemptLimitReached && !isPreviewMode && !isViewingAttempt && (
              <Alert variant="warning" className="mb-0">
                You have reached the maximum number of attempts for this quiz
              </Alert>
            )}
            {isViewingAttempt && (
              <Button variant="secondary" onClick={() => {
                setIsViewingAttempt(false);
                setShowResults(false);
                setShowAttemptsHistory(true);
              }}>
                Return to Attempt History
              </Button>
            )}
            {isPreviewMode && (
              <Button variant="outline-primary" onClick={handleEditQuiz}>
                <FaEdit className="me-1" /> Edit Quiz
              </Button>
            )}
          </div>
        </Card.Footer>
      </Card>
    );
  };

  // Render attempt history
  const renderAttemptsHistory = () => {
    return (
      <Modal 
        show={showAttemptsHistory} 
        onHide={() => setShowAttemptsHistory(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Quiz Attempt History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previousAttempts.length === 0 ? (
            <Alert variant="info">
              You don't have any quiz attempt records yet.
            </Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {previousAttempts.map((attempt, index) => (
                  <tr key={attempt._id}>
                    <td>{index + 1}</td>
                    <td>{new Date(attempt.startTime).toLocaleString()}</td>
                    <td>{attempt.score} / {quiz?.totalPoints}</td>
                    <td>{Math.round((attempt.score / (quiz?.totalPoints || 1)) * 100)}%</td>
                    <td>
                      {attempt.completed ? (
                        <Badge bg="success">Completed</Badge>
                      ) : (
                        <Badge bg="warning">Incomplete</Badge>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => viewAttempt(attempt)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <Button variant="secondary" onClick={() => setShowAttemptsHistory(false)}>
              Close
            </Button>
            {!attemptLimitReached && (
              <Button variant="primary" onClick={() => {
                setShowAttemptsHistory(false);
                setIsViewingAttempt(false);
                setShowResults(false);
                handleRestartQuiz();
              }}>
                Start New Attempt
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>
    );
  };

  // Render single question view (when oneQuestionAtTime is true)
  const renderSingleQuestionView = () => {
    if (!quiz || !quiz.questions.length) return null;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    
    return (
      <>
        <Card className="mb-4 question-card">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Question {currentQuestionIndex + 1}</h4>
            <Badge bg="primary">{currentQuestion.points} points</Badge>
          </Card.Header>
          <Card.Body>
            {renderQuestion(currentQuestion, currentQuestionIndex)}
          </Card.Body>
        </Card>
        
        <div className="d-flex justify-content-between">
          <Button 
            variant="outline-secondary" 
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || showResults || attemptLimitReached || isViewingAttempt}
          >
            <FaArrowLeft className="me-1" /> Previous
          </Button>
          
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button 
              variant="primary" 
              onClick={handleNextQuestion}
              disabled={showResults || attemptLimitReached || isViewingAttempt}
            >
              Next <FaArrowRight className="ms-1" />
            </Button>
          ) : (
            <Button 
              variant="success" 
              onClick={handleSubmitQuiz}
              disabled={showResults || attemptLimitReached || isViewingAttempt}
            >
              <FaSave className="me-1" /> Submit Quiz
            </Button>
          )}
        </div>
      </>
    );
  };

  // Render all questions view (when oneQuestionAtTime is false)
  const renderAllQuestionsView = () => {
    if (!quiz) return null;
    
    return (
      <>
        <div className="questions-container">
          {quiz.questions.map((question, index) => (
            <Card key={index} className="mb-4 question-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Question {index + 1}</h4>
                <Badge bg="primary">{question.points} points</Badge>
              </Card.Header>
              <Card.Body>
                {renderQuestion(question, index)}
              </Card.Body>
            </Card>
          ))}
        </div>
        
        <div className="d-flex justify-content-end">
          <Button 
            variant="success" 
            onClick={handleSubmitQuiz}
            disabled={showResults || attemptLimitReached || isViewingAttempt}
          >
            <FaSave className="me-1" /> Submit Quiz
          </Button>
        </div>
      </>
    );
  };

  if (loading) {
    console.log("Component is in loading state");
    return (
      <Container className="my-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    console.log("Component has error:", error);
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>An Error Occurred</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate(-1)}>Return</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!quiz) {
    console.log("Quiz is null or undefined");
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <Alert.Heading>Quiz Not Found</Alert.Heading>
          <p>The specified quiz could not be found. Please make sure the quiz ID is correct.</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-warning" onClick={() => navigate(-1)}>Return</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  console.log("Rendering quiz:", quiz.title);
  console.log("Attempt:", attempt);
  console.log("Is preview mode:", isPreviewMode);
  console.log("User answers:", userAnswers);

  return (
    <Container className="my-4 quiz-preview-container">
      {/* Quiz title and information area */}
      {renderQuizInfo()}
      
      {/* Results summary (shown after submission) */}
      {showResults ? (
        renderResultSummary()
      ) : (
        /* Show single question or all questions based on quiz settings */
        quiz && quiz.questions && quiz.questions.length > 0 ? (
          quiz.oneQuestionAtTime ? renderSingleQuestionView() : renderAllQuestionsView()
        ) : (
          <Alert variant="warning">No questions available for this quiz.</Alert>
        )
      )}
      
      {/* Attempt history dialog */}
      {renderAttemptsHistory()}
      
      {/* Bottom edit button (preview mode only) */}
      {!showResults && isPreviewMode && quiz && (
        <div className="mt-4 text-center">
          <Button 
            variant="outline-primary" 
            onClick={handleEditQuiz}
          >
            <FaEdit className="me-1" /> Edit Quiz
          </Button>
        </div>
      )}
      
    </Container>
  );
};

export default QuizPreview; 