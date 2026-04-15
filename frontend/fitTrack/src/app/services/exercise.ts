import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {
  private apiUrl = 'http://localhost:5240/api/Exercises';

  constructor(private http: HttpClient) {}

  getExercises(): Observable<ExerciseDto[]> {
    return this.http.get<ExerciseDto[]>(this.apiUrl);
  }

  createExercise(data: CreateExerciseDto): Observable<ExerciseDto> {
    return this.http.post<ExerciseDto>(this.apiUrl, data);
  }
}
