import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizzesForCourse, getCurrentUserSession, testQuizAPI } from './api';
import { Button, Card, Container, Row, Col, Badge, Alert, ButtonGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaEye, FaSync, FaUser, FaVial, FaRoute } from 'react-icons/fa';

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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    if (!cid) {
      setError("無法獲取課程 ID");
      return;
    }
    
    try {
      setLoading(true);
      setError(null); // 清除之前的錯誤
      setDebugInfo(null); // 清除調試信息
      
      console.log(`開始獲取課程 ${cid} 的測驗列表`);
      
      // 使用正規 API 獲取數據
      const data = await getQuizzesForCourse(cid);
      console.log('API 返回數據:', data);
      
      // 添加調試信息
      setDebugInfo(`API 響應: ${JSON.stringify(data)}`);
      
      // 處理返回的數據
      if (Array.isArray(data)) {
        console.log(`成功載入 ${data.length} 個測驗`);
        setQuizzes(data);
      } else if (data && typeof data === 'object') {
        // 如果返回的是包含測驗數據的對象
        const quizData = Array.isArray(data.quizzes) ? data.quizzes : 
                        (Array.isArray(data.quiz) ? data.quiz : 
                        (data.quizzes || data.quiz ? [data.quizzes || data.quiz] : []));
        console.log(`成功載入 ${quizData.length} 個測驗`);
        setQuizzes(quizData);
      } else {
        // 如果是其他格式
        console.warn('意外的數據格式:', data);
        setQuizzes([]); // 設置為空數組
      }
      
    } catch (err: any) {
      console.error('獲取測驗列表出錯:', err);
      setError(err.message || '獲取測驗列表失敗');
      
      // 添加詳細的錯誤信息用於調試
      if (err.response) {
        setDebugInfo(`API 錯誤 (${err.response.status}): ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        setDebugInfo('未收到服務器響應，請檢查網絡連接和服務器狀態');
      }
      
      // 仍然設置為空數組，避免顯示舊數據
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  // 使用測試API獲取測驗
  const fetchQuizzesWithTestAPI = async () => {
    if (!cid) {
      setError("無法獲取課程 ID");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setDebugInfo("正在使用測試API獲取測驗列表...");
      
      const data = await testQuizAPI(cid);
      setDebugInfo(`測試API響應: ${JSON.stringify(data)}`);
      
      if (data && data.quiz) {
        const quizData = Array.isArray(data.quiz) ? data.quiz : [data.quiz];
        setQuizzes(quizData);
      } else if (Array.isArray(data)) {
        setQuizzes(data);
      } else {
        setQuizzes([]);
      }
    } catch (err: any) {
      console.error("測試API調用失敗:", err);
      setError("測試API調用失敗: " + (err.message || "未知錯誤"));
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  // 檢查用戶會話
  const checkUserSession = async () => {
    try {
      setLoading(true);
      setDebugInfo("正在獲取用戶會話信息...");
      
      const data = await getCurrentUserSession();
      setUserSession(data);
      setDebugInfo(`用戶會話信息: ${JSON.stringify(data)}`);
      
      return data;
    } catch (err: any) {
      console.error("獲取用戶會話失敗:", err);
      setError("獲取用戶會話失敗: " + (err.message || "未知錯誤"));
      setDebugInfo(`獲取用戶會話出錯: ${JSON.stringify(err)}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 檢查路由參數
  const checkRouteParams = () => {
    const location = window.location;
    const pathname = location.pathname;
    const hash = location.hash;
    const search = location.search;
    
    const routeData = {
      currentUrl: location.href,
      pathname,
      hash,
      search,
      params: { cid }, // 直接使用組件頂層已獲取的cid參數
      cid
    };
    
    setRouteInfo(JSON.stringify(routeData, null, 2));
    setDebugInfo(`路由參數: ${JSON.stringify(routeData)}`);
  };

  // 初始加載時獲取測驗
  useEffect(() => {
    console.log("QuizzesList組件掛載 - cid:", cid);
    fetchQuizzes();
    
    // 每次路由發生變化時輸出日誌
    const handleRouteChange = () => {
      console.log("URL已變更:", window.location.href);
      console.log("當前cid:", cid);
    };
    
    // 監聽路由變更
    window.addEventListener('hashchange', handleRouteChange);
    
    // 組件卸載時移除監聽器
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      console.log("QuizzesList組件卸載");
    };
  }, [cid]);

  const handleCreateQuiz = () => {
    console.log('創建新測驗按鈕點擊，課程ID:', cid);
    
    // 使用絕對路徑，以 / 開頭，確保大小寫一致
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
    // 使用絕對路徑，保持大小寫一致
    navigate(`/Kambaz/Quizzes/${quizId}/edit`);
  };

  const handleViewQuiz = (quizId: string) => {
    // 使用絕對路徑，保持大小寫一致
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
        <div className="d-flex">
          <ButtonGroup className="me-2">
            <Button 
              variant="outline-info" 
              onClick={checkUserSession}
              className="d-flex align-items-center"
              title="檢查用戶會話"
            >
              <FaUser className="me-1" /> 用戶
            </Button>
            <Button 
              variant="outline-info" 
              onClick={checkRouteParams}
              className="d-flex align-items-center"
              title="檢查路由參數"
            >
              <FaRoute className="me-1" /> 路由
            </Button>
            <Button 
              variant="outline-warning" 
              onClick={fetchQuizzesWithTestAPI}
              className="d-flex align-items-center"
              title="使用測試API獲取測驗"
            >
              <FaVial className="me-1" /> 測試API
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={fetchQuizzes}
              className="d-flex align-items-center"
              title="使用正規API獲取測驗"
            >
              <FaSync className="me-1" /> 刷新
            </Button>
          </ButtonGroup>
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

      {/* 顯示路由信息 */}
      {routeInfo && (
        <Alert variant="secondary" className="mb-3">
          <h6>路由信息:</h6>
          <div className="overflow-auto" style={{maxHeight: '150px'}}>
            <pre className="m-0"><small>{routeInfo}</small></pre>
          </div>
        </Alert>
      )}

      {/* 顯示用戶會話信息 */}
      {userSession && (
        <Alert variant="info" className="mb-3">
          <h6>用戶會話信息:</h6>
          <div className="overflow-auto" style={{maxHeight: '100px'}}>
            <pre className="m-0"><small>{JSON.stringify(userSession, null, 2)}</small></pre>
          </div>
        </Alert>
      )}

      {/* 顯示調試信息 */}
      {debugInfo && (
        <Alert variant="info" className="mb-3 overflow-auto" style={{maxHeight: '150px'}}>
          <small>{debugInfo}</small>
        </Alert>
      )}

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