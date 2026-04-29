import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';

import { GuidedWorkoutComponent } from './guided-workout.component';
import { WorkoutPlannerService } from 'src/app/services/workout-planner.service';
import { GeneratedWorkoutDto } from 'src/app/services/exercise';

describe('GuidedWorkoutComponent', () => {
  let component: GuidedWorkoutComponent;
  let fixture: ComponentFixture<GuidedWorkoutComponent>;
  let workoutPlannerService: jasmine.SpyObj<WorkoutPlannerService>;
  let router: jasmine.SpyObj<Router>;

  const generatedWorkout: GeneratedWorkoutDto = {
    title: 'Core Circuit',
    difficulty: 'Beginner',
    muscleGroup: 'Core',
    equipment: null,
    targetMinutes: 10,
    totalMinutes: 9,
    totalCalories: 120,
    prescribedSets: 1,
    exerciseSeconds: 1,
    restSeconds: 1,
    exercises: [
      {
        id: 1,
        title: 'Crunches',
        description: null,
        videoLink: null,
        imageUrl: null,
        calories: 30,
        isCore: true,
        isUpperBody: false,
        isLowerBody: false,
        difficulty: 'Beginner',
        durationMinutes: 4,
        equipment: null,
        createdAtUtc: '2026-04-15T10:00:00Z',
      },
      {
        id: 2,
        title: 'Plank',
        description: null,
        videoLink: null,
        imageUrl: null,
        calories: 35,
        isCore: true,
        isUpperBody: false,
        isLowerBody: false,
        difficulty: 'Beginner',
        durationMinutes: 5,
        equipment: null,
        createdAtUtc: '2026-04-15T10:05:00Z',
      },
    ],
  };

  beforeEach(async () => {
    workoutPlannerService = jasmine.createSpyObj<WorkoutPlannerService>(
      'WorkoutPlannerService',
      ['getWorkout', 'setWorkout', 'clearWorkout']
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    workoutPlannerService.getWorkout.and.returnValue(generatedWorkout);

    await TestBed.configureTestingModule({
      imports: [GuidedWorkoutComponent],
      providers: [
        { provide: WorkoutPlannerService, useValue: workoutPlannerService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuidedWorkoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load the stored workout plan', () => {
    expect(component).toBeTruthy();
    expect(component.workout?.title).toBe('Core Circuit');
    expect(component.currentExercise?.title).toBe('Crunches');
    expect(component.hasError).toBeFalse();
  });

  it('should show an error state when there is no generated workout', () => {
    workoutPlannerService.getWorkout.and.returnValue(null);

    const errorFixture = TestBed.createComponent(GuidedWorkoutComponent);
    errorFixture.detectChanges();
    const errorComponent = errorFixture.componentInstance;

    expect(errorComponent.workout).toBeNull();
    expect(errorComponent.hasError).toBeTrue();
  });

  it('should start the guided workout timer', () => {
    component.startWorkout();

    expect(component.workoutStarted).toBeTrue();
    expect((component as any).currentPhase).toBe('exercise');
    expect(component.currentExerciseIndex).toBe(0);
    expect(component.currentSet).toBe(1);

    component.resetWorkout();
  });

  it('should advance from rest to the next exercise', fakeAsync(() => {
    component.startWorkout();

    tick(1100);
    expect((component as any).currentPhase).toBe('rest');

    tick(1100);
    expect((component as any).currentPhase).toBe('exercise');
    expect(component.currentExerciseIndex).toBe(1);
    expect(component.currentSet).toBe(1);

    component.resetWorkout();
  }));

  it('should complete the guided workout after the final exercise', fakeAsync(() => {
    component.startWorkout();

    tick(1100);
    tick(1100);
    tick(1100);

    expect(component.workoutComplete).toBeTrue();
    expect((component as any).currentPhase).toBe('complete');
    expect(component.timerDisplayTime).toBe('0:00');
  }));

  it('should reset the workout state', () => {
    component.startWorkout();

    component.resetWorkout();

    expect(component.workoutStarted).toBeFalse();
    expect(component.workoutComplete).toBeFalse();
    expect(component.currentExerciseIndex).toBe(0);
    expect(component.currentSet).toBe(1);
    expect((component as any).currentPhase).toBe('idle');
  });
});
