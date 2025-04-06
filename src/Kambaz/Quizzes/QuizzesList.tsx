import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizzesForCourse, testQuizAPI } from './api';
import { Button, Card, Container, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaEye } from 'react-icons/fa';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  quizType: string;
  totalPoints: number;
  published: boolean;
  dueDate?: Date;
  questions: any[];
}

function QuizzesList() {
  const { cid } = useParams<{ cid: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cid) return;

    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError(null); // 清除之前的錯誤
        
        console.log(`開始獲取課程 ${cid} 的測驗列表`);
        
        // 使用測試 API 獲取數據
        const data = await testQuizAPI(cid);
        console.log('測試 API 返回數據:', data);
        
        // 確保 data 是一個數組或包含 quiz 屬性
        if (data && data.quiz) {
          // 如果返回的是帶有 quiz 屬性的對象
          const quizData = Array.isArray(data.quiz) ? data.quiz : [data.quiz];
          console.log(`成功載入 ${quizData.length} 個測驗`);
          setQuizzes(quizData);
        } else if (Array.isArray(data)) {
          // 如果直接返回數組
          console.log(`成功載入 ${data.length} 個測驗`);
          setQuizzes(data);
        } else {
          // 如果是其他格式
          console.warn('意外的數據格式:', data);
          setQuizzes([]); // 設置為空數組
        }
        
      } catch (err: any) {
        console.error('獲取測驗列表出錯:', err);
        setError(err.message || '獲取測驗列表失敗');
        
        // 仍然設置為空數組，避免顯示舊數據
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [cid]);

  const handleCreateQuiz = () => {
    console.log('創建新測驗按鈕點擊，課程ID:', cid);
    
    // 使用絕對路徑，以 / 開頭
    const newQuizPath = `/Kambaz/Courses/${cid}/Quizzes/new`;
    console.log(`嘗試導航到:`, newQuizPath);
    
    try {
      // 方法1：使用 navigate - 使用絕對路徑
      navigate(newQuizPath);
    } catch (err) {
      console.error('navigate 導航錯誤:', err);
      
      // 方法2：使用 window.location - 確保 hash 格式正確
      window.location.href = `#${newQuizPath}`;
    }
  };

  const handleEditQuiz = (quizId: string) => {
    // 使用絕對路徑
    navigate(`/Kambaz/Quizzes/${quizId}/edit`);
  };

  const handleViewQuiz = (quizId: string) => {
    // 使用絕對路徑
    navigate(`/Kambaz/Quizzes/${quizId}`);
  };

  if (loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">錯誤: {error}</div>;

  // 使用可選鏈操作和默認值，避免 undefined 錯誤
  const hasQuizzes = quizzes?.length > 0;

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>課程測驗</h2>
        <div>
          {/* 添加測試連結 - 可直接點擊訪問 */}
          <a href={`#/Kambaz/Courses/${cid}/Quizzes/new`} className="btn btn-warning me-2">
            測試直接鏈接
          </a>
          <Button 
            variant="primary" 
            onClick={handleCreateQuiz}
            className="d-flex align-items-center"
            style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
          >
            <FaPlus className="me-2" /> 創建測驗
          </Button>
        </div>
      </div>

      {/* 顯示當前 cid 值，方便調試 */}
      <div className="bg-light p-2 mb-3">
        <small>當前課程ID: {cid || '未知'}</small>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {!hasQuizzes ? (
        <div className="text-center my-5 p-5 border rounded bg-light">
          <p className="mb-4">此課程暫無測驗</p>
          <Button 
            variant="outline-primary" 
            size="lg"
            onClick={handleCreateQuiz}
          >
            <FaPlus className="me-2" /> 創建第一個測驗
          </Button>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {quizzes.map((quiz) => (
            <Col key={quiz._id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <Badge bg={quiz.published ? "success" : "secondary"}>
                      {quiz.published ? "已發布" : "未發布"}
                    </Badge>
                    <Badge bg="info">{quiz.quizType}</Badge>
                  </div>
                  <Card.Title>{quiz.title}</Card.Title>
                  <Card.Text>{quiz.description}</Card.Text>
                  <div className="d-flex justify-content-between">
                    <small className="text-muted">總分: {quiz.totalPoints || 0}</small>
                    <small className="text-muted">問題數: {quiz.questions?.length || 0}</small>
                  </div>
                </Card.Body>
                <Card.Footer className="bg-white">
                  <div className="d-flex justify-content-between">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleViewQuiz(quiz._id)}
                    >
                      <FaEye className="me-1" /> 查看
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleEditQuiz(quiz._id)}
                    >
                      <FaEdit className="me-1" /> 編輯
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 底部固定的創建按鈕 - 確保總是可見 */}
      <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1000 }}>
        <Button 
          variant="primary" 
          size="lg" 
          className="rounded-circle" 
          style={{ width: '60px', height: '60px' }}
          onClick={handleCreateQuiz}
        >
          <FaPlus size={24} />
        </Button>
      </div>
    </Container>
  );
}

export default QuizzesList;