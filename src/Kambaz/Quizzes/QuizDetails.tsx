import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById, publishQuiz, unpublishQuiz, createAttempt } from './api';
import { Container, Button, Card, Badge, ListGroup, Alert } from 'react-bootstrap';
import { FaEdit, FaPlay, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  quizType: string;
  totalPoints: number;
  published: boolean;
  timeLimit: number;
  shuffleAnswers: boolean;
  multipleAttempts: boolean;
  attemptsAllowed: number;
  showCorrectAnswers: boolean;
  questions: Array<{
    _id: string;
    title: string;
    questionType: string;
    questionText: string;
    points: number;
  }>;
}

function QuizDetails() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 從會話存儲中獲取當前用戶
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }

    if (!quizId) return;

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await getQuizById(quizId);
        setQuiz(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || '獲取測驗詳情失敗');
        console.error('獲取測驗詳情出錯:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleEditQuiz = () => {
    navigate(`/quizzes/${quizId}/edit`);
  };

  const handlePublishToggle = async () => {
    if (!quiz) return;
    
    try {
      const response = quiz.published 
        ? await unpublishQuiz(quiz._id)
        : await publishQuiz(quiz._id);
      
      setQuiz(response.data);
    } catch (err: any) {
      setError(`${quiz.published ? '取消發布' : '發布'}測驗失敗: ${err.message}`);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz) return;
    
    try {
      const response = await createAttempt(quiz._id);
      navigate(`/quizzes/${quiz._id}/attempt`, { 
        state: { attemptId: response.data._id } 
      });
    } catch (err: any) {
      setError(`開始測驗失敗: ${err.message}`);
    }
  };

  if (loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">錯誤: {error}</div>;
  if (!quiz) return <div>找不到測驗</div>;

  const isTeacher = user && user.role === 'FACULTY';

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{quiz.title}</h2>
        <div>
          {isTeacher && (
            <>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={handleEditQuiz}
              >
                <FaEdit className="me-1" /> 編輯測驗
              </Button>
              <Button 
                variant={quiz.published ? "outline-secondary" : "outline-success"}
                onClick={handlePublishToggle}
              >
                {quiz.published ? '取消發布' : '發布測驗'}
              </Button>
            </>
          )}
          {!isTeacher && quiz.published && (
            <Button 
              variant="success" 
              onClick={handleStartQuiz}
            >
              <FaPlay className="me-1" /> 開始測驗
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between">
            <div>
              <Badge bg={quiz.published ? "success" : "secondary"} className="me-2">
                {quiz.published ? "已發布" : "未發布"}
              </Badge>
              <Badge bg="info">{quiz.quizType}</Badge>
            </div>
            <div>
              <Badge bg="primary">總分: {quiz.totalPoints}</Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Card.Text>{quiz.description}</Card.Text>
          
          <h5 className="mt-4">測驗設置</h5>
          <ListGroup variant="flush" className="mb-3">
            <ListGroup.Item>
              <strong>時間限制:</strong> {quiz.timeLimit} 分鐘
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>隨機排序答案:</strong> 
              {quiz.shuffleAnswers ? 
                <FaCheckCircle className="ms-2 text-success" /> : 
                <FaTimesCircle className="ms-2 text-danger" />
              }
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>允許多次嘗試:</strong> 
              {quiz.multipleAttempts ? 
                <span><FaCheckCircle className="ms-2 text-success" /> (最多 {quiz.attemptsAllowed} 次)</span> : 
                <FaTimesCircle className="ms-2 text-danger" />
              }
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>顯示正確答案:</strong> 
              {quiz.showCorrectAnswers ? 
                <FaCheckCircle className="ms-2 text-success" /> : 
                <FaTimesCircle className="ms-2 text-danger" />
              }
            </ListGroup.Item>
          </ListGroup>

          <h5 className="mt-4">測驗問題 ({quiz.questions.length})</h5>
          {quiz.questions.length === 0 ? (
            <Alert variant="warning">此測驗尚無問題</Alert>
          ) : (
            <ListGroup>
              {quiz.questions.map((question, index) => (
                <ListGroup.Item key={question._id}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>問題 {index + 1}:</strong> {question.title}
                      <div><small>{question.questionText}</small></div>
                    </div>
                    <Badge bg="primary">{question.points} 分</Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default QuizDetails;