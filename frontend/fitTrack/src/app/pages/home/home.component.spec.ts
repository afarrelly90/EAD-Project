import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { HomeComponent } from './home.component';
import { ExerciseDto } from 'src/app/services/exercise';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let httpMock: HttpTestingController;
  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
    createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
    serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue(''),
    events: {
      subscribe: jasmine.createSpy('subscribe'),
    },
  };
  const apiUrl = 'http://localhost:5240/api/Exercises';
  const mockExercises: ExerciseDto[] = [
    {
      id: 1,
      title: 'Plank',
      description: 'Core hold',
      videoLink: null,
      imageUrl: null,
      calories: 40,
      isCore: true,
      isUpperBody: false,
      isLowerBody: false,
      difficulty: 'Beginner',
      durationMinutes: 5,
      equipment: 'Mat',
      createdAtUtc: '2026-04-15T10:00:00Z',
    },
    {
      id: 2,
      title: 'Push-Ups',
      description: 'Upper body exercise',
      videoLink: null,
      imageUrl: 'https://example.com/push-ups.jpg',
      calories: 80,
      isCore: false,
      isUpperBody: true,
      isLowerBody: false,
      difficulty: 'Intermediate',
      durationMinutes: 10,
      equipment: null,
      createdAtUtc: '2026-04-15T10:00:00Z',
    },
    {
      id: 3,
      title: 'Squats',
      description: 'Leg exercise',
      videoLink: null,
      imageUrl: null,
      calories: 90,
      isCore: false,
      isUpperBody: false,
      isLowerBody: true,
      difficulty: 'Intermediate',
      durationMinutes: 12,
      equipment: 'Dumbbell',
      createdAtUtc: '2026-04-15T10:00:00Z',
    },
    {
      id: 4,
      title: 'Crunches',
      description: 'Abs exercise',
      videoLink: null,
      imageUrl: null,
      calories: 55,
      isCore: true,
      isUpperBody: false,
      isLowerBody: false,
      difficulty: 'Beginner',
      durationMinutes: 8,
      equipment: 'Mat',
      createdAtUtc: '2026-04-15T10:00:00Z',
    },
    {
      id: 5,
      title: 'Burpees',
      description: 'Full body',
      videoLink: null,
      imageUrl: null,
      calories: 110,
      isCore: true,
      isUpperBody: false,
      isLowerBody: false,
      difficulty: 'Advanced',
      durationMinutes: 15,
      equipment: null,
      createdAtUtc: '2026-04-15T10:00:00Z',
    },
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }));

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);

    expect(component).toBeTruthy();
  });

  it('should load exercises and map categories with fallback images', () => {
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockExercises);

    expect(component.isLoading).toBeFalse();
    expect(component.hasError).toBeFalse();
    expect(component.exercises.length).toBe(5);
    expect(component.exercises[0]).toEqual(
      jasmine.objectContaining({
        title: 'Plank',
        category: 'Core',
        filter: 'Core',
        image: 'assets/images/register-fitness.jpg',
      })
    );
    expect(component.exercises[1]).toEqual(
      jasmine.objectContaining({
        title: 'Push-Ups',
        category: 'Upper Body',
        filter: 'Upper',
        image: 'https://example.com/push-ups.jpg',
      })
    );
    expect(component.exercises[2]).toEqual(
      jasmine.objectContaining({
        title: 'Squats',
        category: 'Lower Body',
        filter: 'Lower',
        image: 'assets/images/login-fitness.jpg',
      })
    );
  });

  it('should filter exercises and reset pagination when selecting a filter', () => {
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockExercises);

    component.currentPage = 2;
    component.selectFilter('Upper');

    expect(component.currentPage).toBe(1);
    expect(component.filteredExercises.length).toBe(1);
    expect(component.filteredExercises[0].title).toBe('Push-Ups');
  });

  it('should paginate exercises', () => {
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockExercises);

    expect(component.totalPages).toEqual([1, 2]);
    expect(component.paginatedExercises.map((exercise) => exercise.title)).toEqual([
      'Plank',
      'Push-Ups',
      'Squats',
      'Crunches',
    ]);

    component.goToPage(2);

    expect(component.paginatedExercises.map((exercise) => exercise.title)).toEqual([
      'Burpees',
    ]);
  });

  it('should handle API errors', () => {
    spyOn(console, 'error');

    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(component.isLoading).toBeFalse();
    expect(component.hasError).toBeTrue();
    expect(component.exercises).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
