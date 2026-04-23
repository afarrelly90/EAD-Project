import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { ExerciseDetailComponent } from './exercise-detail.component';
import { ExerciseService } from 'src/app/services/exercise';

describe('ExerciseDetailComponent', () => {
  let component: ExerciseDetailComponent;
  let fixture: ComponentFixture<ExerciseDetailComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:5240/api/Exercises';
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
    createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
    serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue(''),
    events: {
      subscribe: jasmine.createSpy('subscribe'),
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseDetailComponent],
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

    fixture = TestBed.createComponent(ExerciseDetailComponent);
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

  it('should load the exercise and expose the edit url', () => {
    expect(component.exercise?.title).toBe(exerciseResponse.title);
    expect(component.editExerciseUrl).toBe('/exercises/3/edit');
    expect(component.workoutUrl).toBe('/exercises/3/workout');
  });

  it('should delete the exercise and navigate home', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteExercise();

    const deleteReq = httpMock.expectOne(`${apiUrl}/3`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null, { status: 204, statusText: 'No Content' });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should not delete when the confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteExercise();

    httpMock.expectNone(`${apiUrl}/3`);
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/home']);
  });

});
