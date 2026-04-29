import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpParams } from '@angular/common/http';

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

export interface GenerateWorkoutQuery {
  userId?: number;
  difficulty?: string;
  muscleGroup?: string;
  equipment?: string | null;
  targetMinutes?: number;
  maxExercises?: number;
}

export interface GeneratedWorkoutDto {
  title: string;
  difficulty: string;
  muscleGroup: string;
  equipment?: string | null;
  targetMinutes: number;
  totalMinutes: number;
  totalCalories: number;
  prescribedSets: number;
  exerciseSeconds: number;
  restSeconds: number;
  exercises: ExerciseDto[];
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

  generateWorkout(query: GenerateWorkoutQuery): Observable<GeneratedWorkoutDto> {
    let params = new HttpParams();

    if (query.userId) {
      params = params.set('userId', query.userId.toString());
    }

    if (query.difficulty) {
      params = params.set('difficulty', query.difficulty);
    }

    if (query.muscleGroup) {
      params = params.set('muscleGroup', query.muscleGroup);
    }

    if (query.equipment) {
      params = params.set('equipment', query.equipment);
    }

    if (query.targetMinutes) {
      params = params.set('targetMinutes', query.targetMinutes.toString());
    }

    if (query.maxExercises) {
      params = params.set('maxExercises', query.maxExercises.toString());
    }

    return this.http.get<GeneratedWorkoutDto>(`${this.apiUrl}/generate-workout`, {
      params,
    });
  }
}
