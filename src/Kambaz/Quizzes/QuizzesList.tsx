import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getQuizzesForCourse, 
  deleteQuiz,
  publishQuiz,
  unpublishQuiz
} from './api';
import { 
  Button, 
  Container, 
  Row, 
  Col, 
  Badge, 
  Alert, 
  Card, 
  Dropdown, 
  Form,
  ListGroup, 
  Spinner,
  Modal
} from 'react-bootstrap';
import { 
  FaPlus, 
  FaEllipsisV, 
  FaBan, 
  FaCheck, 
  FaCalendarAlt,
  FaQuestionCircle
} from 'react-icons/fa';
import './QuizzesList.css'; // 引入樣式文件

// 測驗介面定義
interface Quiz {
  _id: string;
  title: string;
  description: string;
  totalPoints: number;
  published: boolean;
  dueDate?: Date;
  availableDate?: Date;
  untilDate?: Date;
  questions: any[];
  quizType: string;
}

// 學生嘗試介面
interface Attempt {
  _id: string;
  score: number;
  completed: boolean;
}

function QuizzesList() {
  const { cid } = useParams<{ cid: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'availableDate'>('name');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'instructor'>('instructor'); // 簡單起見，預設為講師
  const [studentAttempts, setStudentAttempts] = useState<Record<string, Attempt>>({});

  // 獲取測驗列表
  const fetchQuizzes = async () => {
    if (!cid) {
      setError("無法獲取課程 ID");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getQuizzesForCourse(cid);
      
      if (Array.isArray(data)) {
        setQuizzes(data);
      } else if (data && typeof data === 'object') {
        const quizData = Array.isArray(data.quizzes) ? data.quizzes : 
                        (Array.isArray(data.quiz) ? data.quiz : 
                        (data.quizzes || data.quiz ? [data.quizzes || data.quiz] : []));
        setQuizzes(quizData);
      } else {
        setQuizzes([]);
      }
    } catch (err: any) {
      console.error('獲取測驗列表出錯:', err);
      setError(err.message || '獲取測驗列表失敗');
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加載時獲取測驗
  useEffect(() => {
    fetchQuizzes();
  }, [cid]);

  // 創建新測驗
  const handleCreateQuiz = () => {
    navigate(`/Kambaz/Courses/${cid}/Quizzes/new`);
  };

  // 導航到測驗詳情頁面
  const handleViewQuiz = (quizId: string) => {
    navigate(`/Kambaz/Quizzes/${quizId}`);
  };

  // 導航到測驗編輯頁面
  const handleEditQuiz = (quizId: string) => {
    navigate(`/Kambaz/Quizzes/${quizId}/edit`);
  };

  // 刪除測驗確認
  const confirmDeleteQuiz = (quizId: string) => {
    setQuizToDelete(quizId);
    setShowDeleteModal(true);
  };

  // 刪除測驗
  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    try {
      setLoading(true);
      await deleteQuiz(quizToDelete);
      // 成功刪除後更新列表
      setQuizzes(quizzes.filter(quiz => quiz._id !== quizToDelete));
      setShowDeleteModal(false);
      setQuizToDelete(null);
    } catch (err: any) {
      console.error('刪除測驗失敗:', err);
      setError(err.message || '刪除測驗失敗');
    } finally {
      setLoading(false);
    }
  };

  // 發布/取消發布測驗
  const togglePublishQuiz = async (quizId: string, isPublished: boolean) => {
    try {
      setLoading(true);
      
      if (isPublished) {
        await unpublishQuiz(quizId);
      } else {
        await publishQuiz(quizId);
      }
      
      // 更新測驗列表中的狀態
      setQuizzes(quizzes.map(quiz => {
        if (quiz._id === quizId) {
          return { ...quiz, published: !isPublished };
        }
        return quiz;
      }));
    } catch (err: any) {
      console.error(`${isPublished ? '取消發布' : '發布'}測驗失敗:`, err);
      setError(err.message || `${isPublished ? '取消發布' : '發布'}測驗失敗`);
    } finally {
      setLoading(false);
    }
  };

  // 複製測驗到其他課程（optional）
  const handleCopyQuiz = (quizId: string) => {
    // 這裡可以打開一個模態框來選擇目標課程
    console.log('複製測驗:', quizId);
  };

  // 排序測驗
  const handleSort = (sortType: 'name' | 'dueDate' | 'availableDate') => {
    setSortBy(sortType);
    
    const sortedQuizzes = [...quizzes].sort((a, b) => {
      if (sortType === 'name') {
        return a.title.localeCompare(b.title);
      } else if (sortType === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      } else { // availableDate
        const dateA = a.availableDate ? new Date(a.availableDate).getTime() : Infinity;
        const dateB = b.availableDate ? new Date(b.availableDate).getTime() : Infinity;
        return dateA - dateB;
      }
    });
    
    setQuizzes(sortedQuizzes);
  };

  // 獲取測驗可用性狀態
  const getAvailabilityStatus = (quiz: Quiz) => {
    const now = new Date();
    const availableDate = quiz.availableDate ? new Date(quiz.availableDate) : null;
    const untilDate = quiz.untilDate ? new Date(quiz.untilDate) : null;
    
    if (availableDate && now < availableDate) {
      return { 
        status: '尚未開放', 
        label: `開放日期：${availableDate.toLocaleDateString()} ${availableDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        color: 'secondary'
      };
    }
    
    if (untilDate && now > untilDate) {
      return { 
        status: '已關閉', 
        label: '已結束',
        color: 'dark' 
      };
    }
    
    return { 
      status: '開放中', 
      label: '可用',
      color: 'success' 
    };
  };

  // 格式化日期顯示
  const formatDate = (dateString?: Date) => {
    if (!dateString) return '無截止日期';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  // 空狀態組件
  const EmptyState = () => (
    <Card className="empty-state-card">
      <Card.Body>
        <FaQuestionCircle className="empty-state-icon" />
        <Card.Title>尚無測驗</Card.Title>
        <Card.Text>點擊"+ 測驗"按鈕創建新測驗</Card.Text>
        <Button 
          variant="primary" 
          onClick={handleCreateQuiz}
          className="d-flex align-items-center mx-auto add-quiz-btn"
        >
          <FaPlus className="me-2" /> 新增測驗
        </Button>
      </Card.Body>
    </Card>
  );

  if (loading && quizzes.length === 0) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">載入中...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="quiz-list-container">
      <div className="quizzes-header">
        <h2>課程測驗</h2>
        <div className="d-flex gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" id="sort-dropdown" className="sort-dropdown">
              排序方式：{
                sortBy === 'name' ? '名稱' : 
                sortBy === 'dueDate' ? '截止日期' : '開放日期'
              }
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleSort('name')}>名稱</Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort('dueDate')}>截止日期</Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort('availableDate')}>開放日期</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button 
            variant="danger" 
            onClick={handleCreateQuiz}
            className="d-flex align-items-center add-quiz-btn"
          >
            <FaPlus className="me-2" /> 測驗
          </Button>
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {quizzes.length === 0 ? (
        <EmptyState />
      ) : (
        <ListGroup>
          {quizzes.map(quiz => {
            const availabilityInfo = getAvailabilityStatus(quiz);
            return (
              <ListGroup.Item key={quiz._id} className={`p-0 mb-2 border quiz-item ${quiz.published ? 'published' : 'unpublished'}`}>
                <Row className="m-0 p-0 align-items-center">
                  {/* 發布狀態圖標 */}
                  <Col xs={1} className="text-center py-3">
                    {quiz.published ? (
                      <div 
                        className="quiz-status-icon published" 
                        title="已發布，點擊取消發布"
                        onClick={() => togglePublishQuiz(quiz._id, true)}
                      >
                        <FaCheck />
                      </div>
                    ) : (
                      <div 
                        className="quiz-status-icon unpublished" 
                        title="未發布，點擊發布"
                        onClick={() => togglePublishQuiz(quiz._id, false)}
                      >
                        <FaBan />
                      </div>
                    )}
                  </Col>
                  
                  {/* 測驗信息（標題/類型等） */}
                  <Col xs={8} className="py-3">
                    <div 
                      className="quiz-title" 
                      onClick={() => handleViewQuiz(quiz._id)}
                    >
                      {quiz.title}
                    </div>
                    <div className="quiz-details">
                      <Badge bg={availabilityInfo.color as any}>{availabilityInfo.status}</Badge>
                      <span className="quiz-detail-item">
                        <FaCalendarAlt />
                        截止日期: {formatDate(quiz.dueDate)}
                      </span>
                      <span className="quiz-detail-item">{quiz.totalPoints} 分</span>
                      <span className="quiz-detail-item">{quiz.questions?.length || 0} 個問題</span>
                      {userRole === 'student' && studentAttempts[quiz._id] && (
                        <span className="quiz-detail-item fw-bold">
                          得分: {studentAttempts[quiz._id].score} / {quiz.totalPoints}
                        </span>
                      )}
                    </div>
                  </Col>
                  
                  {/* 右側操作按鈕 */}
                  <Col xs={3} className="d-flex justify-content-end py-3 pe-3 quiz-actions">
                    <Dropdown>
                      <Dropdown.Toggle variant="light" id={`dropdown-${quiz._id}`}>
                        <FaEllipsisV />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleEditQuiz(quiz._id)}>編輯</Dropdown.Item>
                        <Dropdown.Item onClick={() => confirmDeleteQuiz(quiz._id)}>刪除</Dropdown.Item>
                        <Dropdown.Item onClick={() => togglePublishQuiz(quiz._id, quiz.published)}>
                          {quiz.published ? '取消發布' : '發布'}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleCopyQuiz(quiz._id)}>複製到其他課程</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                </Row>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}
      
      {/* 刪除確認對話框 */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} className="delete-confirm-modal">
        <Modal.Header closeButton>
          <Modal.Title>確認刪除</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          您確定要刪除這個測驗嗎？此操作不可撤銷。
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            取消
          </Button>
          <Button variant="danger" onClick={handleDeleteQuiz}>
            刪除
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default QuizzesList;