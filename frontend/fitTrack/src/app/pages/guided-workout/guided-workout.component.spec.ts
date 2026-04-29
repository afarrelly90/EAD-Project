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

  it('should return empty summary items and no current exercise when there is no workout', () => {
    component.workout = null;
    component.currentExerciseIndex = 99;

    expect(component.currentExercise).toBeNull();
    expect(component.completionSummaryItems).toEqual([]);
  });

  it('should expose the ready-state labels before the workout starts', () => {
    expect(component.phaseLabel).toBe('Ready');
    expect(component.statusTitle).toBe('Ready to begin');
    expect(component.statusMessage).toContain('2 exercises');
    expect(component.cueTitle).toBe('Get set');
    expect(component.cueMessage).toContain('start when you feel ready');
    expect(component.timerProgressPercent).toBe(0);
  });

  it('should expose the active exercise phase details after starting', () => {
    component.startWorkout();

    expect(component.phaseTheme).toBe('exercise');
    expect(component.statusTitle).toBe('Exercise 1 of 2, set 1 of 1');
    expect(component.statusMessage).toContain('Crunches is active');
    expect(component.cueMessage).toContain('Keep your form steady');
    expect(component.timerDisplayTime).toBe('0:01');

    component.resetWorkout();
  });

  it('should expose timer state booleans for each phase', () => {
    expect(component.isTimerRunning).toBeFalse();

    component.startWorkout();
    expect(component.isExerciseActive).toBeTrue();
    expect(component.isTimerRunning).toBeTrue();

    component.resetWorkout();
    (component as any).currentPhase = 'rest';
    expect(component.isRestActive).toBeTrue();
    expect(component.isTimerRunning).toBeTrue();

    (component as any).currentPhase = 'complete';
    expect(component.isTimerRunning).toBeFalse();
  });

  it('should start the guided workout timer', () => {
    component.startWorkout();

    expect(component.workoutStarted).toBeTrue();
    expect((component as any).currentPhase).toBe('exercise');
    expect(component.currentExerciseIndex).toBe(0);
    expect(component.currentSet).toBe(1);

    component.resetWorkout();
  });

  it('should repeat the next set of the same exercise before moving on', fakeAsync(() => {
    component.workout = {
      ...generatedWorkout,
      prescribedSets: 2,
      exercises: [generatedWorkout.exercises[0]],
    };

    component.startWorkout();
    tick(1100);

    expect(component.isRestActive).toBeTrue();

    tick(1100);

    expect(component.currentExerciseIndex).toBe(0);
    expect(component.currentSet).toBe(2);
    expect(component.isExerciseActive).toBeTrue();

    component.resetWorkout();
  }));

  it('should reset the current position when a started workout begins again', () => {
    component.workoutStarted = false;
    component.currentExerciseIndex = 1;
    component.currentSet = 4;

    component.startWorkout();

    expect(component.currentExerciseIndex).toBe(0);
    expect(component.currentSet).toBe(1);

    component.resetWorkout();
  });

  it('should ignore start requests when no workout exists or a workout is already running', () => {
    const noWorkoutFixture = TestBed.createComponent(GuidedWorkoutComponent);
    noWorkoutFixture.componentInstance.workout = null;
    noWorkoutFixture.componentInstance.startWorkout();
    expect(noWorkoutFixture.componentInstance.workoutStarted).toBeFalse();

    component.startWorkout();
    component.startWorkout();
    expect(component.currentExerciseIndex).toBe(0);

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

  it('should expose the rest-phase labels between exercises', fakeAsync(() => {
    component.startWorkout();

    tick(1100);

    expect(component.phaseLabel).toBe('Rest');
    expect(component.statusMessage).toContain('Rest for');
    expect(component.cueTitle).toBe('Recover and reset');
    expect(component.timerDisplayTime).toBe('0:01');

    component.resetWorkout();
  }));

  it('should expose the rest cue message and theme between rounds', fakeAsync(() => {
    component.startWorkout();

    tick(1100);

    expect(component.phaseTheme).toBe('rest');
    expect(component.cueMessage).toContain('Use the break to breathe');

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

  it('should expose the completion cue and status copy once finished', fakeAsync(() => {
    component.startWorkout();

    tick(1100);
    tick(1100);
    tick(1100);

    expect(component.phaseTheme).toBe('complete');
    expect(component.statusMessage).toContain('completed all 2 exercises');
    expect(component.cueMessage).toContain('completed the guided session');
  }));

  it('should report full progress once the workout is complete', () => {
    component.workoutComplete = true;

    expect(component.timerProgressPercent).toBe(100);
    expect(component.timerDisplayTime).toBe('0:00');
  });

  it('should expose completion labels and summary items after the workout finishes', fakeAsync(() => {
    component.startWorkout();

    tick(1100);
    tick(1100);
    tick(1100);

    expect(component.phaseLabel).toBe('Complete');
    expect(component.statusTitle).toBe('Workout complete');
    expect(component.cueTitle).toBe('Workout finished');
    expect(component.completionSummaryItems.length).toBe(4);
    expect(component.completionSummaryItems[0].value).toBe('2');
    expect(component.completionSummaryItems[1].value).toBe('2');
    expect(component.completionSummaryItems[2].value).toContain('9');
  }));

  it('should fall back to the ready message when started but between phases', () => {
    component.workoutStarted = true;
    component.workoutComplete = false;
    (component as any).currentPhase = 'idle';

    expect(component.statusMessage).toBe('Press start when you are ready.');
  });

  it('should return no current exercise when the index is outside the workout range', () => {
    component.currentExerciseIndex = 99;

    expect(component.currentExercise).toBeNull();
  });

  it('should ignore phase advancement when there is no workout', () => {
    component.workout = null;
    component.workoutStarted = true;
    (component as any).currentPhase = 'exercise';

    (component as any).advancePhase();

    expect(component.workoutComplete).toBeFalse();
    expect(component.phaseTheme).toBe('exercise');
  });

  it('should reset the workout state', () => {
    component.startWorkout();

    component.resetWorkout();

    expect(component.workoutStarted).toBeFalse();
    expect(component.workoutComplete).toBeFalse();
    expect(component.currentExerciseIndex).toBe(0);
    expect(component.currentSet).toBe(1);
    expect((component as any).currentPhase).toBe('idle');
  });

  it('should navigate back to the builder page', () => {
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/workouts/build']);
  });

  it('should reset the countdown timer on destroy', () => {
    component.startWorkout();

    component.ngOnDestroy();

    expect(component.secondsRemaining).toBe(0);
    expect(component.timerProgressPercent).toBe(0);
  });
});
