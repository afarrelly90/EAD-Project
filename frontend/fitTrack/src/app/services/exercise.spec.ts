import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import {
  CreateExerciseDto,
  ExerciseDto,
  ExerciseService,
  GeneratedWorkoutDto,
  UpdateExerciseDto,
} from './exercise';

describe('ExerciseService', () => {
  let service: ExerciseService;
  let httpMock: HttpTestingController;

  const apiUrl =
    'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api/Exercises';

  const exercise: ExerciseDto = {
    id: 2,
    title: 'Plank',
    description: 'Core stability exercise',
    videoLink: 'https://example.com/plank',
    imageUrl: 'https://example.com/plank.png',
    calories: 45,
    isCore: true,
    isUpperBody: false,
    isLowerBody: false,
    difficulty: 'Beginner',
    durationMinutes: 5,
    equipment: null,
    createdAtUtc: '2026-04-15T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExerciseService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ExerciseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all exercises', () => {
    service.getExercises().subscribe((response) => {
      expect(response).toEqual([exercise]);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([exercise]);
  });

  it('should fetch a single exercise by id', () => {
    service.getExerciseById(2).subscribe((response) => {
      expect(response).toEqual(exercise);
    });

    const req = httpMock.expectOne(`${apiUrl}/2`);
    expect(req.request.method).toBe('GET');
    req.flush(exercise);
  });

  it('should create an exercise', () => {
    const payload: CreateExerciseDto = {
      title: 'Push-Up',
      description: 'Upper body exercise',
      videoLink: 'https://example.com/push-up',
      imageUrl: 'https://example.com/push-up.png',
      calories: 60,
      isCore: false,
      isUpperBody: true,
      isLowerBody: false,
      difficulty: 'Intermediate',
      durationMinutes: 10,
      equipment: null,
    };

    service.createExercise(payload).subscribe((response) => {
      expect(response).toEqual(exercise);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(exercise);
  });

  it('should update an exercise', () => {
    const payload: UpdateExerciseDto = {
      title: 'Updated Plank',
      description: 'Updated description',
      videoLink: 'https://example.com/updated-plank',
      imageUrl: 'https://example.com/updated-plank.png',
      calories: 50,
      isCore: true,
      isUpperBody: false,
      isLowerBody: false,
      difficulty: 'Advanced',
      durationMinutes: 6,
      equipment: 'Mat',
    };

    service.updateExercise(2, payload).subscribe((response) => {
      expect(response).toEqual(exercise);
    });

    const req = httpMock.expectOne(`${apiUrl}/2`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(exercise);
  });

  it('should delete an exercise', () => {
    service.deleteExercise(2).subscribe((response) => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${apiUrl}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should generate a workout with all supported query parameters', () => {
    const generatedWorkout: GeneratedWorkoutDto = {
      title: 'Beginner Core Blast',
      difficulty: 'Beginner',
      muscleGroup: 'Core',
      equipment: 'Mat',
      targetMinutes: 20,
      totalMinutes: 18,
      totalCalories: 140,
      prescribedSets: 3,
      exerciseSeconds: 45,
      restSeconds: 60,
      exercises: [exercise],
    };

    service
      .generateWorkout({
        userId: 8,
        difficulty: 'Beginner',
        muscleGroup: 'Core',
        equipment: 'Mat',
        targetMinutes: 20,
        maxExercises: 4,
      })
      .subscribe((response) => {
        expect(response).toEqual(generatedWorkout);
      });

    const req = httpMock.expectOne((request) => {
      return (
        request.method === 'GET' &&
        request.url === `${apiUrl}/generate-workout` &&
        request.params.get('userId') === '8' &&
        request.params.get('difficulty') === 'Beginner' &&
        request.params.get('muscleGroup') === 'Core' &&
        request.params.get('equipment') === 'Mat' &&
        request.params.get('targetMinutes') === '20' &&
        request.params.get('maxExercises') === '4'
      );
    });

    req.flush(generatedWorkout);
  });

  it('should omit empty generate-workout query parameters', () => {
    service.generateWorkout({ equipment: null }).subscribe((response) => {
      expect(response.title).toBe('Fallback Plan');
      expect(response.equipment).toBeNull();
      expect(response.exercises.length).toBe(1);
    });

    const req = httpMock.expectOne((request) => {
      return (
        request.method === 'GET' &&
        request.url === `${apiUrl}/generate-workout` &&
        request.params.keys().length === 0
      );
    });

    req.flush({
      title: 'Fallback Plan',
      difficulty: 'Beginner',
      muscleGroup: 'Core',
      equipment: null,
      targetMinutes: 10,
      totalMinutes: 10,
      totalCalories: 70,
      prescribedSets: 2,
      exerciseSeconds: 30,
      restSeconds: 30,
      exercises: [exercise],
    } satisfies GeneratedWorkoutDto);
  });
});
