// Base API Configuration
// Production FastAPI Backend deployed on Render:
const PRODUCTION_URL = 'https://todoapp-a2ny.onrender.com';
const DEV_URL = 'http://10.0.2.2:3000'; // For local dev server on Android emulator

// Uses dev URL in local React Native dev mode (__DEV__) and deployed Render URL in production
export const API_BASE_URL = typeof __DEV__ !== 'undefined' && __DEV__ ? DEV_URL : PRODUCTION_URL;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/token',
    REGISTER: '/auth/create',
  },
  USER: {
    PROFILE: '/user/',
  },
  TODOS: {
    BASE: '/todos/',
    CREATE: '/todos/todos',
    BY_ID: (id: number | string) => `/todos/todo/${id}`,
  },
};
