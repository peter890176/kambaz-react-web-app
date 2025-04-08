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
import './QuizzesList.css'; // Import style file
import { useSelector } from 'react-redux';

// Quiz interface definition
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

// Student attempt interface
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
  const [userRole, setUserRole] = useState<'student' | 'instructor'>('instructor'); // Default as instructor, will be updated from user data
  const [studentAttempts, setStudentAttempts] = useState<Record<string, Attempt>>({});
  const { currentUser } = useSelector((state: any) => state.accountReducer);

  // Update userRole based on currentUser from Redux
  useEffect(() => {
    if (currentUser && currentUser.role) {
      console.log("Current user role:", currentUser.role);
      // Map FACULTY role to 'instructor' and STUDENT role to 'student'
      if (currentUser.role === 'FACULTY') {
        setUserRole('instructor');
      } else if (currentUser.role === 'STUDENT') {
        setUserRole('student');
      } else if (currentUser.role === 'INSTRUCTOR') {
        setUserRole('instructor');
      } else {
        // Default to student for any other role
        setUserRole('student');
      }
    }
  }, [currentUser]);

  // Get quiz list
  const fetchQuizzes = async () => {
    if (!cid) {
      setError("Unable to get course ID");
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
      console.error('Error getting quiz list:', err);
      setError(err.message || 'Failed to get quiz list');
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch quizzes on initial load
  useEffect(() => {
    fetchQuizzes();
  }, [cid]);

  // Create new quiz
  const handleCreateQuiz = () => {
    navigate(`/Kambaz/Courses/${cid}/Quizzes/new`);
  };

  // Navigate to quiz details page
  const handleViewQuiz = (quizId: string) => {
    if (cid) {
      navigate(`/Kambaz/Courses/${cid}/Quizzes/${quizId}`);
    } else {
      navigate(`/Kambaz/Quizzes/${quizId}`);
    }
  };

  // Navigate to quiz edit page
  const handleEditQuiz = (quizId: string) => {
    navigate(`/Kambaz/Quizzes/${quizId}/edit`);
  };

  // Confirm quiz deletion
  const confirmDeleteQuiz = (quizId: string) => {
    setQuizToDelete(quizId);
    setShowDeleteModal(true);
  };

  // Delete quiz
  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    try {
      setLoading(true);
      await deleteQuiz(quizToDelete);
      // Update list after successful deletion
      setQuizzes(quizzes.filter(quiz => quiz._id !== quizToDelete));
      setShowDeleteModal(false);
      setQuizToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete quiz:', err);
      setError(err.message || 'Failed to delete quiz');
    } finally {
      setLoading(false);
    }
  };

  // Publish/unpublish quiz
  const togglePublishQuiz = async (quizId: string, isPublished: boolean) => {
    try {
      setLoading(true);
      
      if (isPublished) {
        await unpublishQuiz(quizId);
      } else {
        await publishQuiz(quizId);
      }
      
      // Update quiz status in the list
      setQuizzes(quizzes.map(quiz => {
        if (quiz._id === quizId) {
          return { ...quiz, published: !isPublished };
        }
        return quiz;
      }));
    } catch (err: any) {
      console.error(`Failed to ${isPublished ? 'unpublish' : 'publish'} quiz:`, err);
      setError(err.message || `Failed to ${isPublished ? 'unpublish' : 'publish'} quiz`);
    } finally {
      setLoading(false);
    }
  };

  // Copy quiz to other course (optional)
  const handleCopyQuiz = (quizId: string) => {
    // Could open a modal here to select target course
    console.log('Copy quiz:', quizId);
  };

  // Sort quizzes
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

  // Get quiz availability status
  const getAvailabilityStatus = (quiz: Quiz) => {
    const now = new Date();
    const availableDate = quiz.availableDate ? new Date(quiz.availableDate) : null;
    const untilDate = quiz.untilDate ? new Date(quiz.untilDate) : null;
    
    if (availableDate && now < availableDate) {
      return { 
        status: 'Not Available Yet', 
        label: `Available on: ${availableDate.toLocaleDateString()} ${availableDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        color: 'secondary'
      };
    }
    
    if (untilDate && now > untilDate) {
      return { 
        status: 'Closed', 
        label: 'Ended',
        color: 'dark' 
      };
    }
    
    return { 
      status: 'Available', 
      label: 'Available',
      color: 'success' 
    };
  };

  // Format date display
  const formatDate = (dateString?: Date) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  // Empty state component
  const EmptyState = () => (
    <Card className="empty-state-card">
      <Card.Body>
        <FaQuestionCircle className="empty-state-icon" />
        <Card.Title>No Quizzes Yet</Card.Title>
        <Card.Text>
          {userRole === 'instructor' 
            ? "Click the \"+ Quiz\" button to create a new quiz" 
            : "There are no quizzes available right now"}
        </Card.Text>
        {userRole === 'instructor' && (
          <Button 
            variant="primary" 
            onClick={handleCreateQuiz}
            className="d-flex align-items-center mx-auto add-quiz-btn"
          >
            <FaPlus className="me-2" /> Add Quiz
          </Button>
        )}
      </Card.Body>
    </Card>
  );

  // Function to check if a user can modify a quiz
  const canModifyQuiz = () => {
    return userRole === 'instructor'; // Only instructors/faculty can modify quizzes
  }

  // Function to check if a quiz is available for students to take
  const isQuizAvailable = (quiz: Quiz) => {
    if (userRole === 'instructor') return true; // Instructors see all quizzes
    
    // For students, check if quiz is published and within available dates
    if (!quiz.published) return false;
    
    const now = new Date();
    const availableDate = quiz.availableDate ? new Date(quiz.availableDate) : null;
    const untilDate = quiz.untilDate ? new Date(quiz.untilDate) : null;
    
    // Not available yet
    if (availableDate && now < availableDate) return false;
    
    // Already closed
    if (untilDate && now > untilDate) return false;
    
    return true;
  };

  if (loading && quizzes.length === 0) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="quiz-list-container">
      <div className="quizzes-header">
        <h2>Course Quizzes</h2>
        <div className="d-flex gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" id="sort-dropdown" className="sort-dropdown">
              Sort by: {
                sortBy === 'name' ? 'Name' : 
                sortBy === 'dueDate' ? 'Due Date' : 'Available Date'
              }
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleSort('name')}>Name</Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort('dueDate')}>Due Date</Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort('availableDate')}>Available Date</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          {canModifyQuiz() && (
            <Button 
              variant="danger" 
              onClick={handleCreateQuiz}
              className="d-flex align-items-center add-quiz-btn"
            >
              <FaPlus className="me-2" /> Quiz
            </Button>
          )}
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {quizzes.length === 0 ? (
        userRole === 'instructor' ? <EmptyState /> : (
          <Card className="empty-state-card">
            <Card.Body>
              <FaQuestionCircle className="empty-state-icon" />
              <Card.Title>No Quizzes</Card.Title>
              <Card.Text>There are no quizzes available right now</Card.Text>
            </Card.Body>
          </Card>
        )
      ) : (
        <ListGroup>
          {quizzes.map(quiz => {
            const availabilityInfo = getAvailabilityStatus(quiz);
            // Skip quizzes that aren't available for students
            if (userRole === 'student' && !isQuizAvailable(quiz)) return null;
            
            return (
              <ListGroup.Item key={quiz._id} className={`p-0 mb-2 border quiz-item ${quiz.published ? 'published' : 'unpublished'}`}>
                <Row className="m-0 p-0 align-items-center">
                  {/* Published status icon - only visible to instructors */}
                  <Col xs={userRole === 'instructor' ? 1 : 0} className="text-center py-3">
                    {userRole === 'instructor' && (
                      quiz.published ? (
                        <div 
                          className="quiz-status-icon published" 
                          title="Published, click to unpublish"
                          onClick={() => togglePublishQuiz(quiz._id, true)}
                        >
                          <FaCheck />
                        </div>
                      ) : (
                        <div 
                          className="quiz-status-icon unpublished" 
                          title="Unpublished, click to publish"
                          onClick={() => togglePublishQuiz(quiz._id, false)}
                        >
                          <FaBan />
                        </div>
                      )
                    )}
                  </Col>
                  
                  {/* Quiz info (title/type etc) */}
                  <Col xs={userRole === 'instructor' ? 8 : 12} className="py-3">
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
                        Due date: {formatDate(quiz.dueDate)}
                      </span>
                      <span className="quiz-detail-item">{quiz.totalPoints} points</span>
                      <span className="quiz-detail-item">{quiz.questions?.length || 0} questions</span>
                      {userRole === 'student' && studentAttempts[quiz._id] && (
                        <span className="quiz-detail-item fw-bold">
                          Score: {studentAttempts[quiz._id].score} / {quiz.totalPoints}
                        </span>
                      )}
                    </div>
                  </Col>
                  
                  {/* Right action buttons - only visible to instructors */}
                  {userRole === 'instructor' && (
                    <Col xs={3} className="d-flex justify-content-end py-3 pe-3 quiz-actions">
                      <Dropdown>
                        <Dropdown.Toggle variant="light" id={`dropdown-${quiz._id}`}>
                          <FaEllipsisV />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleEditQuiz(quiz._id)}>Edit</Dropdown.Item>
                          <Dropdown.Item onClick={() => confirmDeleteQuiz(quiz._id)}>Delete</Dropdown.Item>
                          <Dropdown.Item onClick={() => togglePublishQuiz(quiz._id, quiz.published)}>
                            {quiz.published ? 'Unpublish' : 'Publish'}
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleCopyQuiz(quiz._id)}>Copy to another course</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </Col>
                  )}

                  {/* Student-specific actions */}
                  {userRole === 'student' && (
                    <Col xs={3} className="d-flex justify-content-end py-3 pe-3 quiz-actions">
                      {/* Show Take Quiz button if attempt is allowed */}
                      {!studentAttempts[quiz._id] && (
                        <Button 
                          variant="success"
                          onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizzes/${quiz._id}/attempt`)}
                        >
                          Take Quiz
                        </Button>
                      )}
                      
                      {/* If student has completed the quiz, show their score and a View Results button */}
                      {studentAttempts[quiz._id] && studentAttempts[quiz._id].completed && (
                        <Button 
                          variant="info"
                          onClick={() => navigate(`/Kambaz/Courses/${cid}/Quizzes/${quiz._id}/results`)}
                        >
                          View Results
                        </Button>
                      )}
                    </Col>
                  )}
                </Row>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}
      
      {/* Delete confirmation dialog */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} className="delete-confirm-modal">
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this quiz? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteQuiz}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default QuizzesList;