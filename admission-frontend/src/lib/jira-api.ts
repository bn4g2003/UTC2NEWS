/**
 * Jira API Helper
 * Centralized API calls for Jira functionality
 */

import { Project, Task } from '@/types/jira';

const JIRA_API_BASE = 'http://localhost:3000/api/jira';

// Helper to get auth token from Zustand persist storage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get from Zustand persist storage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    }
    
    // Fallback: try 'token' key (for backward compatibility)
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper to handle API response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// ============ Projects ============
export const jiraApi = {
  projects: {
    create: async (data: { name: string; key: string; description?: string }): Promise<Project> => {
      const response = await fetch(`${JIRA_API_BASE}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Project>(response);
    },

    getAll: async (): Promise<Project[]> => {
      const response = await fetch(`${JIRA_API_BASE}/projects`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<Project[]>(response);
    },

    getById: async (projectId: string): Promise<Project> => {
      const response = await fetch(`${JIRA_API_BASE}/projects/${projectId}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<Project>(response);
    },
  },

  // ============ Tasks ============
  tasks: {
    create: async (projectId: string, data: any): Promise<Task> => {
      const response = await fetch(`${JIRA_API_BASE}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Task>(response);
    },

    getById: async (taskId: string): Promise<Task> => {
      const response = await fetch(`${JIRA_API_BASE}/tasks/${taskId}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<Task>(response);
    },

    update: async (taskId: string, data: any): Promise<Task> => {
      const response = await fetch(`${JIRA_API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Task>(response);
    },

    move: async (taskId: string, data: { columnId: string; position: number; blockedReason?: string }): Promise<Task> => {
      const response = await fetch(`${JIRA_API_BASE}/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Task>(response);
    },

    delete: async (taskId: string): Promise<{ message: string }> => {
      const response = await fetch(`${JIRA_API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string }>(response);
    },
  },

  // ============ Comments ============
  comments: {
    create: async (taskId: string, content: string): Promise<any> => {
      const response = await fetch(`${JIRA_API_BASE}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      });
      return handleResponse(response);
    },
  },

  // ============ Filters ============
  filters: {
    getMyTasks: async (projectId?: string): Promise<Task[]> => {
      const url = projectId
        ? `${JIRA_API_BASE}/my-tasks?projectId=${projectId}`
        : `${JIRA_API_BASE}/my-tasks`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      return handleResponse<Task[]>(response);
    },

    searchTasks: async (projectId: string, query: string): Promise<Task[]> => {
      const response = await fetch(
        `${JIRA_API_BASE}/projects/${projectId}/search?q=${encodeURIComponent(query)}`,
        {
          headers: getAuthHeaders(),
        }
      );
      return handleResponse<Task[]>(response);
    },
  },

  // ============ Activity Logs ============
  activity: {
    getLogs: async (projectId: string): Promise<any[]> => {
      const response = await fetch(`${JIRA_API_BASE}/projects/${projectId}/activity`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<any[]>(response);
    },
  },

  // ============ Attachments ============
  attachments: {
    upload: async (taskId: string, file: File): Promise<any> => {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${JIRA_API_BASE}/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });
      return handleResponse(response);
    },

    delete: async (attachmentId: string): Promise<{ message: string }> => {
      const response = await fetch(`${JIRA_API_BASE}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string }>(response);
    },
  },

  // ============ Statistics ============
  statistics: {
    getProjectStats: async (projectId: string): Promise<any> => {
      const response = await fetch(`${JIRA_API_BASE}/projects/${projectId}/statistics`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getMySummary: async (): Promise<any> => {
      const response = await fetch(`${JIRA_API_BASE}/my-summary`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
  },

  // ============ Members ============
  members: {
    add: async (projectId: string, email: string, role?: 'ADMIN' | 'MEMBER'): Promise<any> => {
      const response = await fetch(`${JIRA_API_BASE}/projects/${projectId}/members`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, role }),
      });
      return handleResponse(response);
    },

    remove: async (projectId: string, memberId: string): Promise<{ message: string }> => {
      const response = await fetch(`${JIRA_API_BASE}/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse<{ message: string }>(response);
    },
  },
};
