import axios from "axios";

// 從環境變數獲取服務器地址
const REMOTE_SERVER = import.meta.env.VITE_REMOTE_SERVER || 'http://localhost:4000';
const API_BASE = `${REMOTE_SERVER}/api`;

// 添加全局錯誤處理和日誌記錄
axios.interceptors.request.use(
  config => {
    console.log(`發出請求: ${config.method?.toUpperCase()} ${config.url}`, config);
    return config;
  },
  error => {
    console.error('請求攔截器錯誤:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => {
    console.log(`收到響應: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`請求失敗: ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.error('未收到響應:', error.request);
    } else {
      console.error('請求錯誤:', error.message);
    }
    return Promise.reject(error);
  }
);

// 創建具有認證功能的 axios 實例
const axiosWithCredentials = axios.create({ 
  baseURL: API_BASE,
  withCredentials: true 
});

// 獲取當前用戶會話信息
export const getCurrentUserSession = async () => {
  try {
    console.log("正在獲取當前用戶會話信息");
    // 改用公共的API_BASE
    
    const response = await axiosWithCredentials.get(`/users/me`);
    
    console.log("獲取用戶會話成功:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("獲取用戶會話失敗:", error);
    if (error.response) {
      return { error: true, status: error.response.status, message: error.response.data?.message || "獲取會話失敗" };
    }
    return { error: true, message: error.message || "未知錯誤" };
  }
};

// 獲取課程中的測驗列表 - 添加詳細日誌
export const getQuizzesForCourse = async (courseId: string) => {
  try {
    console.log(`正在獲取課程 ${courseId} 的測驗列表`);
    console.log(`API URL: ${API_BASE}/courses/${courseId}/quizzes`);
    
    // 添加請求開始時間戳
    const startTime = new Date().getTime();
    const response = await axiosWithCredentials.get(`/courses/${courseId}/quizzes`);
    
    // 計算請求時間
    const endTime = new Date().getTime();
    const requestTime = endTime - startTime;
    
    console.log(`測驗列表獲取成功，耗時: ${requestTime}ms`);
    console.log("獲取到的測驗數據:", response.data);
    
    return response.data;
  } catch (error: any) {
    console.error("獲取測驗列表失敗:", error);
    
    // 添加詳細錯誤信息
    if (error.response) {
      console.error("服務器返回錯誤:", {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error("請求已發送但沒有收到響應");
    } else {
      console.error("請求設置出錯:", error.message);
    }
    
    throw error;
  }
};

// 創建新測驗
export const createQuiz = async (courseId: string, quizData: any) => {
  try {
    console.log(`嘗試創建新測驗，課程ID: ${courseId}`);
    // 直接將數據傳給後端，後端會從URL中獲取courseId
    const response = await axiosWithCredentials.post(`/courses/${courseId}/quizzes`, quizData);
    return response.data;
  } catch (error: any) {
    console.error("創建測驗失敗:", error);
    throw error;
  }
};

// 獲取測驗詳情
export const getQuizById = async (quizId: string) => {
  try {
    console.log(`嘗試獲取測驗詳情，ID: ${quizId}`);
    const response = await axiosWithCredentials.get(`/quizzes/${quizId}`);
    return response;  // 返回整個響應對象，包含data屬性
  } catch (error: any) {
    console.error("獲取測驗詳情失敗:", error);
    throw error;
  }
};

// 更新測驗
export const updateQuiz = async (quizId: string, quizData: any) => {
  try {
    console.log(`嘗試更新測驗，ID: ${quizId}`);
    const response = await axiosWithCredentials.put(`/quizzes/${quizId}`, quizData);
    return response.data;
  } catch (error: any) {
    console.error("更新測驗失敗:", error);
    throw error;
  }
};

// 刪除測驗
export const deleteQuiz = async (quizId: string) => {
  try {
    const response = await axiosWithCredentials.delete(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error("刪除測驗失敗:", error);
    throw error;
  }
};

// 發布測驗
export const publishQuiz = async (quizId: string) => {
  try {
    const response = await axiosWithCredentials.put(`/quizzes/${quizId}/publish`);
    return response.data;
  } catch (error) {
    console.error("發布測驗失敗:", error);
    throw error;
  }
};

// 取消發布測驗
export const unpublishQuiz = async (quizId: string) => {
  try {
    const response = await axiosWithCredentials.put(`/quizzes/${quizId}/unpublish`);
    return response.data;
  } catch (error) {
    console.error("取消發布測驗失敗:", error);
    throw error;
  }
};

// 創建測驗嘗試
export const createAttempt = async (quizId: string) => {
  try {
    console.log(`嘗試創建測驗(${quizId})的嘗試記錄`);
    const response = await axiosWithCredentials.post(`/quizzes/${quizId}/attempts`);
    
    // 檢查返回的數據是否有效
    if (!response || !response.data) {
      console.error("伺服器返回的數據無效:", response);
      throw new Error("伺服器返回的嘗試數據無效");
    }
    
    console.log("創建測驗嘗試成功:", response.data);
    return response; // 返回整個 response 對象，包含 data 屬性
  } catch (error) {
    console.error("創建測驗嘗試失敗:", error);
    throw error;
  }
};

// 提交測驗答案
export const submitAttempt = async (attemptId: string, answers: any) => {
  try {
    const response = await axiosWithCredentials.put(`/attempts/${attemptId}`, { answers });
    return response.data;
  } catch (error) {
    console.error("提交測驗答案失敗:", error);
    throw error;
  }
};

// 獲取用戶的測驗嘗試
export const getAttemptsForQuiz = async (quizId: string) => {
  try {
    const response = await axiosWithCredentials.get(`/quizzes/${quizId}/attempts`);
    return response.data;
  } catch (error) {
    console.error("獲取測驗嘗試記錄失敗:", error);
    throw error;
  }
};

// 測試專用 - 不需要認證的 API
export const testQuizAPI = async (courseId: string) => {
  try {
    console.log(`正在執行測試 API 調用，課程ID: ${courseId}`);
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
    
    // 使用直接的 axios 調用而不是實例
    const response = await axios.get(`${API_BASE}/courses/${courseId}/quizzes/test`, {
      withCredentials: true,
      timeout: 5000, // 添加超時設置
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log("測試 API 響應成功:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("測試 API 失敗:", error);
    
    if (error.response) {
      // 服務器返回非 2xx 響應
      console.error("服務器錯誤響應:", {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // 請求已發送但未收到響應
      console.error("未收到服務器響應");
    }
    
    // 使用模擬數據作為後備
    console.log("返回模擬測驗數據作為後備");
    return {
      message: "使用模擬測驗數據",
      quiz: [{
        _id: "mock-quiz-1",
        title: "模擬測驗 (API調用失敗)",
        description: "這是一個模擬測驗，因為API調用失敗",
        quizType: "PRACTICE_QUIZ",
        totalPoints: 10,
        published: true,
        questions: []
      }]
    };
  }
};