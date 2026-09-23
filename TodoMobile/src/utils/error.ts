import axios from 'axios';

/**
 * Robust helper function to extract human-readable, non-technical error messages from API calls.
 * Gracefully handles 401 invalid credentials, Render cold-start timeouts, network failures, and 5xx errors.
 */
export const getErrorMessage = (
  error: unknown,
  fallbackMessage: string = 'Something went wrong. Please try again.',
): string => {
  if (axios.isAxiosError(error)) {
    // 1. Timeout / Render cold start timeout
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return 'The server is taking longer than usual to start. Please try again in a moment.';
    }

    // 2. Backend responded with an HTTP status code outside 2xx range
    if (error.response) {
      if (error.response.status === 401) {
        return 'Incorrect username or password.';
      }
      if (error.response.status === 403) {
        return 'Access forbidden. You do not have permission.';
      }
      if (error.response.status === 404) {
        return 'The requested resource was not found.';
      }
      if (error.response.status === 422) {
        return 'Validation error. Please check your form fields.';
      }
      if (error.response.status >= 500) {
        return 'Something went wrong. Please try again.';
      }

      const data = error.response.data;

      if (data) {
        if (data.detail) {
          if (typeof data.detail === 'string' && data.detail.trim()) {
            return data.detail;
          }
          if (Array.isArray(data.detail)) {
            const messages = data.detail
              .map((item: any) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object' && item.msg) return item.msg;
                return null;
              })
              .filter(Boolean);
            if (messages.length > 0) {
              return messages.join('\n');
            }
          }
        }

        if (data.message && typeof data.message === 'string' && data.message.trim()) {
          return data.message;
        }

        if (typeof data === 'string' && data.trim()) {
          return data;
        }
      }

      return `Server returned status code ${error.response.status}.`;
    }

    // 3. Genuine Network / Connection Error (No response received)
    if (error.request || error.code === 'ERR_NETWORK' || !error.response) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};
