import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add auth token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Don't set Content-Type for FormData - let browser set it automatically
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  adminLogin: (credentials) => API.post('/auth/admin/login', credentials),
  evaluatorLogin: (credentials) => API.post('/auth/evaluator/login', credentials),
};

export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getStudents: () => API.get('/students'),
  getEvaluators: () => API.get('/evaluators'),
  getAdmins: () => API.get('/admins'),
  
  // Student management
  createStudent: (studentData) => API.post('/students', studentData),
  updateStudent: (id, studentData) => API.put(`/students/${id}`, studentData),
  deleteStudent: (id) => API.delete(`/students/${id}`),
  
  // Evaluator management
  createEvaluator: (evaluatorData) => API.post('/evaluators', evaluatorData),
  updateEvaluator: (id, evaluatorData) => API.put(`/evaluators/${id}`, evaluatorData),
  deleteEvaluator: (id) => API.delete(`/evaluators/${id}`),
  
  // File upload and management - FIXED ENDPOINTS
  uploadAnswers: (formData) => API.post('/upload/answers', formData),
  getUploadedFiles: () => API.get('/upload'), // CHANGED from '/upload/answers'
  getFileInfo: (id) => API.get(`/upload/info/${id}`), // CHANGED from '/upload/answers/${id}'
  deleteFile: (id) => API.delete(`/upload/${id}`), // CHANGED from '/upload/answers/${id}'
  updateFile: (id, updates) => API.put(`/upload/${id}`, updates), // CHANGED from '/upload/answers/${id}'
};

export const questionsAPI = {
  // Questions management

  getQuestionById: (questionId) => API.get(`/questions/id/${questionId}`),
  getQuestionsBySubject: (subjectId) => API.get(`/questions/subject/${subjectId}`),
  getQuestionsByEvaluator: (evaluatorId) => API.get(`/questions/evaluator/${evaluatorId}`),
  createQuestion: (questionData) => API.post('/questions', questionData),
  updateQuestion: (id, questionData) => API.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => API.delete(`/questions/${id}`),
  getQuestion: (id) => API.get(`/questions/${id}`),
};

export const evaluatorAPI = {
  getProfile: () => API.get('/auth/evaluator/profile'),
  changePassword: (data) => API.post('/auth/evaluator/change-password', data),
};

export const evaluationsAPI = {
  // Evaluations management
  getAllEvaluations: () => API.get('/evaluations'),
  getEvaluationsByStudent: (studentId) => API.get(`/evaluations/student/${studentId}`),
  getEvaluationsBySubject: (subjectId) => API.get(`/evaluations/subject/${subjectId}`),
  evaluateAllQuestions: (data) => API.post('/evaluations/evaluate-all', data),
  evaluateSingleQuestion: (questionId, data) => API.post(`/evaluations/evaluate/${questionId}`, data),
  getEvaluationStats: () => API.get('/evaluations/stats/overall'),
  getEvaluationsByQuestion: (questionId) => API.get(`/evaluations/question/${questionId}`),
  createEvaluation: (data) => API.post('/evaluations', data),
};

export default API;