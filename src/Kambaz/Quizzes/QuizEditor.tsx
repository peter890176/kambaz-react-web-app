import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Row, Col, Alert } from 'react-bootstrap';
import { createQuiz, getQuizById, updateQuiz } from './api';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';

// 先創建一個簡化版本的編輯器，以後可以擴展功能

interface Question {
  _id?: string;
  title: string;
  questionType: string;
  questionText: string;
  points: number;
  choices?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: boolean;
  correctAnswers?: string[];
}

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
  questions: Question[];
  // 其他屬性...
}

function QuizEditor() {
  const { cid, quizId } = useParams<{ cid?: string; quizId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 測驗基本信息
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quizType, setQuizType] = useState('GRADED_QUIZ');
  const [timeLimit, setTimeLimit] = useState(20);
  const [shuffleAnswers, setShuffleAnswers] = useState(true);
  const [multipleAttempts, setMultipleAttempts] = useState(false);
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  
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
          setTitle(quiz.title);
          setDescription(quiz.description || '');
          setQuizType(quiz.quizType);
          setTimeLimit(quiz.timeLimit);
          setShuffleAnswers(quiz.shuffleAnswers);
          setMultipleAttempts(quiz.multipleAttempts);
          setAttemptsAllowed(quiz.attemptsAllowed);
          setShowCorrectAnswers(quiz.showCorrectAnswers);
          setQuestions(quiz.questions || []);
        } catch (err: any) {
          setError(err.message || '獲取測驗失敗');
        } finally {
          setLoading(false);
        }
      };
      
      fetchQuiz();
    }
  }, [quizId]);

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
      ]
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
  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    
    // @ts-ignore: 動態屬性賦值
    newQuestions[index][field] = value;
    
    // 處理問題類型變更
    if (field === 'questionType') {
      const question = newQuestions[index];
      if (value === 'MULTIPLE_CHOICE') {
        question.choices = [
          { text: '選項 1', isCorrect: false },
          { text: '選項 2', isCorrect: false }
        ];
        delete question.correctAnswer;
        delete question.correctAnswers;
      } else if (value === 'TRUE_FALSE') {
        question.correctAnswer = false;
        delete question.choices;
        delete question.correctAnswers;
      } else if (value === 'FILL_BLANK') {
        question.correctAnswers = [''];
        delete question.choices;
        delete question.correctAnswer;
      }
    }
    
    setQuestions(newQuestions);
  };

  // 保存測驗
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 構建測驗數據 - 明確包含 course 欄位
    const quizData = {
      title,
      description,
      quizType,
      timeLimit,
      shuffleAnswers,
      multipleAttempts,
      attemptsAllowed,
      showCorrectAnswers,
      questions,
      course: cid  // 明確添加課程ID
    };
    
    console.log("提交測驗表單", { cid, quizId, quizData });
    
    try {
      setLoading(true);
      setError(null);
      
      if (quizId) {
        // 更新現有測驗
        const updatedQuiz = await updateQuiz(quizId, quizData);
        console.log("測驗更新成功", updatedQuiz);
        setSuccess('測驗已成功更新');
        
        // 導航到測驗詳情頁 - 確保路徑格式正確
        setTimeout(() => {
          const path = `/Kambaz/Quizzes/${quizId}`;
          console.log("即將導航到:", path);
          navigate(path);
        }, 1500);
      } else if (cid) {
        // 創建新測驗
        const newQuiz = await createQuiz(cid, quizData);
        console.log("測驗創建成功", newQuiz);
        setSuccess('測驗已成功創建');
        
        // 重定向到新測驗
        setTimeout(() => {
          const path = `/Kambaz/Quizzes/${newQuiz._id}`;
          console.log("即將導航到:", path);
          navigate(path);
        }, 1500);
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

  if (loading && !quizId) return <div>載入中...</div>;

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{quizId ? '編輯測驗' : '創建新測驗'}</h2>
        <Button 
          variant="outline-secondary"
          onClick={() => quizId ? navigate(`/Kambaz/Quizzes/${quizId}`) : navigate(`/Kambaz/Courses/${cid}/Quizzes`)}
        >
          <FaArrowLeft className="me-1" /> 返回
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>基本信息</Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>測驗標題</Form.Label>
              <Form.Control 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>描述</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>測驗類型</Form.Label>
                  <Form.Select 
                    value={quizType} 
                    onChange={(e) => setQuizType(e.target.value)}
                  >
                    <option value="GRADED_QUIZ">計分測驗</option>
                    <option value="PRACTICE_QUIZ">練習測驗</option>
                    <option value="GRADED_SURVEY">計分調查</option>
                    <option value="UNGRADED_SURVEY">不計分調查</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>時間限制 (分鐘)</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={timeLimit} 
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    min={1}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    label="隨機排序答案"
                    checked={shuffleAnswers}
                    onChange={(e) => setShuffleAnswers(e.target.checked)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    label="顯示正確答案"
                    checked={showCorrectAnswers}
                    onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    label="允許多次嘗試"
                    checked={multipleAttempts}
                    onChange={(e) => setMultipleAttempts(e.target.checked)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                {multipleAttempts && (
                  <Form.Group className="mb-3">
                    <Form.Label>允許嘗試次數</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={attemptsAllowed} 
                      onChange={(e) => setAttemptsAllowed(parseInt(e.target.value))}
                      min={1}
                    />
                  </Form.Group>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>問題 ({questions.length})</span>
            <Button variant="primary" onClick={addQuestion} size="sm">
              <FaPlus className="me-1" /> 添加問題
            </Button>
          </Card.Header>
          <Card.Body>
            {questions.length === 0 ? (
              <Alert variant="info">
                尚未添加問題。點擊"添加問題"按鈕創建第一個問題。
              </Alert>
            ) : (
              questions.map((question, index) => (
                <Card key={index} className="mb-3">
                  <Card.Header className="d-flex justify-content-between">
                    <div>問題 {index + 1}</div>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <FaTrash />
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>問題標題</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={question.title} 
                        onChange={(e) => updateQuestion(index, 'title', e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>問題類型</Form.Label>
                      <Form.Select 
                        value={question.questionType} 
                        onChange={(e) => updateQuestion(index, 'questionType', e.target.value)}
                      >
                        <option value="MULTIPLE_CHOICE">選擇題</option>
                        <option value="TRUE_FALSE">是非題</option>
                        <option value="FILL_BLANK">填空題</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>問題描述</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={question.questionText} 
                        onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>分值</Form.Label>
                      <Form.Control 
                        type="number" 
                        value={question.points} 
                        onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                        min={1}
                      />
                    </Form.Group>

                    {/* 這裡只是一個簡化的實現，實際應根據問題類型顯示不同的編輯選項 */}
                    {question.questionType === 'MULTIPLE_CHOICE' && (
                      <div className="mb-3">
                        <Form.Label>選項 (簡化版)</Form.Label>
                        <Alert variant="info">
                          在完整實現中，這裡會有選項編輯功能
                        </Alert>
                      </div>
                    )}

                    {question.questionType === 'TRUE_FALSE' && (
                      <Form.Group className="mb-3">
                        <Form.Label>正確答案</Form.Label>
                        <Form.Select 
                          value={question.correctAnswer?.toString()} 
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value === 'true')}
                        >
                          <option value="true">是</option>
                          <option value="false">否</option>
                        </Form.Select>
                      </Form.Group>
                    )}

                    {question.questionType === 'FILL_BLANK' && (
                      <div className="mb-3">
                        <Form.Label>正確答案 (簡化版)</Form.Label>
                        <Alert variant="info">
                          在完整實現中，這裡會有多答案編輯功能
                        </Alert>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))
            )}
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-between">
          <Button 
            variant="secondary"
            onClick={() => quizId ? navigate(`/Kambaz/Quizzes/${quizId}`) : navigate(`/Kambaz/Courses/${cid}/Quizzes`)}
          >
            取消
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading}
          >
            <FaSave className="me-1" /> 
            {loading ? '保存中...' : '保存測驗'}
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default QuizEditor;