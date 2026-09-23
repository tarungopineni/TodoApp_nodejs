import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { getToken } from './storage';
import { RegisterRequest, TokenResponse, UserProfile } from '../types/api';
import { Todo, TodoRequest } from '../types/todo';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout to allow Render free tier backend cold starts to wake up
});

// Interceptor to inject Bearer JWT token into request headers automatically
apiClient.interceptors.request.use(
  async config => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

export const authApi = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await apiClient.post<TokenResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    return response.data;
  },

  register: async (payload: RegisterRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.REGISTER,
      payload,
    );
    return response.data;
  },

  getUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(
      API_ENDPOINTS.USER.PROFILE,
    );
    return response.data;
  },
};

export const todosApi = {
  getTodos: async (): Promise<Todo[]> => {
    const response = await apiClient.get<Todo[]>(API_ENDPOINTS.TODOS.BASE);
    return response.data;
  },

  getTodoById: async (id: number | string): Promise<Todo> => {
    const response = await apiClient.get<Todo>(API_ENDPOINTS.TODOS.BY_ID(id));
    return response.data;
  },

  createTodo: async (payload: TodoRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.TODOS.CREATE,
      payload,
    );
    return response.data;
  },

  updateTodo: async (
    id: number | string,
    payload: TodoRequest,
  ): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(
      API_ENDPOINTS.TODOS.BY_ID(id),
      payload,
    );
    return response.data;
  },

  deleteTodo: async (id: number | string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TODOS.BY_ID(id));
  },
};

export default apiClient;
