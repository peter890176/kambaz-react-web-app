import axios from "axios";
const REMOTE_SERVER = import.meta.env.VITE_REMOTE_SERVER;
const axiosWithCredentials = axios.create({ withCredentials: true });

export const findAllEnrollments = async () => {
  try {
    const response = await axiosWithCredentials.get(`${REMOTE_SERVER}/api/enrollments`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return [];
  }
};

export const findEnrollmentsByUser = async (userId: string) => {
  try {
    const response = await axiosWithCredentials.get(`${REMOTE_SERVER}/api/users/${userId}/enrollments`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    return [];
  }
};

export const findEnrollmentsByCourse = async (courseId: string) => {
  try {
    const response = await axiosWithCredentials.get(`${REMOTE_SERVER}/api/courses/${courseId}/enrollments`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching course enrollments:", error);
    return [];
  }
};

export const enrollUserInCourse = async (userId: string, courseId: string) => {
  try {
    const response = await axiosWithCredentials.post(
      `${REMOTE_SERVER}/api/users/${userId}/courses/${courseId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error enrolling user in course:", error);
    throw error;
  }
};

export const unenrollUserFromCourse = async (userId: string, courseId: string) => {
  try {
    const response = await axiosWithCredentials.delete(
      `${REMOTE_SERVER}/api/users/${userId}/courses/${courseId}/unenroll`
    );
    return response.data;
  } catch (error) {
    console.error("Error unenrolling user from course:", error);
    throw error;
  }
};

export const isUserEnrolledInCourse = async (userId: string, courseId: string) => {
  try {
    const response = await axiosWithCredentials.get(
      `${REMOTE_SERVER}/api/users/${userId}/courses/${courseId}/enrolled`
    );
    return response.data;
  } catch (error) {
    console.error("Error checking enrollment status:", error);
    return false;
  }
}; 