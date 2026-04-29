import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { ExerciseDetailComponent } from './exercise-detail.component';
import { ExerciseDto, ExerciseService } from 'src/app/services/exercise';
import { FavoritesService } from 'src/app/services/favorites.service';

describe('ExerciseDetailComponent', () => {
  let component: ExerciseDetailComponent;
  let fixture: ComponentFixture<ExerciseDetailComponent>;
  let httpMock: HttpTestingController;

  const apiUrl =
    'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api/Exercises';
  const exerciseResponse: ExerciseDto = {
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
        FavoritesService,
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
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the exercise and expose the edit url', () => {
    expect(component.exercise?.title).toBe(exerciseResponse.title);
    expect(component.editExerciseUrl).toBe('/exercises/3/edit');
    expect(component.workoutUrl).toBe('/exercises/3/workout');
    expect(component.isFavorite).toBeFalse();
  });

  it('should toggle the favorite state for the loaded exercise', () => {
    component.toggleFavorite();

    expect(component.isFavorite).toBeTrue();
    expect(JSON.parse(localStorage.getItem('favorite-exercise-ids') || '[]')).toEqual([3]);

    component.toggleFavorite();

    expect(component.isFavorite).toBeFalse();
    expect(JSON.parse(localStorage.getItem('favorite-exercise-ids') || '[]')).toEqual([]);
  });

  it('should expose the translated labels and fallback assets for the loaded exercise', () => {
    expect(component.heroImage).toBe(exerciseResponse.imageUrl as string);
    expect(component.categoryKey).toBe('exercise.muscle_groups.lower');
    expect(component.categoryLabel).toBe('Lower Body');
    expect(component.equipmentLabel).toBe('Dumbbell');
    expect(component.difficultyKey).toBe('exercise.difficulty_options.intermediate');
    expect(component.favoriteButtonLabel).toBe('Add to favorites');
  });

  it('should fall back to category imagery and none-equipment text when exercise media is missing', () => {
    component.exercise = {
      ...exerciseResponse,
      imageUrl: null,
      equipment: null,
      isLowerBody: false,
      isCore: true,
    };

    expect(component.heroImage).toBe('assets/images/register-fitness.jpg');
    expect(component.fallbackImageByCategory).toBe('assets/images/register-fitness.jpg');
    expect(component.categoryKey).toBe('exercise.muscle_groups.core');
    expect(component.equipmentLabel).toBe('None');
  });

  it('should fall back to the raw equipment value when no translation exists', () => {
    component.exercise = {
      ...exerciseResponse,
      equipment: 'Sandbag',
    };

    expect(component.equipmentLabel).toBe('Sandbag');
  });

  it('should return safe defaults when no exercise is loaded', () => {
    component.exercise = null;

    expect(component.heroImage).toBe('assets/images/register-fitness.jpg');
    expect(component.categoryKey).toBe('');
    expect(component.categoryLabel).toBe('');
    expect(component.editExerciseUrl).toBe('/home');
    expect(component.workoutUrl).toBe('/home');
  });

  it('should navigate home when goBack is called', () => {
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should do nothing when trying to edit or favorite without a loaded exercise', () => {
    component.exercise = null;
    const originalHref = window.location.href;

    component.editExercise();
    component.toggleFavorite();

    expect(component.isFavorite).toBeFalse();
    expect(window.location.href).toBe(originalHref);
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

  it('should stay on the page when delete fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');

    component.deleteExercise();

    const deleteReq = httpMock.expectOne(`${apiUrl}/3`);
    deleteReq.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(window.alert).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/home']);
  });

  it('should show an error state when the route id is invalid', async () => {
    const route = TestBed.inject(ActivatedRoute) as unknown as {
      snapshot: { paramMap: Map<string, string> };
    };
    route.snapshot.paramMap = new Map([['id', '0']]);

    component.ionViewWillEnter();

    httpMock.expectNone(`${apiUrl}/0`);
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });
});
