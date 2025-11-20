import axios from 'axios';

const API_BASE_URL = 'http://localhost:56839/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const taskAPI = {
  // Create a new task
  createTask: (taskData) => {
    return apiClient.post('/tasks', taskData);
  },

  // Get task by ID
  getTask: (taskId) => {
    return apiClient.get(`/tasks/${taskId}`);
  },

  // Get all tasks (if endpoint exists)
  getAllTasks: () => {
    return apiClient.get('/tasks');
  },

  // Cancel a task
  cancelTask: (taskId) => {
    return apiClient.post(`/tasks/${taskId}/cancel`);
  },

  // Retry a task
  retryTask: (taskId) => {
    return apiClient.put(`/tasks/${taskId}/retry`);
  },

  // Update task (if endpoint exists)
  updateTask: (taskData) => {
    return apiClient.post(`/tasks/update`, taskData);
  },

  // Delete a task
  deleteTask: (taskId) => {
    return apiClient.delete(`/tasks/${taskId}`);
  },

  // Search task by messageId
  searchTaskByMessageId: (messageId) => {
    return apiClient.get(`/tasks/search?messageId=${messageId}`);
  },

  // Search tasks by time range with optional filters
  searchTasksByTimeRange: (startDate, endDate, priority = null, tenant = null) => {
    let url = `/tasks/search/timerange?startDate=${startDate}&endDate=${endDate}`;
    if (priority && priority.trim()) {
      url += `&priority=${encodeURIComponent(priority)}`;
    }
    if (tenant && tenant.trim()) {
      url += `&tenant=${encodeURIComponent(tenant)}`;
    }
    return apiClient.get(url);
  },
};

export default apiClient;
