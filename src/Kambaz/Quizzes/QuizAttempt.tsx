import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Button, ProgressBar, Form, Alert } from 'react-bootstrap';
import { getQuizById, submitAttempt } from './api';
import { FaArrowRight, FaArrowLeft, FaCheck } from 'react-icons/fa';

function QuizAttempt() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const attemptId = location.state?.attemptId;
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // 檢查參數有效性
  useEffect(() => {
    if (!quizId) {
      setError('缺少測驗ID參數');
      setLoading(false);
      return;
    }
    
    if (!attemptId) {
      setError('缺少嘗試ID參數，無法開始測驗');
      setLoading(false);
      return;
    }
    
    console.log(`開始測驗嘗試，測驗ID: ${quizId}, 嘗試ID: ${attemptId}`);
  }, [quizId, attemptId]);

  // 獲取測驗詳情
  useEffect(() => {
    if (!quizId || !attemptId) return;
    
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await getQuizById(quizId);
        if (!response || !response.data) {
          throw new Error('獲取測驗數據失敗');
        }
        
        setQuiz(response.data);
        
        // 初始化答案數組
        const initialAnswers = response.data.questions.map((q: any) => ({
          question: q._id,
          answerChoice: '',
          answerBoolean: null,
          answerText: ''
        }));
        
        setAnswers(initialAnswers);
        
        // 設置倒計時
        setTimeLeft(response.data.timeLimit * 60);
        console.log(`測驗載入成功，包含 ${response.data.questions.length} 個問題，時間限制 ${response.data.timeLimit} 分鐘`);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || '獲取測驗失敗';
        setError(errorMessage);
        console.error('獲取測驗失敗:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, attemptId]);

  // 倒計時
  useEffect(() => {
    if (!quiz || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 自動提交
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quiz, timeLeft]);

  // 格式化時間
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 更新答案
  const updateAnswer = (value: any, type: string) => {
    const newAnswers = [...answers];
    if (type === 'choice') {
      newAnswers[currentQuestion].answerChoice = value;
    } else if (type === 'boolean') {
      newAnswers[currentQuestion].answerBoolean = value === 'true';
    } else if (type === 'text') {
      newAnswers[currentQuestion].answerText = value;
    }
    setAnswers(newAnswers);
  };

  // 下一題
  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // 上一題
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // 提交測驗
  const handleSubmit = async () => {
    if (!attemptId) {
      setError('缺少嘗試 ID，無法提交');
      return;
    }
    
    try {
      setSubmitting(true);
      console.log(`提交測驗嘗試，測驗ID: ${quizId}, 嘗試ID: ${attemptId}`);
      
      // 清理答案數據，移除空值
      const processedAnswers = answers.map(answer => {
        const result = { ...answer };
        
        // 處理選擇題答案
        if (!result.answerChoice || result.answerChoice === '') {
          delete result.answerChoice;
        }
        
        // 處理空字符串答案
        if (result.answerText === '') {
          delete result.answerText;
        }
        
        return result;
      });
      
      console.log("提交處理後的答案:", processedAnswers);
      const response = await submitAttempt(attemptId, processedAnswers);
      
      console.log("測驗提交成功，得分:", response.score);
      
      // 導航到結果頁面，保留測驗ID和嘗試信息
      navigate(`/Kambaz/Quizzes/${quizId}/results`, { 
        state: { 
          attemptId: attemptId,
          score: response.score,
          totalPoints: quiz?.totalPoints
        } 
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '提交測驗失敗';
      setError(errorMessage);
      console.error('提交測驗失敗:', err);
      setSubmitting(false);
    }
  };

  if (loading) return <div>載入中...</div>;
  if (error) return <div className="text-danger">錯誤: {error}</div>;
  if (!quiz) return <div>找不到測驗</div>;
  if (!attemptId) return <div className="text-danger">缺少嘗試 ID，請重新開始測驗</div>;

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Container className="my-4">
      <Card className="mb-3">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4>{quiz.title}</h4>
            <div className="text-danger">剩餘時間: {formatTime(timeLeft)}</div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <ProgressBar now={progress} label={`${currentQuestion + 1} / ${quiz.questions.length}`} />
          </div>

          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between">
                <div>問題 {currentQuestion + 1}</div>
                <div>{question.points} 分</div>
              </div>
            </Card.Header>
            <Card.Body>
              <Card.Title>{question.title}</Card.Title>
              <Card.Text>{question.questionText}</Card.Text>

              <Form>
                {question.questionType === 'MULTIPLE_CHOICE' && question.choices && (
                  <div>
                    {question.choices.map((choice: any, index: number) => (
                      <Form.Check
                        key={index}
                        type="radio"
                        id={`choice-${index}`}
                        label={choice.text}
                        name="questionChoice"
                        value={choice._id}
                        checked={answers[currentQuestion].answerChoice === choice._id}
                        onChange={(e) => updateAnswer(e.target.value, 'choice')}
                      />
                    ))}
                  </div>
                )}

                {question.questionType === 'TRUE_FALSE' && (
                  <div>
                    <Form.Check
                      type="radio"
                      id="true-option"
                      label="是"
                      name="questionBoolean"
                      value="true"
                      checked={answers[currentQuestion].answerBoolean === true}
                      onChange={(e) => updateAnswer(e.target.value, 'boolean')}
                    />
                    <Form.Check
                      type="radio"
                      id="false-option"
                      label="否"
                      name="questionBoolean"
                      value="false"
                      checked={answers[currentQuestion].answerBoolean === false}
                      onChange={(e) => updateAnswer(e.target.value, 'boolean')}
                    />
                  </div>
                )}

                {question.questionType === 'FILL_BLANK' && (
                  <Form.Group>
                    <Form.Label>你的答案</Form.Label>
                    <Form.Control
                      type="text"
                      value={answers[currentQuestion].answerText || ''}
                      onChange={(e) => updateAnswer(e.target.value, 'text')}
                    />
                  </Form.Group>
                )}
              </Form>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between">
            <Button 
              variant="outline-secondary" 
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <FaArrowLeft className="me-1" /> 上一題
            </Button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <Button 
                variant="outline-primary" 
                onClick={nextQuestion}
              >
                下一題 <FaArrowRight className="ms-1" />
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                <FaCheck className="me-1" /> 提交測驗
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default QuizAttempt;