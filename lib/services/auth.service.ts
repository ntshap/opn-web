import { apiClient } from '../api/client';
import { API_CONFIG } from '../config';
import type { AuthResponse, User } from '../types/api';

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    const response = await apiClient.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    this.setTokens(response.token, response.refreshToken);
    return response;
  }

  static async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(API_CONFIG.ENDPOINTS.AUTH.ME);
  }

  static async logout(): Promise<void> {
    localStorage.removeItem(API_CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY);
    window.location.href = '/login';
  }

  private static setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(API_CONFIG.AUTH.TOKEN_KEY, token);
    localStorage.setItem(API_CONFIG.AUTH.REFRESH_TOKEN_KEY, refreshToken);
  }
}