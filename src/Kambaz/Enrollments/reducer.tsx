/*Modified by ai*/ 
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as enrollmentClient from "./client";

const initialState = {
  enrollments: [] as Array<{
    _id: string;
    user: string;
    course: string;
  }>,
  showAllCourses: false
};

// Create async thunk actions
export const fetchEnrollments = createAsyncThunk(
  "enrollments/fetchAll",
  async () => {
    return await enrollmentClient.findAllEnrollments();
  }
);

export const enrollInCourse = createAsyncThunk(
  "enrollments/enroll",
  async ({ userId, courseId }: { userId: string; courseId: string }) => {
    return await enrollmentClient.enrollUserInCourse(userId, courseId);
  }
);

export const unenrollFromCourse = createAsyncThunk(
  "enrollments/unenroll",
  async ({ userId, courseId }: { userId: string; courseId: string }) => {
    return await enrollmentClient.unenrollUserFromCourse(userId, courseId);
  }
);

export const fetchUserEnrollments = createAsyncThunk(
  "enrollments/fetchUserEnrollments",
  async (userId: string) => {
    const enrollments = await enrollmentClient.findEnrollmentsByUser(userId);
    return enrollments;
  }
);

const enrollmentsSlice = createSlice({
  name: "enrollments",
  initialState,
  reducers: {
    toggleShowAllCourses: (state) => {
      state.showAllCourses = !state.showAllCourses;
    },
    setEnrollments: (state, action) => {
      state.enrollments = action.payload;
    },
    addEnrollment: (state, action) => {
      state.enrollments.push({
        _id: action.payload._id || new Date().getTime().toString(),
        user: action.payload.userId || action.payload.user,
        course: action.payload.courseId || action.payload.course
      });
    },
    removeEnrollment: (state, action) => {
      state.enrollments = state.enrollments.filter(
        (enrollment) => 
          !(enrollment.user === action.payload.userId && 
            enrollment.course === action.payload.courseId)
      );
    },
    setUserEnrollments: (state, action) => {
      state.enrollments = action.payload;
    },
  }
});

export const { 
  toggleShowAllCourses, 
  setEnrollments, 
  addEnrollment, 
  removeEnrollment, 
  setUserEnrollments 
} = enrollmentsSlice.actions;

export default enrollmentsSlice.reducer; 