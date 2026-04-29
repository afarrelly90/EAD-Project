import { WorkoutPlannerService } from './workout-planner.service';
import { GeneratedWorkoutDto } from './exercise';

describe('WorkoutPlannerService', () => {
  let service: WorkoutPlannerService;

  const workout: GeneratedWorkoutDto = {
    title: 'Core Starter',
    difficulty: 'Beginner',
    muscleGroup: 'Core',
    equipment: null,
    targetMinutes: 15,
    totalMinutes: 14,
    totalCalories: 110,
    prescribedSets: 3,
    exerciseSeconds: 40,
    restSeconds: 20,
    exercises: [],
  };

  beforeEach(() => {
    localStorage.clear();
    service = new WorkoutPlannerService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return null when there is no workout stored', () => {
    expect(service.getWorkout()).toBeNull();
  });

  it('should store and return a workout from memory', () => {
    service.setWorkout(workout);

    expect(service.getWorkout()).toEqual(workout);
    expect(localStorage.getItem('generated-workout')).toBe(JSON.stringify(workout));
  });

  it('should load a workout from local storage when memory is empty', () => {
    localStorage.setItem('generated-workout', JSON.stringify(workout));

    expect(service.getWorkout()).toEqual(workout);
  });

  it('should return null when stored workout JSON is invalid', () => {
    localStorage.setItem('generated-workout', '{bad json');

    expect(service.getWorkout()).toBeNull();
  });

  it('should clear the stored workout', () => {
    service.setWorkout(workout);

    service.clearWorkout();

    expect(service.getWorkout()).toBeNull();
    expect(localStorage.getItem('generated-workout')).toBeNull();
  });
});
