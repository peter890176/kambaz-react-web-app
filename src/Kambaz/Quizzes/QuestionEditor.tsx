import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Button, 
  InputGroup, 
  Badge, 
  Row, 
  Col,
  ButtonGroup
} from 'react-bootstrap';
import { 
  FaTrash, 
  FaPlus, 
  FaEdit, 
  FaCheck, 
  FaEye,
  FaTimes 
} from 'react-icons/fa';
import './QuestionEditor.css';

// 問題類型接口
export interface Choice {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id?: string;
  title: string;
  questionType: string;
  questionText: string;
  points: number;
  choices?: Choice[];
  correctAnswer?: boolean;
  correctAnswers?: string[];
  isEditing?: boolean;
}

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (index: number, updatedQuestion: Question) => void;
  onRemove: (index: number) => void;
  isNew?: boolean;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ 
  question, 
  index, 
  onUpdate, 
  onRemove,
  isNew = false
}) => {
  const [editingQuestion, setEditingQuestion] = useState<Question>({...question});
  const [isEditing, setIsEditing] = useState<boolean>(isNew || question.isEditing || false);
  const [originalQuestion, setOriginalQuestion] = useState<Question>({...question});

  // 當外部問題數據變化時更新本地狀態
  useEffect(() => {
    setEditingQuestion({...question});
    setOriginalQuestion({...question});
    setIsEditing(isNew || question.isEditing || false);
  }, [question, isNew]);

  // 處理問題欄位變更
  const handleQuestionChange = (field: string, value: any) => {
    const updatedQuestion = { ...editingQuestion, [field]: value };
    
    // 如果更改了問題類型，需要重置答案相關字段
    if (field === 'questionType') {
      if (value === 'MULTIPLE_CHOICE') {
        updatedQuestion.choices = [
          { id: Date.now().toString(), text: '選項 1', isCorrect: false },
          { id: Date.now().toString() + '1', text: '選項 2', isCorrect: false }
        ];
        delete updatedQuestion.correctAnswer;
        delete updatedQuestion.correctAnswers;
      } else if (value === 'TRUE_FALSE') {
        updatedQuestion.correctAnswer = false;
        delete updatedQuestion.choices;
        delete updatedQuestion.correctAnswers;
      } else if (value === 'FILL_BLANK') {
        updatedQuestion.correctAnswers = [''];
        delete updatedQuestion.choices;
        delete updatedQuestion.correctAnswer;
      }
    }
    
    setEditingQuestion(updatedQuestion);
  };

  // 處理選項變更 (多選題)
  const handleChoiceChange = (choiceIndex: number, field: string, value: any) => {
    if (!editingQuestion.choices) return;
    
    const newChoices = [...editingQuestion.choices];
    
    if (field === 'isCorrect') {
      // 單選邏輯：確保只有一個選項被選中
      newChoices.forEach((choice, i) => {
        if (i === choiceIndex) {
          choice.isCorrect = true;
        } else {
          choice.isCorrect = false;
        }
      });
    } else {
      // @ts-ignore: 動態屬性賦值
      newChoices[choiceIndex][field] = value;
    }
    
    setEditingQuestion({ ...editingQuestion, choices: newChoices });
  };

  // 添加新選項 (多選題)
  const addChoice = () => {
    if (!editingQuestion.choices) return;
    
    const newChoice: Choice = {
      id: Date.now().toString(),
      text: `選項 ${editingQuestion.choices.length + 1}`,
      isCorrect: false
    };
    
    setEditingQuestion({
      ...editingQuestion,
      choices: [...editingQuestion.choices, newChoice]
    });
  };

  // 刪除選項 (多選題)
  const removeChoice = (choiceIndex: number) => {
    if (!editingQuestion.choices) return;
    
    const newChoices = [...editingQuestion.choices];
    newChoices.splice(choiceIndex, 1);
    
    // 如果刪除了正確答案，自動將第一個選項設為正確答案
    const hasCorrectChoice = newChoices.some(choice => choice.isCorrect);
    if (!hasCorrectChoice && newChoices.length > 0) {
      newChoices[0].isCorrect = true;
    }
    
    setEditingQuestion({ ...editingQuestion, choices: newChoices });
  };

  // 處理填空題答案變更
  const handleCorrectAnswerChange = (answerIndex: number, value: string) => {
    if (!editingQuestion.correctAnswers) return;
    
    const newAnswers = [...editingQuestion.correctAnswers];
    newAnswers[answerIndex] = value;
    
    setEditingQuestion({ ...editingQuestion, correctAnswers: newAnswers });
  };

  // 添加填空題新答案
  const addCorrectAnswer = () => {
    if (!editingQuestion.correctAnswers) return;
    
    setEditingQuestion({
      ...editingQuestion,
      correctAnswers: [...editingQuestion.correctAnswers, '']
    });
  };

  // 刪除填空題答案
  const removeCorrectAnswer = (answerIndex: number) => {
    if (!editingQuestion.correctAnswers) return;
    
    const newAnswers = [...editingQuestion.correctAnswers];
    newAnswers.splice(answerIndex, 1);
    
    setEditingQuestion({ ...editingQuestion, correctAnswers: newAnswers });
  };

  // 儲存問題
  const saveQuestion = () => {
    // 確保至少有一個正確選項 (多選題)
    if (editingQuestion.questionType === 'MULTIPLE_CHOICE' && 
        editingQuestion.choices && 
        !editingQuestion.choices.some(choice => choice.isCorrect)) {
      if (editingQuestion.choices.length > 0) {
        editingQuestion.choices[0].isCorrect = true;
      }
    }
    
    // 更新問題，關閉編輯模式
    onUpdate(index, { ...editingQuestion, isEditing: false });
    setIsEditing(false);
  };

  // 取消編輯
  const cancelEdit = () => {
    // 恢復原始問題數據
    setEditingQuestion({...originalQuestion});
    
    // 如果是新問題且取消，則刪除
    if (isNew) {
      onRemove(index);
    } else {
      // 關閉編輯模式
      onUpdate(index, { ...originalQuestion, isEditing: false });
      setIsEditing(false);
    }
  };

  // 開始編輯
  const startEditing = () => {
    setOriginalQuestion({...editingQuestion});
    setIsEditing(true);
    onUpdate(index, { ...editingQuestion, isEditing: true });
  };

  // 渲染多選題編輯器
  const renderMultipleChoiceEditor = () => {
    return (
      <div className="mt-3">
        <Form.Label className="fw-bold">選項：</Form.Label>
        <div className="choices-container">
          {editingQuestion.choices && editingQuestion.choices.map((choice, choiceIndex) => (
            <InputGroup key={choice.id || choiceIndex} className="mb-2">
              <InputGroup.Radio 
                checked={choice.isCorrect}
                onChange={() => handleChoiceChange(choiceIndex, 'isCorrect', true)}
                name={`choice-correct-${index}`}
                aria-label="選擇為正確答案"
              />
              <Form.Control
                value={choice.text}
                onChange={(e) => handleChoiceChange(choiceIndex, 'text', e.target.value)}
                placeholder={`選項 ${choiceIndex + 1}`}
              />
              <Button 
                variant="outline-danger"
                onClick={() => removeChoice(choiceIndex)}
                disabled={editingQuestion.choices && editingQuestion.choices.length <= 2}
              >
                <FaTrash />
              </Button>
            </InputGroup>
          ))}
          <Button
            variant="outline-secondary"
            size="sm"
            className="mt-2"
            onClick={addChoice}
          >
            <FaPlus className="me-1" /> 添加選項
          </Button>
        </div>
      </div>
    );
  };

  // 渲染是非題編輯器
  const renderTrueFalseEditor = () => {
    return (
      <div className="mt-3">
        <Form.Label className="fw-bold">正確答案：</Form.Label>
        <div>
          <Form.Check
            type="radio"
            id={`true-${index}`}
            name={`true-false-${index}`}
            label="是"
            inline
            checked={editingQuestion.correctAnswer === true}
            onChange={() => handleQuestionChange('correctAnswer', true)}
            className="me-3"
          />
          <Form.Check
            type="radio"
            id={`false-${index}`}
            name={`true-false-${index}`}
            label="否"
            inline
            checked={editingQuestion.correctAnswer === false}
            onChange={() => handleQuestionChange('correctAnswer', false)}
          />
        </div>
      </div>
    );
  };

  // 渲染填空題編輯器
  const renderFillBlankEditor = () => {
    return (
      <div className="mt-3">
        <Form.Label className="fw-bold">可接受的答案：</Form.Label>
        <p className="text-muted small">學生的回答必須與其中一個可接受的答案完全匹配才能獲得分數。</p>
        <div className="answers-container">
          {editingQuestion.correctAnswers && editingQuestion.correctAnswers.map((answer, answerIndex) => (
            <InputGroup key={answerIndex} className="mb-2">
              <InputGroup.Text>{answerIndex + 1}</InputGroup.Text>
              <Form.Control
                value={answer}
                onChange={(e) => handleCorrectAnswerChange(answerIndex, e.target.value)}
                placeholder="輸入可接受的答案"
              />
              <Button 
                variant="outline-danger"
                onClick={() => removeCorrectAnswer(answerIndex)}
                disabled={editingQuestion.correctAnswers?.length === 1}
              >
                <FaTrash />
              </Button>
            </InputGroup>
          ))}
          <Button
            variant="outline-secondary"
            size="sm"
            className="mt-2"
            onClick={addCorrectAnswer}
          >
            <FaPlus className="me-1" /> 添加答案選項
          </Button>
        </div>
      </div>
    );
  };

  // 根據問題類型渲染相應的編輯器
  const renderQuestionTypeEditor = () => {
    switch (editingQuestion.questionType) {
      case 'MULTIPLE_CHOICE':
        return renderMultipleChoiceEditor();
      case 'TRUE_FALSE':
        return renderTrueFalseEditor();
      case 'FILL_BLANK':
        return renderFillBlankEditor();
      default:
        return null;
    }
  };

  // 渲染問題預覽（非編輯模式）
  const renderQuestionPreview = () => {
    return (
      <Card className="question-preview">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span className="question-number">{index + 1}.</span>
            <span className="question-title ms-2">{question.title}</span>
          </div>
          <div>
            <Badge bg="primary" className="me-2">{question.points} 分</Badge>
            <Badge bg="secondary" className="me-2">
              {question.questionType === 'MULTIPLE_CHOICE' ? '選擇題' : 
               question.questionType === 'TRUE_FALSE' ? '是非題' : '填空題'}
            </Badge>
            <ButtonGroup size="sm">
              <Button variant="outline-primary" onClick={startEditing}>
                <FaEdit />
              </Button>
              <Button variant="outline-danger" onClick={() => onRemove(index)}>
                <FaTrash />
              </Button>
            </ButtonGroup>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="question-text mb-3">{question.questionText}</div>
          
          {question.questionType === 'MULTIPLE_CHOICE' && question.choices && (
            <div className="choices-preview">
              {question.choices.map((choice, i) => (
                <div key={i} className={`choice-item ${choice.isCorrect ? 'correct-choice' : ''}`}>
                  <span className="choice-marker">{choice.isCorrect ? <FaCheck className="text-success" /> : <FaTimes className="text-muted" />}</span>
                  <span className="choice-text">{choice.text}</span>
                </div>
              ))}
            </div>
          )}
          
          {question.questionType === 'TRUE_FALSE' && (
            <div className="true-false-preview">
              <div className={`choice-item ${question.correctAnswer ? 'correct-choice' : ''}`}>
                <span className="choice-marker">{question.correctAnswer ? <FaCheck className="text-success" /> : <FaTimes className="text-muted" />}</span>
                <span className="choice-text">是</span>
              </div>
              <div className={`choice-item ${!question.correctAnswer ? 'correct-choice' : ''}`}>
                <span className="choice-marker">{!question.correctAnswer ? <FaCheck className="text-success" /> : <FaTimes className="text-muted" />}</span>
                <span className="choice-text">否</span>
              </div>
            </div>
          )}
          
          {question.questionType === 'FILL_BLANK' && question.correctAnswers && (
            <div className="fill-blank-preview">
              <p>正確答案：</p>
              <ul className="answers-list">
                {question.correctAnswers.map((answer, i) => (
                  <li key={i}>{answer}</li>
                ))}
              </ul>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return isEditing ? (
    <Card className="question-editor mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <span className="question-number">{index + 1}.</span>
          <Form.Control
            type="text"
            value={editingQuestion.title}
            onChange={(e) => handleQuestionChange('title', e.target.value)}
            placeholder="問題標題"
            className="question-title-input ms-2"
          />
        </div>
        <div className="d-flex align-items-center">
          <Form.Group className="points-input me-2">
            <InputGroup>
              <Form.Control
                type="number"
                min="0"
                value={editingQuestion.points}
                onChange={(e) => handleQuestionChange('points', parseInt(e.target.value) || 0)}
                aria-label="問題分數"
              />
              <InputGroup.Text>分</InputGroup.Text>
            </InputGroup>
          </Form.Group>
          <Form.Select
            value={editingQuestion.questionType}
            onChange={(e) => handleQuestionChange('questionType', e.target.value)}
            className="question-type-select me-2"
            style={{ width: 'auto' }}
          >
            <option value="MULTIPLE_CHOICE">選擇題</option>
            <option value="TRUE_FALSE">是非題</option>
            <option value="FILL_BLANK">填空題</option>
          </Form.Select>
        </div>
      </Card.Header>
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">問題文字：</Form.Label>
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
            rows={3}
            value={editingQuestion.questionText}
            onChange={(e) => handleQuestionChange('questionText', e.target.value)}
            placeholder="輸入問題內容..."
          />
        </Form.Group>

        {renderQuestionTypeEditor()}

        <div className="d-flex justify-content-end mt-4">
          <Button 
            variant="outline-secondary" 
            className="me-2"
            onClick={cancelEdit}
          >
            取消
          </Button>
          <Button 
            variant="danger" 
            onClick={saveQuestion}
          >
            {isNew ? '新增問題' : '更新問題'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  ) : (
    renderQuestionPreview()
  );
};

export default QuestionEditor; 