import axios from "axios";

// Get server address from environment variables
const REMOTE_SERVER = import.meta.env.VITE_REMOTE_SERVER || 'http://localhost:4000';
const API_BASE = `${REMOTE_SERVER}/api`;

// Add global error handling and logging
axios.interceptors.request.use(
  config => {
    console.log(`Request sent: ${config.method?.toUpperCase()} ${config.url}`, config);
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => {
    console.log(`Response received: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`Request failed: ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Create axios instance with authentication functionality
const axiosWithCredentials = axios.create({ 
  baseURL: API_BASE,
  withCredentials: true 
});

// Get current user session information
export const getCurrentUserSession = async () => {
  try {
    console.log("Getting current user session information");
    // Use public API_BASE
    
    const response = await axiosWithCredentials.get(`/users/me`);
    
    console.log("User session retrieved successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to get user session:", error);
    if (error.response) {
      return { error: true, status: error.response.status, message: error.response.data?.message || "Failed to get session" };
    }
    return { error: true, message: error.message || "Unknown error" };
  }
};

// Get quizzes for a course - Add detailed logs
export const getQuizzesForCourse = async (courseId: string) => {
  try {
    console.log(`Getting quiz list for course ${courseId}`);
    console.log(`API URL: ${API_BASE}/courses/${courseId}/quizzes`);
    
    // Add request start timestamp
    const startTime = new Date().getTime();
    const response = await axiosWithCredentials.get(`/courses/${courseId}/quizzes`);
    
    // Calculate request time
    const endTime = new Date().getTime();
    const requestTime = endTime - startTime;
    
    console.log(`Quiz list retrieved successfully, time: ${requestTime}ms`);
    console.log("Retrieved quiz data:", response.data);
    
    return response.data;
  } catch (error: any) {
    console.error("Failed to get quiz list:", error);
    
    // Add detailed error information
    if (error.response) {
      console.error("Server returned error:", {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error("Request sent but no response received");
    } else {
      console.error("Request setup error:", error.message);
    }
    
    throw error;
  }
};

// Create new quiz
export const createQuiz = async (courseId: string, quizData: any) => {
  try {
    console.log(`Attempting to create new quiz, course ID: ${courseId}`);
    // Pass data directly to backend, backend will get courseId from URL
    const response = await axiosWithCredentials.post(`/courses/${courseId}/quizzes`, quizData);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create quiz:", error);
    throw error;
  }
};

export const getQuizById = async (quizId: string) => {
  try {
    console.log(`Getting quiz details, ID: ${quizId}`);
    const response = await axiosWithCredentials.get(`/quizzes/${quizId}`);
    return response;
  } catch (error: any) {
    console.error("Failed to get quiz details:", error);
    throw error;
  }
};

// Update quiz
export const updateQuiz = async (quizId: string, quizData: any) => {
  try {
    console.log(`Attempting to update quiz, ID: ${quizId}`);
    const response = await axiosWithCredentials.put(`/quizzes/${quizId}`, quizData);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update quiz:", error);
    throw error;
  }
};

// Delete quiz
export const deleteQuiz = async (quizId: string) => {
  try {
    const response = await axiosWithCredentials.delete(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete quiz:", error);
    throw error;
  }
};

// Publish quiz
export const publishQuiz = async (quizId: string) => {
  try {
    const response = await axiosWithCredentials.put(`/quizzes/${quizId}/publish`);
    return response.data;
  } catch (error) {
    console.error("Failed to publish quiz:", error);
    throw error;
  }
};

// Unpublish quiz
export const unpublishQuiz = async (quizId: string) => {
  try {
    const response = await axiosWithCredentials.put(`/quizzes/${quizId}/unpublish`);
    return response.data;
  } catch (error) {
    console.error("Failed to unpublish quiz:", error);
    throw error;
  }
};

// Create quiz attempt
export const createAttempt = async (quizId: string) => {
  try {
    console.log(`Attempting to create attempt record for quiz(${quizId})`);
    const response = await axiosWithCredentials.post(`/quizzes/${quizId}/attempts`);
    
    // Check if returned data is valid
    if (!response || !response.data) {
      console.error("Server returned invalid data:", response);
      throw new Error("Server returned invalid attempt data");
    }
    
    console.log("Quiz attempt created successfully:", response.data);
    return response; // Return entire response object, including data property
  } catch (error) {
    console.error("Failed to create quiz attempt:", error);
    throw error;
  }
};

// Submit quiz answers
export const submitAttempt = async (attemptId: string, answers: any) => {
  try {
    const response = await axiosWithCredentials.put(`/attempts/${attemptId}`, { answers });
    return response.data;
  } catch (error) {
    console.error("Failed to submit quiz answers:", error);
    throw error;
  }
};

// Get user's quiz attempts
export const getAttemptsForQuiz = async (quizId: string) => {
  try {
    const response = await axiosWithCredentials.get(`/quizzes/${quizId}/attempts`);
    return response.data;
  } catch (error) {
    console.error("Failed to get quiz attempt records:", error);
    throw error;
  }
};

// Test only - API that doesn't require authentication
export const testQuizAPI = async (courseId: string) => {
  try {
    console.log(`Executing test API call, course ID: ${courseId}`);
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
    
    // Use direct axios call instead of instance
    const response = await axios.get(`${API_BASE}/courses/${courseId}/quizzes/test`, {
      withCredentials: true,
      timeout: 5000, // Add timeout setting
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log("Test API response successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Test API failed:", error);
    
    if (error.response) {
      // Server returned non-2xx response
      console.error("Server error response:", {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // Request sent but no response received
      console.error("No server response received");
    }
    
    // Use mock data as fallback
    console.log("Returning mock quiz data as fallback");
    return {
      message: "Using mock quiz data",
      quiz: [{
        _id: "mock-quiz-1",
        title: "Mock Quiz (API Call Failed)",
        description: "This is a mock quiz because the API call failed",
        quizType: "PRACTICE_QUIZ",
        totalPoints: 10,
        published: true,
        questions: []
      }]
    };
  }
};