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

const enrollmentsSlice = createSlice({
  name: "enrollments",
  initialState,
  reducers: {
    toggleShowAllCourses: (state) => {
      state.showAllCourses = !state.showAllCourses;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnrollments.fulfilled, (state, action) => {
        state.enrollments = action.payload;
      })
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        state.enrollments.push(action.payload);
      })
      .addCase(unenrollFromCourse.fulfilled, (state, action) => {
        state.enrollments = state.enrollments.filter(
          (enrollment) => 
            !(enrollment.user === action.meta.arg.userId && 
              enrollment.course === action.meta.arg.courseId)
        );
      });
  },
});

export const { toggleShowAllCourses } = enrollmentsSlice.actions;
export default enrollmentsSlice.reducer; 