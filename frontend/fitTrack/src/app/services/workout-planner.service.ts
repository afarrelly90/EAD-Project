import { Injectable } from '@angular/core';
import { GeneratedWorkoutDto } from './exercise';

@Injectable({
  providedIn: 'root',
})
export class WorkoutPlannerService {
  private readonly storageKey = 'generated-workout';
  private workout: GeneratedWorkoutDto | null = null;

  setWorkout(workout: GeneratedWorkoutDto): void {
    this.workout = workout;
    localStorage.setItem(this.storageKey, JSON.stringify(workout));
  }

  getWorkout(): GeneratedWorkoutDto | null {
    if (this.workout) {
      return this.workout;
    }

    const storedWorkout = localStorage.getItem(this.storageKey);
    if (!storedWorkout) {
      return null;
    }

    try {
      this.workout = JSON.parse(storedWorkout) as GeneratedWorkoutDto;
      return this.workout;
    } catch {
      return null;
    }
  }

  clearWorkout(): void {
    this.workout = null;
    localStorage.removeItem(this.storageKey);
  }
}
