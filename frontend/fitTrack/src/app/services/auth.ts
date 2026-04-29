import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AuthUserProfile {
  id: number;
  fullName: string;
  email: string;
  weight: number | null;
  language: string;
  preferredDifficulty: string;
  preferredMuscleGroup: string;
  preferredWorkoutMinutes: number;
  preferredEquipment: string | null;
  defaultSets: number;
  defaultExerciseSeconds: number;
  defaultRestSeconds: number;
}

export interface AuthLoginResponse {
  token: string;
  user: AuthUserProfile;
}

export interface UpdateProfileDto {
  weight: number | null;
  language: string;
  preferredDifficulty: string;
  preferredMuscleGroup: string;
  preferredWorkoutMinutes: number;
  preferredEquipment: string | null;
  defaultSets: number;
  defaultExerciseSeconds: number;
  defaultRestSeconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/Auth`;
  private readonly tokenKey = 'token';
  private readonly userKey = 'user';
  private readonly languageKey = 'language';
  private readonly defaultLanguage = 'en';

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
    if (!this.isValidAuthResponse(response)) {
      this.clearSession();
      return;
    }

    this.setStorageItem(this.tokenKey, response.token.trim());
    this.setStorageItem(this.userKey, JSON.stringify(response.user));
    this.setStorageItem(this.languageKey, response.user.language || this.defaultLanguage);
  }

  updateStoredUser(user: AuthUserProfile): void {
    if (!this.isValidStoredUser(user)) {
      this.clearSession();
      return;
    }

    const token = this.getStoredToken();
    if (!token) {
      this.clearSession();
      return;
    }

    this.setStorageItem(this.userKey, JSON.stringify(user));
    this.setStorageItem(this.languageKey, user.language || this.defaultLanguage);
  }

  getStoredToken(): string | null {
    const token = localStorage.getItem(this.tokenKey)?.trim();

    if (!token) {
      return null;
    }

    return token;
  }

  getStoredUser(): AuthUserProfile | null {
    const storedUser = localStorage.getItem(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {
      const user = JSON.parse(storedUser) as AuthUserProfile;

      if (!this.isValidStoredUser(user)) {
        this.clearSession();
        return null;
      }

      return user;
    } catch {
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.languageKey);
  }

  private setStorageItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  private isValidAuthResponse(response: AuthLoginResponse | null | undefined): response is AuthLoginResponse {
    return !!response && typeof response.token === 'string' && !!response.token.trim() && this.isValidStoredUser(response.user);
  }

  private isValidStoredUser(user: AuthUserProfile | null | undefined): user is AuthUserProfile {
    return !!user &&
      Number.isInteger(user.id) &&
      user.id > 0 &&
      typeof user.email === 'string' &&
      !!user.email.trim() &&
      typeof user.fullName === 'string' &&
      typeof user.language === 'string';
  }
}
