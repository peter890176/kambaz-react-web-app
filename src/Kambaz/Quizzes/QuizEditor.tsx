import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Container, 
  Card, 
  Row, 
  Col, 
  Alert, 
  Nav, 
  Tab, 
  InputGroup,
  Badge,
  FormCheck 
} from 'react-bootstrap';
import { createQuiz, getQuizById, updateQuiz, publishQuiz } from './api';
import { 
  FaSave, 
  FaArrowLeft, 
  FaPlus, 
  FaTrash, 
  FaCalendarAlt, 
  FaLock, 
  FaClock,
  FaEye,
  FaCamera,
  FaRandom,
  FaLayerGroup,
  FaKey
} from 'react-icons/fa';
import './QuizEditor.css';
import QuestionEditor, { Question } from './QuestionEditor';

// 先創建一個簡化版本的編輯器，以後可以擴展功能

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
}

function QuizEditor() {
  const { cid, quizId } = useParams<{ cid?: string; quizId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // 測驗基本信息
  const [title, setTitle] = useState('未命名測驗');
  const [description, setDescription] = useState('');
  const [quizType, setQuizType] = useState('GRADED_QUIZ');
  const [timeLimit, setTimeLimit] = useState(20);
  const [shuffleAnswers, setShuffleAnswers] = useState(true);
  const [multipleAttempts, setMultipleAttempts] = useState(false);
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [oneQuestionAtTime, setOneQuestionAtTime] = useState(true);
  const [webcamRequired, setWebcamRequired] = useState(false);
  const [lockQuestionsAfterAnswering, setLockQuestionsAfterAnswering] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [assignmentGroup, setAssignmentGroup] = useState('QUIZZES');
  const [dueDate, setDueDate] = useState<string>('');
  const [availableDate, setAvailableDate] = useState<string>('');
  const [untilDate, setUntilDate] = useState<string>('');
  
  // 問題列表
  const [questions, setQuestions] = useState<Question[]>([]);

  // 如果是編輯模式，加載現有測驗數據
  useEffect(() => {
    if (quizId) {
      const fetchQuiz = async () => {
        try {
          setLoading(true);
          const response = await getQuizById(quizId);
          const quiz = response.data;
          
          // 填充表單
          setTitle(quiz.title || '未命名測驗');
          setDescription(quiz.description || '');
          setQuizType(quiz.quizType || 'GRADED_QUIZ');
          setTimeLimit(quiz.timeLimit || 20);
          setShuffleAnswers(quiz.shuffleAnswers !== undefined ? quiz.shuffleAnswers : true);
          setMultipleAttempts(quiz.multipleAttempts || false);
          setAttemptsAllowed(quiz.attemptsAllowed || 1);
          setShowCorrectAnswers(quiz.showCorrectAnswers || false);
          setQuestions(quiz.questions || []);
          setOneQuestionAtTime(quiz.oneQuestionAtTime !== undefined ? quiz.oneQuestionAtTime : true);
          setWebcamRequired(quiz.webcamRequired || false);
          setLockQuestionsAfterAnswering(quiz.lockQuestionsAfterAnswering || false);
          setAccessCode(quiz.accessCode || '');
          setAssignmentGroup(quiz.assignmentGroup || 'QUIZZES');
          
          // 處理日期格式
          if (quiz.dueDate) {
            setDueDate(formatDateForInput(new Date(quiz.dueDate)));
          }
          if (quiz.availableDate) {
            setAvailableDate(formatDateForInput(new Date(quiz.availableDate)));
          }
          if (quiz.untilDate) {
            setUntilDate(formatDateForInput(new Date(quiz.untilDate)));
          }
        } catch (err: any) {
          setError(err.message || '獲取測驗失敗');
        } finally {
          setLoading(false);
        }
      };
      
      fetchQuiz();
    }
  }, [quizId]);

  // 日期格式化函數
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 添加新問題
  const addQuestion = () => {
    const newQuestion: Question = {
      title: `問題 ${questions.length + 1}`,
      questionType: 'MULTIPLE_CHOICE',
      questionText: '',
      points: 1,
      choices: [
        { text: '選項 1', isCorrect: false },
        { text: '選項 2', isCorrect: false }
      ],
      isEditing: true  // 新問題默認為編輯模式
    };
    
    setQuestions([...questions, newQuestion]);
  };

  // 刪除問題
  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  // 更新問題
  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  // 計算總分
  const calculateTotalPoints = (): number => {
    return questions.reduce((total, question) => total + question.points, 0);
  };

  // 保存測驗
  const handleSave = async (e: React.FormEvent, shouldPublish: boolean = false) => {
    e.preventDefault();
    
    // 構建測驗數據
    const quizData = {
      title,
      description,
      quizType,
      timeLimit,
      shuffleAnswers,
      multipleAttempts,
      attemptsAllowed,
      showCorrectAnswers,
      oneQuestionAtTime,
      webcamRequired,
      lockQuestionsAfterAnswering,
      accessCode,
      assignmentGroup,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      availableDate: availableDate ? new Date(availableDate) : undefined,
      untilDate: untilDate ? new Date(untilDate) : undefined,
      questions: questions.map(q => {
        // 刪除 isEditing 屬性，確保不會保存到數據庫
        const { isEditing, ...questionData } = q;
        return questionData;
      }),
      course: cid
    };
    
    try {
      setLoading(true);
      setError(null);
      
      let savedQuiz: Quiz | undefined;
      
      if (quizId) {
        // 更新現有測驗
        const response = await updateQuiz(quizId, quizData);
        savedQuiz = response;
        setSuccess('測驗已成功更新');
      } else if (cid) {
        // 創建新測驗
        const response = await createQuiz(cid, quizData);
        savedQuiz = response;
        setSuccess('測驗已成功創建');
      }
      
      if (shouldPublish && savedQuiz) {
        try {
          // 發布測驗
          await publishQuiz(savedQuiz._id);
          setSuccess(prevSuccess => `${prevSuccess} 並已發布`);
          
          // 導航到測驗列表頁面
          setTimeout(() => {
            navigate(`/Kambaz/Courses/${cid}/Quizzes`);
          }, 1000);
        } catch (pubErr) {
          console.error("測驗發布失敗", pubErr);
          setError('測驗已保存，但發布失敗');
        }
      } else if (!shouldPublish) {
        // 如果不需要發布，則導航到測驗詳情頁面
        setTimeout(() => {
          if (quizId) {
            navigate(`/Kambaz/Quizzes/${quizId}`);
          } else if (savedQuiz) {
            navigate(`/Kambaz/Quizzes/${savedQuiz._id}`);
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error("保存測驗錯誤:", err);
      if (err.response) {
        setError(`保存測驗失敗 (${err.response.status}): ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        setError(`請求未收到響應: ${err.message} - 請確認服務器是否運行`);
      } else {
        setError(`錯誤: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 取消編輯
  const handleCancel = () => {
    if (cid) {
      navigate(`/Kambaz/Courses/${cid}/Quizzes`);
    } else if (quizId) {
      navigate(`/Kambaz/Quizzes/${quizId}`);
    }
  };

  if (loading && !title) return (
    <Container className="text-center my-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">載入中...</span>
      </div>
    </Container>
  );

  return (
    <Container className="my-4 quiz-editor-container">
      <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key || 'details')}>
        {/* 標題與主要操作按鈕 */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="page-title">{quizId ? '編輯測驗' : '創建新測驗'}</h2>
          <div className="action-buttons">
            <Button 
              variant="outline-secondary"
              className="me-2"
              onClick={handleCancel}
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              variant="outline-primary"
              className="me-2"
              onClick={(e) => handleSave(e)}
              disabled={loading}
            >
              <FaSave className="me-1" /> 保存
            </Button>
            <Button 
              variant="success"
              onClick={(e) => handleSave(e, true)}
              disabled={loading}
            >
              <FaSave className="me-1" /> 保存並發布
            </Button>
          </div>
        </div>

        {/* 錯誤與成功提示 */}
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* 測驗標題輸入 */}
        <Card className="mb-3">
          <Card.Body>
            <Form.Group className="mb-0">
              <Form.Control 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                required
                className="quiz-title-input"
                placeholder="測驗標題"
              />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* 選項卡導航 */}
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="details">詳細信息</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="questions">
              問題 
              <Badge bg="secondary" className="ms-2">{questions.length}</Badge>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* 選項卡內容 */}
        <Tab.Content>
          {/* 詳細信息選項卡 */}
          <Tab.Pane eventKey="details">
            <Form>
              <Card className="mb-4">
                <Card.Body>
                  {/* 測驗說明 - WYSIWYG 編輯器 */}
                  <Form.Group className="mb-4">
                    <Form.Label>測驗說明</Form.Label>
                    <div className="editor-toolbar">
                      <div className="btn-group">
                        <button type="button" className="btn btn-sm btn-outline-secondary">編輯</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary">查看</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary">插入</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary">格式</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary">工具</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary">表格</button>
                      </div>
                      <div className="btn-group ms-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary">B</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary"><i>I</i></button>
                        <button type="button" className="btn btn-sm btn-outline-secondary"><u>U</u></button>
                      </div>
                    </div>
                    <Form.Control 
                      as="textarea" 
                      rows={4} 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="輸入測驗說明..."
                    />
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      {/* 測驗類型 */}
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaLayerGroup className="me-2" />
                          測驗類型
                        </Form.Label>
                        <Form.Select 
                          value={quizType} 
                          onChange={(e) => setQuizType(e.target.value)}
                        >
                          <option value="GRADED_QUIZ">計分測驗</option>
                          <option value="PRACTICE_QUIZ">練習測驗</option>
                          <option value="GRADED_SURVEY">計分問卷</option>
                          <option value="UNGRADED_SURVEY">不計分問卷</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      {/* 總分數 */}
                      <Form.Group className="mb-3">
                        <Form.Label>總分數</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={calculateTotalPoints()}
                          disabled
                        />
                        <Form.Text className="text-muted">
                          總分數是所有問題分數的總和
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      {/* 作業分組 */}
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaLayerGroup className="me-2" />
                          作業分組
                        </Form.Label>
                        <Form.Select 
                          value={assignmentGroup} 
                          onChange={(e) => setAssignmentGroup(e.target.value)}
                        >
                          <option value="QUIZZES">測驗</option>
                          <option value="EXAMS">考試</option>
                          <option value="ASSIGNMENTS">作業</option>
                          <option value="PROJECT">專案</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      {/* 訪問碼 */}
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaKey className="me-2" />
                          訪問碼
                        </Form.Label>
                        <Form.Control 
                          type="text" 
                          value={accessCode} 
                          onChange={(e) => setAccessCode(e.target.value)}
                          placeholder="未設置"
                        />
                        <Form.Text className="text-muted">
                          可選：需要學生輸入的訪問碼
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />

                  <Row className="mb-3">
                    <Col md={6}>
                      {/* 時間限制 */}
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaClock className="me-2" />
                          時間限制
                        </Form.Label>
                        <InputGroup>
                          <Form.Control 
                            type="number" 
                            min="1"
                            value={timeLimit} 
                            onChange={(e) => setTimeLimit(parseInt(e.target.value) || 20)}
                          />
                          <InputGroup.Text>分鐘</InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      {/* 隨機排序答案 */}
                      <Form.Group className="mb-3 pt-2">
                        <Form.Check 
                          type="switch"
                          id="shuffle-answers"
                          label={<><FaRandom className="me-2" />隨機排序答案</>}
                          checked={shuffleAnswers}
                          onChange={(e) => setShuffleAnswers(e.target.checked)}
                        />
                      </Form.Group>

                      {/* 一次顯示一個問題 */}
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="one-question-at-time"
                          label="一次顯示一個問題"
                          checked={oneQuestionAtTime}
                          onChange={(e) => setOneQuestionAtTime(e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      {/* 允許多次嘗試 */}
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="multiple-attempts"
                          label="允許多次嘗試"
                          checked={multipleAttempts}
                          onChange={(e) => setMultipleAttempts(e.target.checked)}
                        />
                        
                        {multipleAttempts && (
                          <InputGroup className="mt-2">
                            <Form.Control 
                              type="number" 
                              min="1"
                              value={attemptsAllowed} 
                              onChange={(e) => setAttemptsAllowed(parseInt(e.target.value) || 1)}
                            />
                            <InputGroup.Text>次嘗試</InputGroup.Text>
                          </InputGroup>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      {/* 顯示正確答案 */}
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="show-correct-answers"
                          label={<><FaEye className="me-2" />顯示正確答案</>}
                          checked={showCorrectAnswers}
                          onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      {/* 要求網路攝影機 */}
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="webcam-required"
                          label={<><FaCamera className="me-2" />要求網路攝影機</>}
                          checked={webcamRequired}
                          onChange={(e) => setWebcamRequired(e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      {/* 回答後鎖定問題 */}
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="lock-questions"
                          label={<><FaLock className="me-2" />回答後鎖定問題</>}
                          checked={lockQuestionsAfterAnswering}
                          onChange={(e) => setLockQuestionsAfterAnswering(e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />

                  <h5 className="mb-3">時間設置</h5>
                  <Row>
                    <Col md={4}>
                      {/* 截止日期 */}
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaCalendarAlt className="me-2" />
                          截止日期
                        </Form.Label>
                        <Form.Control 
                          type="datetime-local" 
                          value={dueDate} 
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      {/* 開放日期 */}
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaCalendarAlt className="me-2" />
                          開放日期
                        </Form.Label>
                        <Form.Control 
                          type="datetime-local" 
                          value={availableDate} 
                          onChange={(e) => setAvailableDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      {/* 結束日期 */}
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaCalendarAlt className="me-2" />
                          結束日期
                        </Form.Label>
                        <Form.Control 
                          type="datetime-local" 
                          value={untilDate} 
                          onChange={(e) => setUntilDate(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form>
          </Tab.Pane>

          {/* 問題選項卡 */}
          <Tab.Pane eventKey="questions">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h4 className="mb-0">測驗問題</h4>
                    <div className="text-muted">總分: {calculateTotalPoints()} 分</div>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={addQuestion}
                    className="d-flex align-items-center"
                  >
                    <FaPlus className="me-1" /> 新增問題
                  </Button>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <FaPlus style={{ fontSize: '3rem', opacity: 0.3 }} />
                    </div>
                    <h5>尚無問題</h5>
                    <p className="text-muted">點擊「新增問題」按鈕創建第一個問題</p>
                  </div>
                ) : (
                  <div className="questions-list">
                    {questions.map((question, index) => (
                      <QuestionEditor
                        key={question._id || index}
                        question={question}
                        index={index}
                        onUpdate={updateQuestion}
                        onRemove={removeQuestion}
                        isNew={!question._id}
                      />
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* 底部操作按鈕 */}
      <div className="d-flex justify-content-between mt-4">
        <Button 
          variant="outline-secondary"
          onClick={handleCancel}
          disabled={loading}
        >
          取消
        </Button>
        <div>
          <Button 
            variant="outline-primary"
            className="me-2"
            onClick={(e) => handleSave(e)}
            disabled={loading}
          >
            <FaSave className="me-1" /> 保存
          </Button>
          <Button 
            variant="success"
            onClick={(e) => handleSave(e, true)}
            disabled={loading}
          >
            <FaSave className="me-1" /> 保存並發布
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default QuizEditor;