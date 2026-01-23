/**
 * Authentication-related TypeScript types
 */

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive?: boolean;
  role?: Role;
  permissions?: string[]; // Direct permissions array from backend
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[] | string[]; // Can be array of Permission objects or strings
}

export interface Permission {
  id?: string;
  name: string;
  resource?: string;
  action?: 'create' | 'read' | 'update' | 'delete';
  description?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
}
