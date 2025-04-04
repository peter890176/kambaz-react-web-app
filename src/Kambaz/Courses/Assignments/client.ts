import axios, { AxiosError } from "axios";
const REMOTE_SERVER = import.meta.env.VITE_REMOTE_SERVER;
const ASSIGNMENTS_API = `${REMOTE_SERVER}/api/assignments`;
const COURSES_API = `${REMOTE_SERVER}/api/courses`;

export const findAllAssignments = async () => {
  try {
    const response = await axios.get(ASSIGNMENTS_API);
    return response.data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return [];
  }
};

export const findAssignmentsForCourse = async (courseId: string) => {
  try {
    const response = await axios.get(`${COURSES_API}/${courseId}/assignments`);
    return response.data;
  } catch (error) {
    console.error("Error fetching course assignments:", error);
    return [];
  }
};

export const createAssignment = async (courseId: string, assignment: any) => {
  try {
    // Format date fields and ensure points is a number
    const formattedAssignment = {
      ...assignment,
      points: Number(assignment.points),
      due: new Date(assignment.due).toISOString(),
      availableFrom: new Date(assignment.availableFrom).toISOString(),
      availableUntil: new Date(assignment.availableUntil).toISOString()
    };
    
    console.log("Assignment data being sent to API:", formattedAssignment);
    
    const response = await axios.post(
      `${COURSES_API}/${courseId}/assignments`,
      formattedAssignment
    );
    
    console.log("API response:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating assignment:", error);
    if (error instanceof AxiosError) {
      console.error("Error response details:", error.response?.data);
    }
    throw error;
  }
};

export const deleteAssignment = async (assignmentId: string) => {
  try {
    const response = await axios.delete(`${ASSIGNMENTS_API}/${assignmentId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw error;
  }
};

export const updateAssignment = async (assignmentId: string, assignment: any) => {
  try {
    const response = await axios.put(
      `${ASSIGNMENTS_API}/${assignmentId}`,
      assignment
    );
    return response.data;
  } catch (error) {
    console.error("Error updating assignment:", error);
    throw error;
  }
};
