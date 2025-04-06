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
}

// 用戶回答類型
interface Answer {
  questionId: string;
  answerChoice?: string; // 用於選擇題
  answerBoolean?: boolean; // 用於是非題
  answerText?: string; // 用於填空題
  isCorrect?: boolean; // 標記答案是否正確
}

// 測驗嘗試類型
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

  // 載入測驗數據及嘗試記錄
  useEffect(() => {
    const fetchQuizAndAttempts = async () => {
      if (!quizId) return;
      
      try {
        setLoading(true);
        const response = await getQuizById(quizId);
        const quizData = response.data;
        setQuiz(quizData);
        
        // 初始化用戶回答
        const initialAnswers = quizData.questions.map((question: Question) => ({
          questionId: question._id || '',
          answerChoice: undefined,
          answerBoolean: undefined,
          answerText: '',
          isCorrect: false
        }));
        
        // 設置時間限制
        if (quizData.timeLimit) {
          setTimeRemaining(quizData.timeLimit * 60); // 轉換為秒
        }

        // 檢查是否為預覽模式（教師訪問）
        const isFaculty = currentUser && (currentUser.role === "FACULTY" || currentUser.role === "ADMIN");
        setIsPreviewMode(isFaculty);
        
        // 獲取用戶先前的嘗試記錄
        try {
          const attemptsResponse = await getAttemptsForQuiz(quizId);
          if (attemptsResponse && attemptsResponse.length > 0) {
            setPreviousAttempts(attemptsResponse);
            
            // 檢查是否達到嘗試次數上限
            if (!isFaculty) {
              const completedAttempts = attemptsResponse.filter(
                (att: Attempt) => att.completed
              );
              
              if (!quizData.multipleAttempts && completedAttempts.length > 0) {
                setAttemptLimitReached(true);
                // 載入最後一次嘗試的答案
                const lastAttempt = completedAttempts[0]; // 已按時間排序
                if (lastAttempt.answers && lastAttempt.answers.length > 0) {
                  setUserAnswers(lastAttempt.answers);
                  setScore(lastAttempt.score);
                  setShowResults(true);
                  setAttempt(lastAttempt);
                }
              } else if (quizData.multipleAttempts && 
                completedAttempts.length >= quizData.attemptsAllowed) {
                setAttemptLimitReached(true);
                // 載入最後一次嘗試的答案
                const lastAttempt = completedAttempts[0]; // 已按時間排序
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
              // 教師預覽模式
              setUserAnswers(initialAnswers);
            }
          } else {
            setUserAnswers(initialAnswers);
          }
        } catch (attemptsErr) {
          console.error('獲取測驗嘗試記錄失敗:', attemptsErr);
          setUserAnswers(initialAnswers);
        }
        
        // 只有在未達到嘗試上限且不是查看歷史嘗試時才建立新的嘗試
        if (!attemptLimitReached && !isViewingAttempt && !showResults) {
          try {
            const attemptResponse = await createAttempt(quizId);
            setAttempt(attemptResponse);
            setStartTime(new Date(attemptResponse.startTime));
          } catch (attemptErr: any) {
            if (attemptErr.response && attemptErr.response.status === 400 && 
                attemptErr.response.data.message === "已達到嘗試次數上限") {
              setAttemptLimitReached(true);
            } else {
              console.error('無法創建測驗嘗試:', attemptErr);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || '載入測驗失敗');
        console.error('載入測驗失敗:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizAndAttempts();
    
    // 清理函數
    return () => {
      if (timerInterval) {
        window.clearInterval(timerInterval);
      }
    };
  }, [quizId, attemptLimitReached, isViewingAttempt, currentUser]);

  // 設置計時器
  useEffect(() => {
    if (timeRemaining !== null && !showResults && !attemptLimitReached && !isViewingAttempt) {
      const timer = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev > 0) {
            return prev - 1;
          } else {
            // 時間到，自動提交
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

  // 格式化剩餘時間
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 處理回答變更
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

  // 移動到下一個問題
  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // 移動到上一個問題
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // 提交測驗
  const handleSubmitQuiz = async () => {
    if (!quiz || !attempt) return;
    
    try {
      // 計算分數
      let totalScore = 0;
      
      const scoredAnswers = userAnswers.map((answer, index) => {
        const question = quiz.questions[index];
        let isCorrect = false;
        
        if (question.questionType === 'MULTIPLE_CHOICE' && question.choices) {
          // 檢查選擇題答案
          const correctChoice = question.choices.find(choice => choice.isCorrect);
          isCorrect = correctChoice ? answer.answerChoice === correctChoice.id : false;
        } else if (question.questionType === 'TRUE_FALSE') {
          // 檢查是非題答案
          isCorrect = answer.answerBoolean === question.correctAnswer;
        } else if (question.questionType === 'FILL_BLANK' && question.correctAnswers) {
          // 檢查填空題答案
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
      
      // 提交嘗試
      const attemptData = {
        answers: scoredAnswers,
        score: totalScore,
        completed: true,
        endTime: new Date()
      };
      
      await submitAttempt(attempt._id, attemptData);
      
      // 顯示結果
      setShowResults(true);
      
      // 停止計時器
      if (timerInterval) {
        window.clearInterval(timerInterval);
      }
      
      // 重新獲取嘗試記錄
      const attemptsResponse = await getAttemptsForQuiz(quizId as string);
      setPreviousAttempts(attemptsResponse);
      
      // 檢查是否達到嘗試次數上限
      if (!isPreviewMode) {
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
      setError(err.message || '提交測驗失敗');
      console.error('提交測驗失敗:', err);
    }
  };

  // 導航到編輯頁面
  const handleEditQuiz = () => {
    navigate(`/Kambaz/Quizzes/${quizId}/edit`);
  };

  // 重新開始測驗
  const handleRestartQuiz = () => {
    if (attemptLimitReached && !isPreviewMode) {
      setError('您已達到此測驗的嘗試次數上限');
      return;
    }
    
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setIsViewingAttempt(false);
    
    // 重置回答
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
    
    // 重設時間
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60);
    }
    
    // 重新創建嘗試
    const createNewAttempt = async () => {
      if (!quizId) return;
      
      try {
        const attemptResponse = await createAttempt(quizId);
        setAttempt(attemptResponse);
        setStartTime(new Date(attemptResponse.startTime));
      } catch (err: any) {
        if (err.response && err.response.status === 400 && 
            err.response.data.message === "已達到嘗試次數上限") {
          setAttemptLimitReached(true);
          setError('您已達到此測驗的嘗試次數上限');
        } else {
          console.error('無法創建新的測驗嘗試:', err);
        }
      }
    };
    
    createNewAttempt();
  };

  // 查看特定嘗試的答案
  const viewAttempt = (attemptToView: Attempt) => {
    setIsViewingAttempt(true);
    setShowResults(true);
    setShowAttemptsHistory(false);
    setAttempt(attemptToView);
    setScore(attemptToView.score);
    setUserAnswers(attemptToView.answers);
    setStartTime(new Date(attemptToView.startTime));
  };

  // 渲染測驗信息
  const renderQuizInfo = () => {
    if (!quiz) return null;
    
    const attemptsUsed = previousAttempts.filter(a => a.completed).length;
    const attemptsRemaining = quiz.multipleAttempts ? 
      Math.max(0, quiz.attemptsAllowed - attemptsUsed) : 
      (attemptsUsed > 0 ? 0 : 1);
    
    return (
      <Card className="mb-4 quiz-info-card">
        <Card.Header className={isPreviewMode ? "bg-warning text-dark" : "bg-primary text-white"}>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              {isPreviewMode ? (
                <>
                  <FaExclamationTriangle className="me-2" />
                  這是測驗的預覽版本
                </>
              ) : (
                <>
                  <FaUser className="me-2" />
                  學生測驗
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
                查看嘗試歷史
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <small className="text-muted">
            {isViewingAttempt ? '嘗試時間: ' : '開始時間: '}
            {startTime.toLocaleString()}
          </small>
          <h2 className="mb-3">{quiz.title}</h2>
          <div className="quiz-description mb-3">{quiz.description}</div>
          <div className="d-flex justify-content-between flex-wrap mb-2">
            <div>
              <Badge bg="info" className="me-2">總分: {quiz.totalPoints} 分</Badge>
              <Badge bg="secondary" className="me-2">時間限制: {quiz.timeLimit} 分鐘</Badge>
              <Badge bg="secondary">問題數量: {quiz.questions.length}</Badge>
              {!isPreviewMode && (
                <Badge bg={attemptsRemaining > 0 ? "success" : "danger"} className="ms-2">
                  剩餘嘗試次數: {attemptsRemaining}
                </Badge>
              )}
            </div>
            <div>
              {timeRemaining !== null && !showResults && !attemptLimitReached && !isViewingAttempt && (
                <div className="timer">
                  剩餘時間: <strong>{formatTimeRemaining(timeRemaining)}</strong>
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
            <h5>測驗說明</h5>
            {isPreviewMode ? (
              <p>這是預覽模式。您可以回答問題並提交測驗，系統會計算您的分數。</p>
            ) : (
              <>
                <p>完成所有問題並提交測驗。系統會自動計算您的分數。</p>
                {quiz.multipleAttempts && (
                  <p>此測驗允許多次嘗試，最多 {quiz.attemptsAllowed} 次。</p>
                )}
              </>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  // 渲染多選題
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
                回答正確！得分 {question.points} 分
              </div>
            ) : (
              <div className="text-danger">
                <FaTimesCircle className="me-2" />
                回答錯誤！正確答案是：
                {question.choices.find(c => c.isCorrect)?.text}
              </div>
            )}
          </div>
        )}
      </Form.Group>
    );
  };

  // 渲染是非題
  const renderTrueFalseQuestion = (question: Question, questionIndex: number) => {
    return (
      <Form.Group className="mb-4">
        <Form.Label className="question-text">{question.questionText}</Form.Label>
        <div>
          <Form.Check
            type="radio"
            id={`question-${questionIndex}-true`}
            name={`question-${questionIndex}`}
            label="是"
            checked={userAnswers[questionIndex]?.answerBoolean === true}
            onChange={() => handleAnswerChange(questionIndex, true, 'boolean')}
            className="mb-2"
            disabled={showResults || attemptLimitReached || isViewingAttempt}
          />
          <Form.Check
            type="radio"
            id={`question-${questionIndex}-false`}
            name={`question-${questionIndex}`}
            label="否"
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
                回答正確！得分 {question.points} 分
              </div>
            ) : (
              <div className="text-danger">
                <FaTimesCircle className="me-2" />
                回答錯誤！正確答案是：{question.correctAnswer ? '是' : '否'}
              </div>
            )}
          </div>
        )}
      </Form.Group>
    );
  };

  // 渲染填空題
  const renderFillBlankQuestion = (question: Question, questionIndex: number) => {
    return (
      <Form.Group className="mb-4">
        <Form.Label className="question-text">{question.questionText}</Form.Label>
        <Form.Control
          type="text"
          placeholder="在此輸入您的答案"
          value={userAnswers[questionIndex]?.answerText || ''}
          onChange={(e) => handleAnswerChange(questionIndex, e.target.value, 'text')}
          disabled={showResults || attemptLimitReached || isViewingAttempt}
        />
        {showResults && (
          <div className="mt-3 p-3 result-feedback">
            {userAnswers[questionIndex]?.isCorrect ? (
              <div className="text-success">
                <FaCheckCircle className="me-2" />
                回答正確！得分 {question.points} 分
              </div>
            ) : (
              <div className="text-danger">
                <FaTimesCircle className="me-2" />
                回答錯誤！可接受的答案：
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

  // 根據問題類型渲染不同的問題表單
  const renderQuestion = (question: Question, questionIndex: number) => {
    switch (question.questionType) {
      case 'MULTIPLE_CHOICE':
        return renderMultipleChoiceQuestion(question, questionIndex);
      case 'TRUE_FALSE':
        return renderTrueFalseQuestion(question, questionIndex);
      case 'FILL_BLANK':
        return renderFillBlankQuestion(question, questionIndex);
      default:
        return <div>不支持的問題類型</div>;
    }
  };

  // 渲染結果摘要
  const renderResultSummary = () => {
    if (!quiz) return null;
    
    return (
      <Card className="mb-4 results-card">
        <Card.Header className="bg-primary text-white">
          <h3 className="mb-0">測驗結果</h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h1>{score} / {quiz.totalPoints}</h1>
            <h4>{Math.round((score / quiz.totalPoints) * 100) || 0}%</h4>
          </div>
          
          <h5>問題回答摘要</h5>
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
                        {question.questionType === 'MULTIPLE_CHOICE' ? '選擇題' : 
                         question.questionType === 'TRUE_FALSE' ? '是非題' : '填空題'}
                      </Badge>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    {userAnswers[index]?.isCorrect ? (
                      <>
                        <FaCheckCircle className="text-success me-2" />
                        <span>{question.points} 分</span>
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="text-danger me-2" />
                        <span>0 分</span>
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
                重新開始測驗
              </Button>
            )}
            {attemptLimitReached && !isPreviewMode && !isViewingAttempt && (
              <Alert variant="warning" className="mb-0">
                您已達到此測驗的嘗試次數上限
              </Alert>
            )}
            {isViewingAttempt && (
              <Button variant="secondary" onClick={() => {
                setIsViewingAttempt(false);
                setShowResults(false);
                setShowAttemptsHistory(true);
              }}>
                返回嘗試歷史
              </Button>
            )}
            {isPreviewMode && (
              <Button variant="outline-primary" onClick={handleEditQuiz}>
                <FaEdit className="me-1" /> 編輯測驗
              </Button>
            )}
          </div>
        </Card.Footer>
      </Card>
    );
  };

  // 渲染嘗試歷史記錄
  const renderAttemptsHistory = () => {
    return (
      <Modal 
        show={showAttemptsHistory} 
        onHide={() => setShowAttemptsHistory(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>測驗嘗試歷史</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previousAttempts.length === 0 ? (
            <Alert variant="info">
              您還沒有任何測驗嘗試記錄。
            </Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>日期</th>
                  <th>分數</th>
                  <th>百分比</th>
                  <th>狀態</th>
                  <th>操作</th>
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
                        <Badge bg="success">已完成</Badge>
                      ) : (
                        <Badge bg="warning">未完成</Badge>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => viewAttempt(attempt)}
                      >
                        查看詳情
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
              關閉
            </Button>
            {!attemptLimitReached && (
              <Button variant="primary" onClick={() => {
                setShowAttemptsHistory(false);
                setIsViewingAttempt(false);
                setShowResults(false);
                handleRestartQuiz();
              }}>
                開始新嘗試
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>
    );
  };

  // 渲染單個問題視圖（當 oneQuestionAtTime 為 true 時）
  const renderSingleQuestionView = () => {
    if (!quiz || !quiz.questions.length) return null;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    
    return (
      <>
        <Card className="mb-4 question-card">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">問題 {currentQuestionIndex + 1}</h4>
            <Badge bg="primary">{currentQuestion.points} 分</Badge>
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
            <FaArrowLeft className="me-1" /> 上一題
          </Button>
          
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button 
              variant="primary" 
              onClick={handleNextQuestion}
              disabled={showResults || attemptLimitReached || isViewingAttempt}
            >
              下一題 <FaArrowRight className="ms-1" />
            </Button>
          ) : (
            <Button 
              variant="success" 
              onClick={handleSubmitQuiz}
              disabled={showResults || attemptLimitReached || isViewingAttempt}
            >
              <FaSave className="me-1" /> 提交測驗
            </Button>
          )}
        </div>
      </>
    );
  };

  // 渲染所有問題視圖（當 oneQuestionAtTime 為 false 時）
  const renderAllQuestionsView = () => {
    if (!quiz) return null;
    
    return (
      <>
        <div className="questions-container">
          {quiz.questions.map((question, index) => (
            <Card key={index} className="mb-4 question-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">問題 {index + 1}</h4>
                <Badge bg="primary">{question.points} 分</Badge>
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
            <FaSave className="me-1" /> 提交測驗
          </Button>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">載入中...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>發生錯誤</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate(-1)}>返回</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <Alert.Heading>找不到測驗</Alert.Heading>
          <p>無法找到指定的測驗。請確保測驗ID正確。</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-warning" onClick={() => navigate(-1)}>返回</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4 quiz-preview-container">
      {/* 測驗標題與信息區 */}
      {renderQuizInfo()}
      
      {/* 結果摘要（提交後顯示） */}
      {showResults ? (
        renderResultSummary()
      ) : (
        /* 根據測驗設置決定顯示單個問題還是所有問題 */
        quiz.oneQuestionAtTime ? renderSingleQuestionView() : renderAllQuestionsView()
      )}
      
      {/* 嘗試歷史記錄對話框 */}
      {renderAttemptsHistory()}
      
      {/* 底部編輯按鈕（僅預覽模式） */}
      {!showResults && isPreviewMode && (
        <div className="mt-4 text-center">
          <Button 
            variant="outline-primary" 
            onClick={handleEditQuiz}
          >
            <FaEdit className="me-1" /> 編輯測驗
          </Button>
        </div>
      )}
    </Container>
  );
};

export default QuizPreview; 