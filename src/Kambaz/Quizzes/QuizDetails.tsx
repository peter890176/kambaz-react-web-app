import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById, publishQuiz, unpublishQuiz, createAttempt } from './api';
import { Container, Button, Card, Badge, ListGroup, Alert, Row, Col, Table } from 'react-bootstrap';
import { FaEdit, FaPlay, FaEye, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaLock } from 'react-icons/fa';
import './QuizDetails.css';

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
  accessCode: string;
  oneQuestionAtTime: boolean;
  webcamRequired: boolean;
  lockQuestionsAfterAnswering: boolean;
  dueDate?: Date;
  availableDate?: Date;
  untilDate?: Date;
  assignmentGroup: string;
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
    navigate(`/Kambaz/Quizzes/${quizId}/edit`);
  };

  const handlePreviewQuiz = () => {
    navigate(`/Kambaz/Quizzes/${quizId}/preview`);
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
      navigate(`/Kambaz/Quizzes/${quiz._id}/attempt`, { 
        state: { attemptId: response.data._id } 
      });
    } catch (err: any) {
      setError(`開始測驗失敗: ${err.message}`);
    }
  };

  // 格式化日期顯示
  const formatDate = (dateString?: Date) => {
    if (!dateString) return '未設定';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  if (loading) return (
    <Container className="text-center my-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">載入中...</span>
      </div>
    </Container>
  );

  if (error) return (
    <Container className="my-5">
      <Alert variant="danger">
        <Alert.Heading>發生錯誤</Alert.Heading>
        <p>{error}</p>
      </Alert>
    </Container>
  );

  if (!quiz) return (
    <Container className="my-5">
      <Alert variant="warning">
        <Alert.Heading>找不到測驗</Alert.Heading>
        <p>無法找到指定的測驗，請返回測驗列表頁面。</p>
      </Alert>
    </Container>
  );

  const isTeacher = user && user.role === 'FACULTY';
  const isStudent = !isTeacher;

  const getQuizTypeLabel = (type: string) => {
    switch (type) {
      case 'GRADED_QUIZ': return '計分測驗';
      case 'PRACTICE_QUIZ': return '練習測驗';
      case 'GRADED_SURVEY': return '計分問卷';
      case 'UNGRADED_SURVEY': return '不計分問卷';
      default: return type;
    }
  };

  const getAssignmentGroupLabel = (group: string) => {
    switch (group) {
      case 'QUIZZES': return '測驗';
      case 'EXAMS': return '考試';
      case 'ASSIGNMENTS': return '作業';
      case 'PROJECT': return '專案';
      default: return group;
    }
  };

  return (
    <Container className="my-4 quiz-details-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="page-title">{quiz.title}</h2>
        <div className="action-buttons">
          {isTeacher && (
            <>
              <Button 
                variant="outline-secondary" 
                className="me-2"
                onClick={handlePreviewQuiz}
              >
                <FaEye className="me-1" /> 預覽
              </Button>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={handleEditQuiz}
              >
                <FaEdit className="me-1" /> 編輯
              </Button>
            </>
          )}
          {isStudent && quiz.published && (
            <Button 
              variant="success" 
              onClick={handleStartQuiz}
            >
              <FaPlay className="me-1" /> 開始測驗
            </Button>
          )}
        </div>
      </div>

      <Card className="quiz-details-card mb-4">
        <Card.Header className="quiz-card-header">
          <div className="d-flex justify-content-between">
            <div>
              <Badge bg={quiz.published ? "success" : "secondary"} className="me-2">
                {quiz.published ? "已發布" : "未發布"}
              </Badge>
              <Badge bg="info">{getQuizTypeLabel(quiz.quizType)}</Badge>
            </div>
            <div>
              <Badge bg="primary">{quiz.totalPoints} 分</Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {quiz.description && (
            <Card.Text>{quiz.description}</Card.Text>
          )}

          <div className="quiz-properties">
            <h4 className="section-title">測驗設置</h4>
            
            <Table striped bordered responsive className="property-table">
              <tbody>
                <tr>
                  <td className="property-name">測驗類型</td>
                  <td>{getQuizTypeLabel(quiz.quizType || 'GRADED_QUIZ')}</td>
                </tr>
                <tr>
                  <td className="property-name">總分數</td>
                  <td>{quiz.totalPoints || 0} 分</td>
                </tr>
                <tr>
                  <td className="property-name">作業分組</td>
                  <td>{getAssignmentGroupLabel(quiz.assignmentGroup || 'QUIZZES')}</td>
                </tr>
                <tr>
                  <td className="property-name">隨機排序答案</td>
                  <td>
                    {quiz.shuffleAnswers ? 
                      <Badge bg="success">是</Badge> : 
                      <Badge bg="secondary">否</Badge>
                    }
                  </td>
                </tr>
                <tr>
                  <td className="property-name">時間限制</td>
                  <td>{quiz.timeLimit || 20} 分鐘</td>
                </tr>
                <tr>
                  <td className="property-name">允許多次嘗試</td>
                  <td>
                    {quiz.multipleAttempts ? 
                      <Badge bg="success">是 ({quiz.attemptsAllowed || 1} 次)</Badge> : 
                      <Badge bg="secondary">否</Badge>
                    }
                  </td>
                </tr>
                <tr>
                  <td className="property-name">顯示正確答案</td>
                  <td>
                    {quiz.showCorrectAnswers ? 
                      <Badge bg="success">是</Badge> : 
                      <Badge bg="secondary">否</Badge>
                    }
                  </td>
                </tr>
                <tr>
                  <td className="property-name">訪問碼</td>
                  <td>{quiz.accessCode ? quiz.accessCode : <span className="text-muted">無</span>}</td>
                </tr>
                <tr>
                  <td className="property-name">一次顯示一個問題</td>
                  <td>
                    {quiz.oneQuestionAtTime ? 
                      <Badge bg="success">是</Badge> : 
                      <Badge bg="secondary">否</Badge>
                    }
                  </td>
                </tr>
                <tr>
                  <td className="property-name">要求網路攝影機</td>
                  <td>
                    {quiz.webcamRequired ? 
                      <Badge bg="success">是</Badge> : 
                      <Badge bg="secondary">否</Badge>
                    }
                  </td>
                </tr>
                <tr>
                  <td className="property-name">回答後鎖定問題</td>
                  <td>
                    {quiz.lockQuestionsAfterAnswering ? 
                      <Badge bg="success">是</Badge> : 
                      <Badge bg="secondary">否</Badge>
                    }
                  </td>
                </tr>
              </tbody>
            </Table>

            <h4 className="section-title mt-4">時間設置</h4>
            
            <Table striped bordered responsive className="property-table">
              <tbody>
                <tr>
                  <td className="property-name">截止日期</td>
                  <td>{formatDate(quiz.dueDate)}</td>
                </tr>
                <tr>
                  <td className="property-name">開放日期</td>
                  <td>{formatDate(quiz.availableDate)}</td>
                </tr>
                <tr>
                  <td className="property-name">結束日期</td>
                  <td>{formatDate(quiz.untilDate)}</td>
                </tr>
              </tbody>
            </Table>

            <h4 className="section-title mt-4">測驗問題 ({quiz.questions.length || 0})</h4>
            {quiz.questions.length === 0 ? (
              <Alert variant="warning">此測驗尚無問題</Alert>
            ) : (
              <ListGroup className="question-list">
                {quiz.questions.map((question, index) => (
                  <ListGroup.Item key={question._id} className="question-item">
                    <div className="d-flex justify-content-between">
                      <div>
                        <span className="question-number">問題 {index + 1}:</span> {question.title}
                        <div className="question-text">{question.questionText}</div>
                      </div>
                      <Badge bg="primary" className="question-points">{question.points} 分</Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default QuizDetails;