import { createSlice } from "@reduxjs/toolkit";
import { courses } from "../Database";

const initialState = {
  courses: courses,
  selectedCourse: null
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    addCourse: (state, { payload }) => {
      state.courses = [...state.courses, payload];
    },
    deleteCourse: (state, { payload: courseId }) => {
      state.courses = state.courses.filter(
        (course) => course._id !== courseId
      );
    },
    updateCourse: (state, { payload: course }) => {
      state.courses = state.courses.map((c) =>
        c._id === course._id ? course : c
      );
    },
    setSelectedCourse: (state, { payload: course }) => {
      state.selectedCourse = course;
    }
  },
});

export const { addCourse, deleteCourse, updateCourse, setSelectedCourse } =
  coursesSlice.actions;
export default coursesSlice.reducer;
