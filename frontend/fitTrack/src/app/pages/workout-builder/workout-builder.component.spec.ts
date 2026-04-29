import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { WorkoutBuilderComponent } from './workout-builder.component';
import { AuthService, AuthUserProfile } from 'src/app/services/auth';
import {
  ExerciseService,
  GeneratedWorkoutDto,
} from 'src/app/services/exercise';
import { WorkoutPlannerService } from 'src/app/services/workout-planner.service';

describe('WorkoutBuilderComponent', () => {
  let component: WorkoutBuilderComponent;
  let fixture: ComponentFixture<WorkoutBuilderComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let exerciseService: jasmine.SpyObj<ExerciseService>;
  let workoutPlannerService: jasmine.SpyObj<WorkoutPlannerService>;
  let router: jasmine.SpyObj<Router>;

  const storedUser: AuthUserProfile = {
    id: 7,
    fullName: 'Workout Tester',
    email: 'tester@example.com',
    weight: 78,
    language: 'en',
    preferredDifficulty: 'Intermediate',
    preferredMuscleGroup: 'Upper',
    preferredWorkoutMinutes: 30,
    preferredEquipment: 'Bench',
    defaultSets: 4,
    defaultExerciseSeconds: 50,
    defaultRestSeconds: 70,
  };

  const generatedWorkout: GeneratedWorkoutDto = {
    title: 'Upper Body Builder',
    difficulty: 'Intermediate',
    muscleGroup: 'Upper',
    equipment: 'Bench',
    targetMinutes: 30,
    totalMinutes: 28,
    totalCalories: 220,
    prescribedSets: 4,
    exerciseSeconds: 50,
    restSeconds: 70,
    exercises: [
      {
        id: 1,
        title: 'Push-Ups',
        description: null,
        videoLink: null,
        imageUrl: null,
        calories: 70,
        isCore: false,
        isUpperBody: true,
        isLowerBody: false,
        difficulty: 'Intermediate',
        durationMinutes: 8,
        equipment: 'Bench',
        createdAtUtc: '2026-04-15T10:00:00Z',
      },
      {
        id: 2,
        title: 'Bench Dips',
        description: null,
        videoLink: null,
        imageUrl: null,
        calories: 75,
        isCore: false,
        isUpperBody: true,
        isLowerBody: false,
        difficulty: 'Intermediate',
        durationMinutes: 10,
        equipment: 'Bench',
        createdAtUtc: '2026-04-15T10:05:00Z',
      },
    ],
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getStoredUser',
      'getProfile',
    ]);
    exerciseService = jasmine.createSpyObj<ExerciseService>('ExerciseService', [
      'generateWorkout',
    ]);
    workoutPlannerService = jasmine.createSpyObj<WorkoutPlannerService>(
      'WorkoutPlannerService',
      ['getWorkout', 'setWorkout', 'clearWorkout']
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authService.getStoredUser.and.returnValue(storedUser);
    authService.getProfile.and.returnValue(of(storedUser));
    exerciseService.generateWorkout.and.returnValue(of(generatedWorkout));
    workoutPlannerService.getWorkout.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [WorkoutBuilderComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ExerciseService, useValue: exerciseService },
        { provide: WorkoutPlannerService, useValue: workoutPlannerService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and load saved profile preferences into the form', () => {
    expect(component).toBeTruthy();
    expect(authService.getProfile).toHaveBeenCalledWith(storedUser.id);
    expect(component.builderForm.value.difficulty).toBe('Intermediate');
    expect(component.builderForm.value.muscleGroup).toBe('Upper');
    expect(component.builderForm.value.equipment).toBe('Bench');
    expect(component.builderForm.value.targetMinutes).toBe(30);
  });

  it('should redirect to login when there is no stored user', async () => {
    router.navigate.calls.reset();
    authService.getProfile.calls.reset();
    authService.getStoredUser.and.returnValue(null);

    const redirectedFixture = TestBed.createComponent(WorkoutBuilderComponent);
    redirectedFixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(authService.getProfile).not.toHaveBeenCalled();
  });

  it('should block workout generation when the form is invalid', () => {
    component.builderForm.patchValue({
      targetMinutes: 999,
    });

    component.generateWorkout();

    expect(component.showValidationMessage).toBeTrue();
    expect(exerciseService.generateWorkout).not.toHaveBeenCalled();
  });

  it('should generate a workout and persist it in the planner service', () => {
    component.builderForm.patchValue({
      difficulty: 'Advanced',
      muscleGroup: 'Lower',
      equipment: 'None',
      targetMinutes: 24,
      maxExercises: 3,
    });

    component.generateWorkout();

    expect(exerciseService.generateWorkout).toHaveBeenCalledWith({
      userId: storedUser.id,
      difficulty: 'Advanced',
      muscleGroup: 'Lower',
      equipment: null,
      targetMinutes: 24,
      maxExercises: 3,
    });
    expect(component.generatedWorkout).toEqual(generatedWorkout);
    expect(workoutPlannerService.setWorkout).toHaveBeenCalledWith(generatedWorkout);
    expect(component.isGenerating).toBeFalse();
  });

  it('should surface the backend error message when generation fails', () => {
    exerciseService.generateWorkout.and.returnValue(
      throwError(() => ({
        error: { message: 'No exercises matched your filters.' },
      }))
    );

    component.generateWorkout();

    expect(component.hasError).toBeTrue();
    expect(component.errorMessage).toBe('No exercises matched your filters.');
    expect(component.generatedWorkout).toBeNull();
    expect(component.isGenerating).toBeFalse();
  });

  it('should navigate to the guided workout when a generated plan exists', () => {
    component.generatedWorkout = generatedWorkout;

    component.startGuidedWorkout();

    expect(router.navigate).toHaveBeenCalledWith(['/workouts/guided']);
  });
});
