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
  
  // 從 location 中獲取傳遞的參數
  const attemptId = location.state?.attemptId;
  const score = location.state?.score;
  const totalPoints = location.state?.totalPoints;

  useEffect(() => {
    if (!quizId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 獲取測驗詳情
        const quizResponse = await getQuizById(quizId);
        setQuiz(quizResponse.data);
        
        // 獲取所有測驗嘗試記錄
        const attemptsResponse = await getAttemptsForQuiz(quizId);
        if (Array.isArray(attemptsResponse) && attemptsResponse.length > 0) {
          // 按創建時間排序，最新的在前
          const sortedAttempts = attemptsResponse.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setAllAttempts(sortedAttempts);
          
          // 如果有從 location 傳來的 attemptId，則使用該嘗試
          // 否則使用最新的嘗試
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
        console.error('獲取測驗結果數據失敗:', err);
        setError(err.message || '獲取測驗結果失敗');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [quizId, attemptId]);

  // 計算得分百分比
  const calculatePercentage = (score: number, totalPoints: number) => {
    if (!score || !totalPoints) return 0;
    return Math.round((score / totalPoints) * 100);
  };

  // 根據分數百分比返回顏色
  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  // 計算測驗用時（分鐘）
  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    return Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);
  };

  // 查看指定的嘗試記錄
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
          <span className="visually-hidden">載入中...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
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

  if (!attempt || !quiz) {
    return (
      <Container className="my-4">
        <Alert variant="warning">
          <Alert.Heading>找不到測驗結果</Alert.Heading>
          <p>無法找到此測驗的嘗試記錄。請確保您已完成測驗。</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-warning" onClick={() => navigate(-1)}>返回</Button>
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
            <h3 className="mb-0">測驗結果</h3>
            {allAttempts.length > 1 && (
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => setShowAttemptsModal(true)}
              >
                查看所有嘗試 ({allAttempts.length})
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
              {attempt.score} / {quiz.totalPoints} 分 ({scorePercentage}%)
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
              <strong>完成時間:</strong> {new Date(attempt.endTime).toLocaleString()}
            </div>
            <div>
              <FaClock className="me-2" />
              <strong>用時:</strong> {duration} 分鐘
            </div>
          </Alert>
          
          <h5 className="mt-4 mb-3">問題回顧</h5>
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
                      <span className="question-number">問題 {index + 1}</span>
                      <span className="question-title">{question.title}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      {answer.isCorrect ? (
                        <>
                          <FaCheckCircle className="text-success me-2" />
                          <Badge bg="success">{question.points} 分</Badge>
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="text-danger me-2" />
                          <Badge bg="danger">0 分</Badge>
                        </>
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Card.Text className="question-text">{question.questionText}</Card.Text>
                    
                    <div className="mt-3">
                      <strong>你的答案:</strong>
                      {question.questionType === 'MULTIPLE_CHOICE' && (
                        <div className="user-answer">
                          {question.choices.find((c: any) => 
                            c._id === answer.answerChoice || c.id === answer.answerChoice
                          )?.text || '未回答'}
                        </div>
                      )}
                      
                      {question.questionType === 'TRUE_FALSE' && (
                        <div className="user-answer">
                          {answer.answerBoolean === true ? '是' : 
                           answer.answerBoolean === false ? '否' : '未回答'}
                        </div>
                      )}
                      
                      {question.questionType === 'FILL_BLANK' && (
                        <div className="user-answer">{answer.answerText || '未回答'}</div>
                      )}
                    </div>
                    
                    {quiz.showCorrectAnswers && !answer.isCorrect && (
                      <div className="mt-3 correct-answer-display">
                        <strong>正確答案:</strong>
                        {question.questionType === 'MULTIPLE_CHOICE' && (
                          <div>
                            {question.choices.find((c: any) => c.isCorrect)?.text || '無法顯示'}
                          </div>
                        )}
                        
                        {question.questionType === 'TRUE_FALSE' && (
                          <div>{question.correctAnswer ? '是' : '否'}</div>
                        )}
                        
                        {question.questionType === 'FILL_BLANK' && (
                          <div>{question.correctAnswers?.join(' 或 ') || '無法顯示'}</div>
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
            <FaArrowLeft className="me-1" /> 返回
          </Button>
          
          {quiz.multipleAttempts && !attemptLimitReached && (
            <Button 
              variant="primary" 
              onClick={() => navigate(`/Kambaz/Quizzes/${quiz._id}`)}
            >
              再次嘗試 <FaArrowRight className="ms-1" />
            </Button>
          )}
        </Card.Footer>
      </Card>
      
      {/* 嘗試歷史記錄對話框 */}
      <Modal 
        show={showAttemptsModal} 
        onHide={() => setShowAttemptsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>測驗嘗試歷史</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>日期</th>
                <th>分數</th>
                <th>百分比</th>
                <th>用時</th>
                <th>操作</th>
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
                  <td>{calculateDuration(att.startTime, att.endTime)} 分鐘</td>
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
                      {att._id === attempt._id ? '當前查看' : '查看'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAttemptsModal(false)}>
            關閉
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default QuizResults;