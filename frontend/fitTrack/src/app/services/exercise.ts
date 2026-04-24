import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ExerciseDto {
  id: number;
  title: string;
  description?: string | null;
  videoLink?: string | null;
  imageUrl?: string | null;
  calories: number;
  isCore: boolean;
  isUpperBody: boolean;
  isLowerBody: boolean;
  difficulty: string;
  durationMinutes: number;
  equipment?: string | null;
  createdAtUtc: string;
}

export interface CreateExerciseDto {
  title: string;
  description?: string | null;
  videoLink?: string | null;
  imageUrl?: string | null;
  calories: number;
  isCore: boolean;
  isUpperBody: boolean;
  isLowerBody: boolean;
  difficulty: string;
  durationMinutes: number;
  equipment?: string | null;
}

export interface UpdateExerciseDto {
  title: string;
  description?: string | null;
  videoLink?: string | null;
  imageUrl?: string | null;
  calories: number;
  isCore: boolean;
  isUpperBody: boolean;
  isLowerBody: boolean;
  difficulty: string;
  durationMinutes: number;
  equipment?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {
  private apiUrl = `${environment.apiBaseUrl}/Exercises`;

  constructor(private http: HttpClient) {}

  getExercises(): Observable<ExerciseDto[]> {
    return this.http.get<ExerciseDto[]>(this.apiUrl);
  }

  getExerciseById(id: number): Observable<ExerciseDto> {
    return this.http.get<ExerciseDto>(`${this.apiUrl}/${id}`);
  }

  createExercise(data: CreateExerciseDto): Observable<ExerciseDto> {
    return this.http.post<ExerciseDto>(this.apiUrl, data);
  }

  updateExercise(id: number, data: UpdateExerciseDto): Observable<ExerciseDto> {
    return this.http.put<ExerciseDto>(`${this.apiUrl}/${id}`, data);
  }

  deleteExercise(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
