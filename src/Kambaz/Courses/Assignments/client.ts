import axios from "axios";
const REMOTE_SERVER = import.meta.env.VITE_REMOTE_SERVER;
const ASSIGNMENTS_API = `${REMOTE_SERVER}/api/assignments`;
const MODULES_API = `${REMOTE_SERVER}/api/modules`;

export const findAllAssignments = async () => {
  try {
    const response = await axios.get(ASSIGNMENTS_API);
    return response.data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return [];
  }
};


export const findAssignmentsForModule = async (moduleId: string) => {
  try {
    const response = await axios.get(`${MODULES_API}/${moduleId}/assignments`);
    return response.data;
  } catch (error) {
    console.error("Error fetching module assignments:", error);
    return [];
  }
};

export const createAssignment = async (moduleId: string, assignment: any) => {
  try {
    const response = await axios.post(
      `${MODULES_API}/${moduleId}/assignments`,
      assignment
    );
    return response.data;
  } catch (error) {
    console.error("Error creating assignment:", error);
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
