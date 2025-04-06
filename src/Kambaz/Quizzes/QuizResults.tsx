import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button, ProgressBar, ListGroup, Badge } from 'react-bootstrap';
import axios from 'axios';
import { FaHome, FaArrowRight } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

function QuizResults() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    
    const fetchResults = async () => {
      try {
        setLoading(true);
        // 獲取嘗試詳情
        const attemptResponse = await axios.get(`${API_BASE}/attempts/${attemptId}`, { withCredentials: true });
        setAttempt(attemptResponse.data);
        
        // 獲取測驗詳情
        const quizResponse = await axios.get(`${API_BASE}/quizzes/${attemptResponse.data.quiz}`, { withCredentials: true });
        setQuiz(quizResponse.data);
      } catch (err: any) {
        setError(err.message || '獲取結果失敗');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [attemptId]);

  // 計算得分百分比
  const calculatePercentage = () => {
    if (!attempt || !quiz) return 0;
    return Math.round((attempt.score / quiz.totalPoints) * 100);
  };

  const getScoreColor = () => {
    const percentage = calculatePercentage();
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  if (loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">錯誤: {error}</div>;
  if (!attempt || !quiz) return <div>找不到結果</div>;

  const scorePercentage = calculatePercentage();
  const scoreColor = getScoreColor();

  return (
    <Container className="my-4">
      <Card className="mb-4">
        <Card.Header>
          <h3>測驗結果</h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h4>{quiz.title}</h4>
            <p>{quiz.description}</p>
          </div>
          
          <div className="text-center my-4">
            <h2>
              <Badge bg={scoreColor}>
                得分: {attempt.score} / {quiz.totalPoints} ({scorePercentage}%)
              </Badge>
            </h2>
            <ProgressBar 
              variant={scoreColor} 
              now={scorePercentage} 
              label={`${scorePercentage}%`} 
              className="mt-2"
              style={{ height: '2rem' }}
            />
          </div>
          
          <Alert variant="info" className="mt-4">
            <div className="d-flex justify-content-between">
              <div>
                <strong>完成時間:</strong> {new Date(attempt.endTime).toLocaleString()}
              </div>
              <div>
                <strong>用時:</strong> {
                  Math.round((new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 60000)
                } 分鐘
              </div>
            </div>
          </Alert>
          
          <h5 className="mt-4 mb-3">問題回顧</h5>
          {attempt.answers.map((answer: any, index: number) => {
            const question = quiz.questions.find((q: any) => q._id === answer.question);
            if (!question) return null;
            
            return (
              <Card key={index} className="mb-3" border={answer.isCorrect ? 'success' : 'danger'}>
                <Card.Header className="d-flex justify-content-between">
                  <div>問題 {index + 1}: {question.title}</div>
                  <Badge bg={answer.isCorrect ? 'success' : 'danger'}>
                    {answer.isCorrect ? '正確' : '錯誤'} ({answer.isCorrect ? question.points : 0}/{question.points}分)
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Card.Text>{question.questionText}</Card.Text>
                  
                  <div className="mt-3">
                    <strong>你的答案:</strong>
                    {question.questionType === 'MULTIPLE_CHOICE' && (
                      <div>
                        {question.choices.find((c: any) => c._id === answer.answerChoice)?.text || '未回答'}
                      </div>
                    )}
                    
                    {question.questionType === 'TRUE_FALSE' && (
                      <div>{answer.answerBoolean === true ? '是' : answer.answerBoolean === false ? '否' : '未回答'}</div>
                    )}
                    
                    {question.questionType === 'FILL_BLANK' && (
                      <div>{answer.answerText || '未回答'}</div>
                    )}
                  </div>
                  
                  {quiz.showCorrectAnswers && !answer.isCorrect && (
                    <div className="mt-2 text-success">
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
        </Card.Body>
        <Card.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => navigate(`/courses/${quiz.course}`)}>
            <FaHome className="me-1" /> 返回課程
          </Button>
          
          {quiz.multipleAttempts && (
            <Button variant="primary" onClick={() => navigate(`/quizzes/${quiz._id}`)}>
              再次嘗試 <FaArrowRight className="ms-1" />
            </Button>
          )}
        </Card.Footer>
      </Card>
    </Container>
  );
}

export default QuizResults;