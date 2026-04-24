import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutTimerComponent],
      providers: [
        ExerciseService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', '3']]) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutTimerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);
  });

  afterEach(() => {
    httpMock.verify();
    mockRouter.navigate.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should alternate between exercise and rest until all sets are complete', fakeAsync(() => {
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

  it('should clamp negative values to the minimum allowed values', () => {
    component.updatePlannedSets('-4');
    component.updateExerciseSeconds('-20');
    component.updateRestSeconds('-10');

    expect(component.plannedSets).toBe(3);
    expect(component.exerciseSeconds).toBe(45);
    expect(component.restSeconds).toBe(60);
    expect(component.isWorkoutConfigValid).toBeFalse();
  });

  it('should reject oversized values and keep the workout invalid', () => {
    component.updatePlannedSets('999');
    component.updateExerciseSeconds('999999');
    component.updateRestSeconds('999999');

    expect(component.plannedSets).toBe(3);
    expect(component.exerciseSeconds).toBe(45);
    expect(component.restSeconds).toBe(60);
    expect(component.isWorkoutConfigValid).toBeFalse();
  });

  it('should not begin the workout when setup values are invalid', () => {
    component.updatePlannedSets('-2');

    component.handleTimerAction();

    expect(component.workoutStarted).toBeFalse();
    expect(component.isWorkoutConfigValid).toBeFalse();
  });

  it('should navigate back to the exercise detail page', () => {
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/exercises/3']);
  });

  it('should reset the workout state', fakeAsync(() => {
    component.updateExerciseSeconds('5');
    component.handleTimerAction();

    tick(2000);

    component.resetWorkoutTimer();

    expect(component.workoutStarted).toBeFalse();
    expect(component.workoutComplete).toBeFalse();
    expect(component.currentSet).toBe(1);
    expect(component.isTimerRunning).toBeFalse();
  }));
});
