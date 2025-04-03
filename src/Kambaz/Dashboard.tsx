//modified by Claude3.7

import { useState, useEffect } from "react";
import { Button, FormControl } from "react-bootstrap";
import { Card } from "react-bootstrap";
import { Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useSelector, useDispatch } from "react-redux";
import { addCourse, deleteCourse, setSelectedCourse, updateCourse} from "./Courses/reducer";
import { 
  toggleShowAllCourses, 
  enrollInCourse, 
  unenrollFromCourse,
  fetchUserEnrollments, 
  setUserEnrollments, 
  addEnrollment, 
  removeEnrollment 
} from "./Enrollments/reducer";
import { AppDispatch } from './store';
import * as enrollmentClient from "./Enrollments/client";

export default function Dashboard({ 
  enrolling, 
  setEnrolling,
}: { 
  enrolling: boolean; 
  setEnrolling: (enrolling: boolean) => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { courses: reduxCourses, selectedCourse } = useSelector((state: any) => state.coursesReducer);
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const { enrollments, showAllCourses } = useSelector((state: any) => state.enrollmentsReducer);
  const [newCourse, setNewCourse] = useState({
    name: "New Course",
    description: "New Description"
  });

  const isStudent = currentUser.role === "STUDENT";
  const isFaculty = currentUser.role === "FACULTY";
  const isTA = currentUser.role === "TA";
  const isAdmin = currentUser.role === "ADMIN";

  const isEnrolled = (courseId: string) => {
    if (!enrollments || !Array.isArray(enrollments)) {
      return false;
    }
    
    return enrollments.some(
      (enrollment: any) =>
        enrollment.user === currentUser._id &&
        enrollment.course === courseId
    );
  };

  const handleEnrollClick = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isEnrolled(courseId)) {
      console.log(`User ${currentUser._id} already enrolled in course ${courseId}`);
      return;
    }
    
    dispatch(enrollInCourse({ userId: currentUser._id, courseId }))
      .unwrap()
      .then(enrollmentData => {
        console.log('Enrollment successful:', enrollmentData);
        
        dispatch(addEnrollment({
          _id: enrollmentData._id || `${currentUser._id}-${courseId}`,
          user: currentUser._id,
          course: courseId
        }));
      })
      .catch(error => {
        console.error('Enrollment error:', error);
        
        if (error?.code === 11000 || (error?.response?.data?.code === 11000)) {
          console.log('User already enrolled, updating local state');
          dispatch(addEnrollment({
            _id: `${currentUser._id}-${courseId}`,
            user: currentUser._id,
            course: courseId
          }));
        }
      });
  };

  const handleUnenrollClick = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isEnrolled(courseId)) {
      console.log(`User ${currentUser._id} not enrolled in course ${courseId}`);
      return;
    }
    
    dispatch(unenrollFromCourse({ userId: currentUser._id, courseId }))
      .unwrap()
      .then(result => {
        console.log('Unenrollment successful:', result);
        
        dispatch(removeEnrollment({
          userId: currentUser._id,
          courseId
        }));
      })
      .catch(error => {
        console.error('Unenrollment error:', error);
      });
  };

  const handleCourseClick = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/Kambaz/Courses/${courseId}/Home`);
  };

  const displayedCourses = (showAllCourses || isAdmin || isTA || isFaculty)
    ? reduxCourses
    : reduxCourses.filter((course: any) => isEnrolled(course._id));

  useEffect(() => {
    if (selectedCourse) {
      setNewCourse({
        name: selectedCourse.name,
        description: selectedCourse.description
      });
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (currentUser && currentUser._id) {
      console.log('Dashboard mounted, fetching user enrollments:', currentUser._id);
      
      dispatch(fetchUserEnrollments(currentUser._id))
        .unwrap()
        .then(enrollmentsData => {
          console.log('Received enrollment data:', enrollmentsData);
          
          if (!enrollmentsData || !Array.isArray(enrollmentsData) || enrollmentsData.length === 0) {
            console.log('API returned empty data, checking with individual API calls');
            
            reduxCourses.forEach((course: {_id: string}) => {
              enrollmentClient.isUserEnrolledInCourse(currentUser._id, course._id)
                .then((isEnrolled: boolean) => {
                  if (isEnrolled) {
                    dispatch(addEnrollment({
                      _id: `${currentUser._id}-${course._id}`,
                      user: currentUser._id,
                      course: course._id
                    }));
                  }
                });
            });
          } else {
            dispatch(setUserEnrollments(enrollmentsData));
          }
        })
        .catch(error => {
          console.error('Failed to fetch enrollment records:', error);
        });
    }
  }, [currentUser, dispatch, reduxCourses]);

  return (
    <div id="wd-dashboard">
      <h1 id="wd-dashboard-title">
        Dashboard
        <button onClick={() => dispatch(toggleShowAllCourses())} className="float-end btn btn-primary" >
          {showAllCourses ? "My Courses" : "All Courses"}
        </button>
      </h1> <hr />
      {isFaculty && (
        <>
          <h5>New Course
            <button className="btn btn-primary float-end"
                    id="wd-add-new-course-click"
                    onClick={() => {
                      const newCourseId = uuidv4();
                      const newCourseData = { ...newCourse, _id: newCourseId };
                      dispatch(addCourse(newCourseData));
                      dispatch(enrollInCourse({ userId: currentUser._id, courseId: newCourseId }));
                    }} > Add </button>
            <button className="btn btn-warning float-end me-2"
                      onClick={() => {
                        if (selectedCourse) {
                          dispatch(updateCourse({ ...selectedCourse, name: newCourse.name, description: newCourse.description }));
                        }
                      }} 
                    id="wd-update-course-click">
              Update
            </button>
          </h5>
          <br />
          <FormControl value={newCourse.name} className="mb-2"
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} />
          <FormControl as="textarea" value={newCourse.description} rows={3}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
          <hr />
        </>
      )}

      <div className="d-flex justify-content-between align-items-center">
        <h2 id="wd-dashboard-published">Published Courses ({displayedCourses.length})</h2>
        {/*{(isStudent || isAdmin ) && (
          <Button
            variant="primary"
            onClick={() => dispatch(toggleShowAllCourses())}
            className="mb-3"
          >
            {showAllCourses ? "Show My Courses" : "Show All Courses"}
          </Button>
        )}*/}
      </div>
      <hr />

      <div id="wd-dashboard-courses">
        <Row xs={1} md={5} className="g-4">
          {displayedCourses.map((course: any) => (
            <div key={course._id} className="col" style={{ width: "300px" }}>
              <div className="card">
                <Card.Img src="/images/reactjs.jpg" variant="top" width="100%" height={160} />
                <Card.Body className="card-body">
                  <div 
                    onClick={(e) => handleCourseClick(course._id, e)}
                    className="wd-dashboard-course-link text-decoration-none text-dark"
                    style={{ cursor: "pointer" }}
                  >
                    <Card.Title className="wd-dashboard-course-title text-nowrap overflow-hidden">
                      {course.name}
                    </Card.Title>
                    <Card.Text className="wd-dashboard-course-description overflow-hidden" style={{ height: "100px" }}>
                      {course.description}
                    </Card.Text>
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <Button 
                      variant="primary"
                      onClick={(e) => handleCourseClick(course._id, e)}
                    >
                      Go
                    </Button>
                    {isFaculty && (
                      <>
                        <button onClick={(e) => {
                          e.preventDefault();
                          dispatch(deleteCourse(course._id));
                        }} className="btn btn-danger">
                          Delete
                        </button>
                        <button onClick={(e) => {
                          e.preventDefault();
                          dispatch(setSelectedCourse(course));
                        }} className="btn btn-warning">
                          Edit
                        </button>
                      </>
                    )}
                    {enrolling && (
                      <button 
                        className={`btn ${isEnrolled(course._id) ? "btn-danger" : "btn-success"} float-end`}
                        onClick={(e) => {
                          e.preventDefault();
                          isEnrolled(course._id) 
                            ? handleUnenrollClick(course._id, e) 
                            : handleEnrollClick(course._id, e);
                        }}
                      >
                        {isEnrolled(course._id) ? "Unenroll" : "Enroll"}
                      </button>
                    )}
                  </div>
                </Card.Body>
              </div>
            </div>
          ))}
        </Row>
      </div>
    </div>
  );
}
