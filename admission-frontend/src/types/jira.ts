export enum TaskType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  STORY = 'STORY',
  TASK = 'TASK',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  columns: Column[];
  members: ProjectMember[];
  _count?: { tasks: number };
}

export interface Column {
  id: string;
  projectId: string;
  name: string;
  order: number;
  color?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  position: number;
  assigneeId?: string;
  reporterId: string;
  dueDate?: string;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  reporter?: User;
  column?: Column;
  labels?: TaskLabel[];
  comments?: Comment[];
  attachments?: Attachment[];
  _count?: { comments: number; attachments: number };
}

export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: User;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface TaskLabel {
  taskId: string;
  labelId: string;
  label: Label;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedBy: string;
  createdAt: string;
  uploader: User;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  action: string;
  changes?: any;
  createdAt: string;
  user: User;
  task?: { id: string; title: string };
}
