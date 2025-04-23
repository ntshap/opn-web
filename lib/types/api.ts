export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  organizer: User;
}