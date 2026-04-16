import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthUserProfile {
  id: number;
  fullName: string;
  email: string;
  weight: number | null;
  language: string;
}

export interface AuthLoginResponse {
  token: string;
  user: AuthUserProfile;
}

export interface UpdateProfileDto {
  weight: number | null;
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:5240/api/Auth';
  private readonly tokenKey = 'token';
  private readonly userKey = 'user';

  constructor(private http: HttpClient) {}

  register(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: { email: string; password: string }): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(`${this.apiUrl}/login`, data);
  }

  getProfile(id: number): Observable<AuthUserProfile> {
    return this.http.get<AuthUserProfile>(`${this.apiUrl}/profile/${id}`);
  }

  updateProfile(id: number, data: UpdateProfileDto): Observable<AuthUserProfile> {
    return this.http.put<AuthUserProfile>(`${this.apiUrl}/profile/${id}`, data);
  }

  storeSession(response: AuthLoginResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
  }

  getStoredUser(): AuthUserProfile | null {
    const storedUser = localStorage.getItem(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUserProfile;
    } catch {
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}