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

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API request failed');
  }
  return response.json();
};

export const getTasks = async (): Promise<TaskResponse[]> => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<TaskResponse[]>(response);
};

export const createTask = async (task: TaskPayload): Promise<TaskResponse> => {
  console.log('[api] createTask', `${BASE_URL}/tasks`, task);
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  task: TaskPayload
): Promise<TaskResponse> => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
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

export const deleteTask = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
};
