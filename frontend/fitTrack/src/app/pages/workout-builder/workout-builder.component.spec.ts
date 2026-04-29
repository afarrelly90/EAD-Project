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

  it('should expose the generate button state from the current loading and form state', () => {
    expect(component.canGenerateWorkout).toBeTrue();

    component.isGenerating = true;
    expect(component.canGenerateWorkout).toBeFalse();

    component.isGenerating = false;
    component.builderForm.patchValue({ targetMinutes: 999 });
    expect(component.canGenerateWorkout).toBeFalse();
  });

  it('should disable workout generation while still loading or without a user', () => {
    component.isLoadingProfile = true;
    expect(component.canGenerateWorkout).toBeFalse();

    component.isLoadingProfile = false;
    component.user = null;
    expect(component.canGenerateWorkout).toBeFalse();
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

  it('should apply the saved preferences again on demand', () => {
    component.builderForm.patchValue({
      difficulty: 'Beginner',
      muscleGroup: 'Core',
      equipment: 'None',
      targetMinutes: 10,
    });

    component.applySavedPreferences();

    expect(component.builderForm.value.difficulty).toBe('Intermediate');
    expect(component.builderForm.value.muscleGroup).toBe('Upper');
    expect(component.builderForm.value.equipment).toBe('Bench');
    expect(component.builderForm.value.targetMinutes).toBe(30);
  });

  it('should ignore saved preference application when there is no user', () => {
    component.user = null;
    component.builderForm.patchValue({
      difficulty: 'Advanced',
    });

    component.applySavedPreferences();

    expect(component.builderForm.value.difficulty).toBe('Advanced');
  });

  it('should block workout generation when the form is invalid', () => {
    component.builderForm.patchValue({
      targetMinutes: 999,
    });

    component.generateWorkout();

    expect(component.showValidationMessage).toBeTrue();
    expect(exerciseService.generateWorkout).not.toHaveBeenCalled();
  });

  it('should expose translated field errors for invalid builder controls', () => {
    component.builderForm.patchValue({
      targetMinutes: 999,
      maxExercises: 0,
    });

    component.builderForm.get('targetMinutes')?.markAsTouched();
    component.builderForm.get('maxExercises')?.markAsTouched();

    expect(component.getFieldError('targetMinutes')).toContain('between 5 and 180');
    expect(component.getFieldError('maxExercises')).toContain('between 1 and 8');
  });

  it('should return empty builder errors for untouched or unsupported controls', () => {
    expect(component.getFieldError('difficulty')).toBe('');
    expect(component.getFieldError('equipment')).toBe('');
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

  it('should expose a preset summary for the generated workout', () => {
    component.generatedWorkout = generatedWorkout;

    expect(component.presetSummary).toContain('4');
    expect(component.presetSummary).toContain('50');
    expect(component.presetSummary).toContain('70');
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

  it('should fall back through the available error message shapes', () => {
    exerciseService.generateWorkout.and.returnValue(
      throwError(() => ({
        error: { title: 'Generation failed.' },
      }))
    );

    component.generateWorkout();

    expect(component.errorMessage).toBe('Generation failed.');

    exerciseService.generateWorkout.and.returnValue(
      throwError(() => ({
        message: 'Unexpected failure.',
      }))
    );

    component.generateWorkout();

    expect(component.errorMessage).toBe('Unexpected failure.');
  });

  it('should fall back to an empty error message when no known error shape exists', () => {
    exerciseService.generateWorkout.and.returnValue(
      throwError(() => ({}))
    );

    component.generateWorkout();

    expect(component.errorMessage).toBe('');
    expect(component.hasError).toBeTrue();
  });

  it('should clear the generated workout and planner state', () => {
    component.generatedWorkout = generatedWorkout;

    component.clearWorkout();

    expect(component.generatedWorkout).toBeNull();
    expect(workoutPlannerService.clearWorkout).toHaveBeenCalled();
  });

  it('should navigate to the guided workout when a generated plan exists', () => {
    component.generatedWorkout = generatedWorkout;

    component.startGuidedWorkout();

    expect(router.navigate).toHaveBeenCalledWith(['/workouts/guided']);
  });

  it('should not navigate to the guided workout when no plan exists', () => {
    component.generatedWorkout = null;

    component.startGuidedWorkout();

    expect(router.navigate).not.toHaveBeenCalledWith(['/workouts/guided']);
  });

  it('should translate equipment labels and fall back to raw values when needed', () => {
    expect(component.translateEquipment(null)).toBe('None');
    expect(component.translateEquipment('Resistance Band')).toBe('Resistance Band');
    expect(component.translateEquipment('Sandbag')).toBe('Sandbag');
  });

  it('should expose an empty preset summary when no workout is generated', () => {
    component.generatedWorkout = null;

    expect(component.presetSummary).toBe('');
  });

  it('should track exercises by id and navigate back home', () => {
    expect(component.trackByExerciseId(0, generatedWorkout.exercises[0])).toBe(1);

    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should keep the stored user when loading the latest profile fails', () => {
    authService.getProfile.and.returnValue(throwError(() => new Error('Profile request failed')));

    const fallbackFixture = TestBed.createComponent(WorkoutBuilderComponent);
    const fallbackComponent = fallbackFixture.componentInstance;
    fallbackFixture.detectChanges();

    expect(fallbackComponent.user).toEqual(storedUser);
    expect(fallbackComponent.isLoadingProfile).toBeFalse();
    expect(fallbackComponent.builderForm.value.difficulty).toBe('Intermediate');
  });
});
