import { useState, useEffect } from "react";
import { Button, FormControl } from "react-bootstrap";
import { Card } from "react-bootstrap";
import { Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useSelector, useDispatch } from "react-redux";
import { addCourse, deleteCourse, setSelectedCourse, updateCourse} from "./Courses/reducer";
import { toggleShowAllCourses, enrollInCourse, unenrollFromCourse } from "./Enrollments/reducer";
import { AppDispatch } from './store';

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { courses, selectedCourse } = useSelector((state: any) => state.coursesReducer);
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
    return enrollments.some(
      (enrollment: any) =>
        enrollment.user === currentUser._id &&
        enrollment.course === courseId
    );
  };

  const handleEnrollClick = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(enrollInCourse({ userId: currentUser._id, courseId }));
  };

  const handleUnenrollClick = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(unenrollFromCourse({ userId: currentUser._id, courseId }));
  };

  const handleCourseClick = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/Kambaz/Courses/${courseId}/Home`);
  };

  const displayedCourses = (showAllCourses || isAdmin || isTA || isFaculty)
    ? courses 
    : courses.filter((course: any) => isEnrolled(course._id));

  useEffect(() => {
    if (selectedCourse) {
      setNewCourse({
        name: selectedCourse.name,
        description: selectedCourse.description
      });
    }
  }, [selectedCourse]);

  return (
    <div id="wd-dashboard">
      <h1 id="wd-dashboard-title">Dashboard</h1> <hr />
      {isFaculty && (
        <>
          <h5>New Course
            <button className="btn btn-primary float-end"
                    id="wd-add-new-course-click"
                    onClick={() => {
                      dispatch(addCourse({ ...newCourse, _id: uuidv4() }));
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
        {(isStudent || isAdmin ) && (
          <Button
            variant="primary"
            onClick={() => dispatch(toggleShowAllCourses())}
            className="mb-3"
          >
            {showAllCourses ? "Show My Courses" : "Show All Courses"}
          </Button>
        )}
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
                    {isStudent && (
                      isEnrolled(course._id) ? (
                        <button
                          onClick={(e) => handleUnenrollClick(course._id, e)}
                          className="btn btn-danger"
                        >
                          Unenroll
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleEnrollClick(course._id, e)}
                          className="btn btn-success"
                        >
                          Enroll
                        </button>
                      )
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
