import { Routes, Route, Navigate } from "react-router";
import Account from "./Account";
import Dashboard from "./Dashboard";
import KambazNavigation from "./Navigation";
import Courses from "./Courses";
import ProtectedRoute from "./Account/ProtectedRoute";
import Session from "./Account/Session";
import * as courseClient from "./Courses/client";
import * as userClient from "./Account/client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { 
  QuizzesList, 
  QuizDetails, 
  QuizEditor, 
  QuizAttempt, 
  QuizResults 
} from './Quizzes';


export default function Kambaz() {
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const [enrolling, setEnrolling] = useState<boolean>(false);

/*
  const addNewCourse = async () => {
    const newCourse = await courseClient.createCourse(courses);
    setCourses([...courses, newCourse]);
  };


  const deleteCourse = async (courseId: string) => {
    await courseClient.deleteCourse(courseId);
    setCourses(courses.filter((course) => course._id !== courseId));
  };

  const updateCourse = async (course: any) => {
    await courseClient.updateCourse(course);
    setCourses(courses.map((c) => {
      if (c._id === course._id) { return course; }
      else { return c; }
    }));
  };
  */

  const findCoursesForUser = async () => {
    try {
      await userClient.findCoursesForUser(currentUser._id);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCourses = async () => {
    try {
      const allCourses = await courseClient.fetchAllCourses();
      const enrolledCourses = await userClient.findCoursesForUser(currentUser._id);
      allCourses.map((course: any) => {
        if (enrolledCourses.find((c: any) => c._id === course._id)) {
          return { ...course, enrolled: true };
        } else {
          return course;
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  /*
   const updateEnrollment = async (courseId: string, enrolled: boolean) => {
   if (enrolled) {
     await userClient.enrollIntoCourse(currentUser._id, courseId);
   } else {
     await userClient.unenrollFromCourse(currentUser._id, courseId);
   }
   setCourses(
     courses.map((course) => {
       if (course._id === courseId) {
         return { ...course, enrolled: enrolled };
       } else {
         return course;
       }
     })
   );
 };
*/
  


  useEffect(() => {
    if (enrolling) {
      fetchCourses();
    } else {
      findCoursesForUser();
    }
  }, [currentUser, enrolling]);

  return (
    <Session>
      <div id="wd-kambaz">
        <KambazNavigation />
        <div className="wd-main-content-offset p-3" style={{ marginLeft: "120px" }}>
          <Routes>
            <Route path="/" element={<Navigate to="Dashboard" />} />
            <Route path="Account/*" element={<Account />} />
            <Route path="Dashboard" element={
              <ProtectedRoute>
                <Dashboard enrolling={enrolling} setEnrolling={setEnrolling}/>
              </ProtectedRoute>
            } />
            <Route path="Courses/:cid/*" element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            } />
            <Route path="Calendar" element={<h1>Calendar</h1>} />
            <Route path="Inbox" element={<h1>Inbox</h1>} />
            <Route path="Courses/:cid/Quizzes/new" element={<QuizEditor />} />
            <Route path="Courses/:cid/Quizzes" element={<QuizzesList />} />
            <Route path="Quizzes/:quizId/edit" element={<QuizEditor />} />
            <Route path="Quizzes/:quizId" element={<QuizDetails />} />
            <Route path="Quizzes/:quizId/attempt" element={<QuizAttempt />} />
            <Route path="Quizzes/:quizId/results" element={<QuizResults />} />
            <Route path="Quizzes" element={<Navigate to="/Kambaz/Dashboard" />} />
            <Route path="Courses" element={<Navigate to="/Kambaz/Dashboard" />} />
          </Routes>
        </div>
      </div>
    </Session>
  );
}
