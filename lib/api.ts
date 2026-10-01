const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export interface TaskPayload {
  title: string;
  description?: string;
  urgent: boolean;
  important: boolean;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string | null;
}

export interface TaskResponse extends TaskPayload {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  expiresIn: number;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API request failed');
  }
  return response.json();
};

const buildHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(credentials),
  });
  return handleResponse<AuthResponse>(response);
};

export const register = async (credentials: RegisterRequest): Promise<void> => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Registration failed');
  }
};

export const logout = async (token?: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: buildHeaders(token),
  });
  if (!response.ok && response.status !== 204) {
    throw new Error('Logout failed');
  }
};

export const startGoogleOAuth = () => {
  window.location.href = `${BASE_URL.replace(/\/api\/?$/, '')}/oauth/google`;
};

export const getTasks = async (token: string): Promise<TaskResponse[]> => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
    headers: buildHeaders(token),
  });
  return handleResponse<TaskResponse[]>(response);
};

export const createTask = async (task: TaskPayload, token: string): Promise<TaskResponse> => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({
      title: task.title,
      description: task.description ?? '',
      urgent: task.urgent,
      important: task.important,
      status: task.status,
      dueDate: task.dueDate ?? null,
    }),
  });

  return handleResponse<TaskResponse>(response);
};

export const updateTask = async (
  id: number,
  task: TaskPayload,
  token: string
): Promise<TaskResponse> => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify({
      title: task.title,
      description: task.description ?? '',
      urgent: task.urgent,
      important: task.important,
      status: task.status,
      dueDate: task.dueDate ?? null,
    }),
  });

  return handleResponse<TaskResponse>(response);
};

export const deleteTask = async (id: number, token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
};
