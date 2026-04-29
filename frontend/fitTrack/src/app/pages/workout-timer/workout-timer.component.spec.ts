import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { WorkoutTimerComponent } from './workout-timer.component';
import { ExerciseService } from 'src/app/services/exercise';

describe('WorkoutTimerComponent', () => {
  let component: WorkoutTimerComponent;
  let fixture: ComponentFixture<WorkoutTimerComponent>;
  let httpMock: HttpTestingController;
  let routeId = '3';

  const apiUrl =
    'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api/Exercises';
  const exerciseResponse = {
    id: 3,
    title: 'Goblet Squats',
    description: 'Lower-body compound exercise',
    videoLink: 'https://example.com/exercises/goblet-squats',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    calories: 90,
    isCore: false,
    isUpperBody: false,
    isLowerBody: true,
    difficulty: 'Intermediate',
    durationMinutes: 15,
    equipment: 'Dumbbell',
    createdAtUtc: '2026-04-15T10:00:00Z',
  };
  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
  };

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [WorkoutTimerComponent],
      providers: [
        ExerciseService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? routeId : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutTimerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  };

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    mockRouter.navigate.calls.reset();
    TestBed.resetTestingModule();
    routeId = '3';
  });

  it('should create', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    expect(component).toBeTruthy();
  });

  it('should alternate between exercise and rest until all sets are complete', fakeAsync(() => {
    void createComponent();
    flushMicrotasks();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('2');
    component.updateExerciseSeconds('5');
    component.updateRestSeconds('5');

    component.handleTimerAction();
    expect(component.workoutStarted).toBeTrue();
    expect(component.currentSet).toBe(1);
    expect(component.isExerciseActive).toBeTrue();
    expect(component.secondsRemaining).toBe(5);

    tick(5000);

    expect(component.isRestActive).toBeTrue();
    expect(component.secondsRemaining).toBe(5);

    tick(5000);

    expect(component.currentSet).toBe(2);
    expect(component.isExerciseActive).toBeTrue();

    tick(5000);

    expect(component.workoutComplete).toBeTrue();
    expect(component.isTimerRunning).toBeFalse();
  }));

  it('should complete after the exercise timer for a single-set workout', fakeAsync(() => {
    void createComponent();
    flushMicrotasks();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('1');
    component.updateExerciseSeconds('5');

    component.handleTimerAction();

    expect(component.workoutStarted).toBeTrue();
    expect(component.workoutComplete).toBeFalse();
    expect(component.isExerciseActive).toBeTrue();

    tick(5000);

    expect(component.workoutComplete).toBeTrue();
    expect(component.timerButtonLabel).toBe('Workout Complete');
  }));

  it('should reject negative values and keep the existing defaults', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('-4');
    component.updateExerciseSeconds('-20');
    component.updateRestSeconds('-10');

    expect(component.plannedSets).toBe(3);
    expect(component.exerciseSeconds).toBe(45);
    expect(component.restSeconds).toBe(60);
    expect(component.isWorkoutConfigValid).toBeFalse();
  });

  it('should reject oversized values and keep the workout invalid', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('999');
    component.updateExerciseSeconds('999999');
    component.updateRestSeconds('999999');

    expect(component.plannedSets).toBe(3);
    expect(component.exerciseSeconds).toBe(45);
    expect(component.restSeconds).toBe(60);
    expect(component.isWorkoutConfigValid).toBeFalse();
  });

  it('should not begin the workout when setup values are invalid', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('-2');

    component.handleTimerAction();

    expect(component.workoutStarted).toBeFalse();
    expect(component.isWorkoutConfigValid).toBeFalse();
  });

  it('should expose the setup labels before the workout starts', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    expect(component.timerButtonLabel).toBe('Begin Workout');
    expect(component.timerStatusTitle).toBe('Set up your workout');
    expect(component.timerStatusMessage).toBe(
      'Choose your set count, exercise length, and rest time, then start when you are ready.'
    );
    expect(component.timerDisplayTime).toBe('0:45');
    expect(component.countdownLabel).toBe('Exercise target');
    expect(component.phaseLabel).toBe('Ready');
    expect(component.timerProgressPercent).toBe(0);
  });

  it('should expose the exercise phase labels while a set is running', fakeAsync(() => {
    void createComponent();
    flushMicrotasks();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('2');
    component.updateExerciseSeconds('5');
    component.updateRestSeconds('5');
    component.handleTimerAction();

    expect(component.timerButtonLabel).toBe('Exercise in progress');
    expect(component.timerStatusTitle).toBe('Exercise set 1 of 2');
    expect(component.timerStatusMessage).toBe('0:05 left in set 1.');
    expect(component.countdownLabel).toBe('Exercise countdown');
    expect(component.phaseLabel).toBe('Exercise');
  }));

  it('should expose the rest phase labels while resting between sets', fakeAsync(() => {
    void createComponent();
    flushMicrotasks();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('2');
    component.updateExerciseSeconds('5');
    component.updateRestSeconds('5');
    component.handleTimerAction();

    tick(5000);

    expect(component.timerButtonLabel).toBe('Rest in progress');
    expect(component.timerStatusTitle).toBe('Rest before set 2');
    expect(component.timerStatusMessage).toBe('0:05 remaining before the next set.');
    expect(component.countdownLabel).toBe('Rest countdown');
    expect(component.phaseLabel).toBe('Rest');
  }));

  it('should expose the complete phase labels after the workout finishes', fakeAsync(() => {
    void createComponent();
    flushMicrotasks();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('2');
    component.updateExerciseSeconds('5');
    component.updateRestSeconds('5');
    component.handleTimerAction();

    tick(5000);
    tick(5000);
    tick(5000);

    expect(component.timerButtonLabel).toBe('Workout Complete');
    expect(component.timerStatusTitle).toBe('All sets complete');
    expect(component.timerStatusMessage).toBe('You finished 2 sets.');
    expect(component.countdownLabel).toBe('Workout complete');
    expect(component.phaseLabel).toBe('Done');
  }));

  it('should expose the running and current-set defaults when the workout is started but no phase is active', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.workoutStarted = true;
    component.workoutComplete = false;
    component.currentSet = 2;
    component.plannedSets = 4;
    (component as any).currentPhase = 'idle';

    expect(component.timerButtonLabel).toBe('Workout in progress');
    expect(component.timerStatusTitle).toBe('Current set: 2 of 4');
    expect(component.timerStatusMessage).toBe('Workout ready.');
    expect(component.countdownLabel).toBe('Exercise target');
    expect(component.phaseLabel).toBe('Ready');
  });

  it('should update the active exercise timer when reduced during a running set', fakeAsync(() => {
    void createComponent();
    flushMicrotasks();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updatePlannedSets('2');
    component.updateExerciseSeconds('10');
    component.updateRestSeconds('5');
    component.handleTimerAction();

    tick(2000);
    component.updateExerciseSeconds('6');

    expect(component.secondsRemaining).toBeLessThanOrEqual(6);
    expect(component.isExerciseActive).toBeTrue();
    expect(component.timerDisplayTime).toBe('0:06');
  }));

  it('should navigate back to the exercise detail page', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/exercises/3']);
  });

  it('should use the route id when navigating back before the exercise loads', async () => {
    await createComponent();

    component.goBack();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/exercises/3']);
  });

  it('should reset the workout state', fakeAsync(() => {
    void createComponent();
    flushMicrotasks();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.updateExerciseSeconds('5');
    component.handleTimerAction();

    tick(2000);

    component.resetWorkoutTimer();

    expect(component.workoutStarted).toBeFalse();
    expect(component.workoutComplete).toBeFalse();
    expect(component.currentSet).toBe(1);
    expect(component.isTimerRunning).toBeFalse();
  }));

  it('should handle a missing route id without calling the API', async () => {
    routeId = '0';
    await createComponent();

    httpMock.expectNone(`${apiUrl}/3`);
    expect(component.exercise).toBeNull();
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });

  it('should expose the error state when the exercise request fails', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush('Error', { status: 404, statusText: 'Not Found' });

    expect(component.exercise).toBeNull();
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });
});
