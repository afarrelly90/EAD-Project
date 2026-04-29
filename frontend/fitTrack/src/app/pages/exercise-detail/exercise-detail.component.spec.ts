import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { ExerciseDetailComponent } from './exercise-detail.component';
import { ExerciseDto, ExerciseService } from 'src/app/services/exercise';

describe('ExerciseDetailComponent', () => {
  let component: ExerciseDetailComponent;
  let fixture: ComponentFixture<ExerciseDetailComponent>;
  let httpMock: HttpTestingController;
  let routeId = '3';

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

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [ExerciseDetailComponent],
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

    fixture = TestBed.createComponent(ExerciseDetailComponent);
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

  it('should load the exercise and expose the edit and workout urls', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    expect(component.exercise).toEqual(exerciseResponse);
    expect(component.isLoading).toBeFalse();
    expect(component.hasError).toBeFalse();
    expect(component.editExerciseUrl).toBe('/exercises/3/edit');
    expect(component.workoutUrl).toBe('/exercises/3/workout');
  });

  it('should derive translated labels and hero image from the loaded exercise', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    expect(component.heroImage).toBe(exerciseResponse.imageUrl as string);
    expect(component.categoryKey).toBe('exercise.muscle_groups.lower');
    expect(component.categoryLabel).toBe('Lower Body');
    expect(component.equipmentLabel).toBe('Dumbbell');
    expect(component.difficultyKey).toBe('exercise.difficulty_options.intermediate');
    expect(component.fallbackImageByCategory).toBe(component.fallbackImages.lower);
  });

  it('should fall back to translated defaults when equipment and image are missing', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush({
      ...exerciseResponse,
      imageUrl: null,
      equipment: null,
      isLowerBody: false,
      isCore: true,
    });

    expect(component.heroImage).toBe(component.fallbackImages.core);
    expect(component.categoryKey).toBe('exercise.muscle_groups.core');
    expect(component.categoryLabel).toBe('Core');
    expect(component.equipmentLabel).toBe('None');
  });

  it('should use the general category and other fallback image when no category flags are set', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush({
      ...exerciseResponse,
      imageUrl: null,
      isCore: false,
      isUpperBody: false,
      isLowerBody: false,
    });

    expect(component.categoryKey).toBe('exercise.muscle_groups.general');
    expect(component.categoryLabel).toBe('General Fitness');
    expect(component.heroImage).toBe(component.fallbackImages.other);
  });

  it('should preserve unknown equipment labels when no translation key exists', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush({
      ...exerciseResponse,
      equipment: 'Suspension Trainer',
    });

    expect(component.equipmentLabel).toBe('Suspension Trainer');
  });

  it('should navigate home when goBack is called', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should delete the exercise and navigate home', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteExercise();

    const deleteReq = httpMock.expectOne(`${apiUrl}/3`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null, { status: 204, statusText: 'No Content' });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should not delete when the confirmation is cancelled', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteExercise();

    httpMock.expectNone(`${apiUrl}/3`);
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/home']);
  });

  it('should show an alert when delete fails', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush(exerciseResponse);

    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');

    component.deleteExercise();

    const deleteReq = httpMock.expectOne(`${apiUrl}/3`);
    deleteReq.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(window.alert).toHaveBeenCalledWith('Could not delete exercise.');
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/home']);
  });

  it('should handle a missing route id without calling the API', async () => {
    routeId = '0';
    await createComponent();

    httpMock.expectNone(`${apiUrl}/3`);
    expect(component.exercise).toBeNull();
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(component.editExerciseUrl).toBe('/home');
    expect(component.workoutUrl).toBe('/home');
  });

  it('should handle load failures and expose the error state', async () => {
    await createComponent();

    const req = httpMock.expectOne(`${apiUrl}/3`);
    req.flush('Error', { status: 404, statusText: 'Not Found' });

    expect(component.exercise).toBeNull();
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(component.heroImage).toBe(component.fallbackImages.other);
    expect(component.categoryKey).toBe('');
    expect(component.categoryLabel).toBe('');
    expect(component.equipmentLabel).toBe('None');
    expect(component.difficultyKey).toBe('');
  });

  it('should reload the exercise when the view re-enters', async () => {
    await createComponent();

    const initialReq = httpMock.expectOne(`${apiUrl}/3`);
    initialReq.flush(exerciseResponse);

    component.ionViewWillEnter();

    const reloadReq = httpMock.expectOne(`${apiUrl}/3`);
    reloadReq.flush({
      ...exerciseResponse,
      title: 'Updated Goblet Squats',
    });

    expect(component.exercise?.title).toBe('Updated Goblet Squats');
    expect(component.hasError).toBeFalse();
    expect(component.isLoading).toBeFalse();
  });
});
