import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { EditExerciseComponent } from './edit-exercise.component';
import { ExerciseService } from 'src/app/services/exercise';

describe('EditExerciseComponent', () => {
  let component: EditExerciseComponent;
  let fixture: ComponentFixture<EditExerciseComponent>;
  let httpMock: HttpTestingController;

  const apiUrl =
    'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api/Exercises';
  const exerciseResponse = {
    id: 1,
    title: 'Push-Ups',
    description: 'Upper body exercise',
    videoLink: 'https://example.com/video',
    imageUrl: 'https://example.com/image.jpg',
    calories: 80,
    isCore: false,
    isUpperBody: true,
    isLowerBody: false,
    difficulty: 'Intermediate',
    durationMinutes: 12,
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
      imports: [EditExerciseComponent],
      providers: [
        ExerciseService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '1']]) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditExerciseComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(exerciseResponse);
  });

  afterEach(() => {
    httpMock.verify();
    mockRouter.navigate.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load exercise data into the form', () => {
    expect(component.exercise?.title).toBe(exerciseResponse.title);
    expect(component.selectedMuscleGroup).toBe('Upper');
    expect(component.editExerciseForm.value.title).toBe(exerciseResponse.title);
    expect(component.editExerciseForm.value.equipment).toBe('Dumbbell');
  });

  it('should allow the selected muscle group to be changed manually', () => {
    component.selectMuscleGroup('Lower');

    expect(component.selectedMuscleGroup).toBe('Lower');
  });

  it('should expose the submit state from validity and saving status', () => {
    expect(component.canSubmit).toBeTrue();

    component.isSaving = true;
    expect(component.canSubmit).toBeFalse();

    component.isSaving = false;
    component.editExerciseForm.patchValue({ imageUrl: 'bad-link' });
    expect(component.canSubmit).toBeFalse();
  });

  it('should submit the updated exercise and navigate back to detail', () => {
    component.editExerciseForm.patchValue({
      title: 'Push-Ups Plus',
      calories: 95,
      durationMinutes: 14,
      difficulty: 'Advanced',
    });

    component.onSubmit();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.title).toBe('Push-Ups Plus');
    req.flush({
      id: 1,
      title: 'Push-Ups Plus',
      description: 'Upper body exercise',
      videoLink: 'https://example.com/video',
      imageUrl: 'https://example.com/image.jpg',
      calories: 95,
      isCore: false,
      isUpperBody: true,
      isLowerBody: false,
      difficulty: 'Advanced',
      durationMinutes: 14,
      equipment: 'Dumbbell',
      createdAtUtc: '2026-04-15T10:00:00Z',
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/exercises', 1]);
  });

  it('should block submit when the form is invalid', () => {
    component.editExerciseForm.patchValue({
      imageUrl: 'not-a-url',
    });

    component.onSubmit();

    httpMock.expectNone(`${apiUrl}/1`);
    expect(component.showValidationMessage).toBeTrue();
    expect(component.isSaving).toBeFalse();
  });

  it('should block submit when there is no exercise id even if the form is valid', () => {
    component.exerciseId = 0;

    component.onSubmit();

    httpMock.expectNone(`${apiUrl}/0`);
    expect(component.showValidationMessage).toBeTrue();
  });

  it('should show translated field errors for invalid controls', () => {
    component.editExerciseForm.patchValue({
      title: '',
      imageUrl: 'bad-link',
      calories: 0,
      durationMinutes: 999,
    });

    component.editExerciseForm.get('title')?.markAsTouched();
    component.editExerciseForm.get('imageUrl')?.markAsTouched();
    component.editExerciseForm.get('calories')?.markAsTouched();
    component.editExerciseForm.get('durationMinutes')?.markAsTouched();

    expect(component.getFieldError('title')).toBe('Exercise name is required.');
    expect(component.getFieldError('imageUrl')).toContain('http:// or https://');
    expect(component.getFieldError('calories')).toContain('Calories must be between');
    expect(component.getFieldError('durationMinutes')).toContain('Minutes must be between');
  });

  it('should send null equipment when none is selected', () => {
    component.editExerciseForm.patchValue({
      equipment: 'None',
    });

    component.onSubmit();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.equipment).toBeNull();
    req.flush({
      ...exerciseResponse,
      equipment: null,
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/exercises', 1]);
  });

  it('should map lower, core, and other muscle groups when patching exercise data', () => {
    (component as any).patchForm({
      ...exerciseResponse,
      isUpperBody: false,
      isLowerBody: true,
      isCore: false,
    });
    expect(component.selectedMuscleGroup).toBe('Lower');

    (component as any).patchForm({
      ...exerciseResponse,
      isUpperBody: false,
      isLowerBody: false,
      isCore: true,
    });
    expect(component.selectedMuscleGroup).toBe('Core');

    (component as any).patchForm({
      ...exerciseResponse,
      isUpperBody: false,
      isLowerBody: false,
      isCore: false,
    });
    expect(component.selectedMuscleGroup).toBe('Other');
  });

  it('should show an alert when updating the exercise fails', () => {
    spyOn(window, 'alert');

    component.onSubmit();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(window.alert).toHaveBeenCalledWith('Could not update exercise.');
    expect(component.isSaving).toBeFalse();
  });

  it('should navigate back to the exercise detail page when an id is present', () => {
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/exercises', 1]);
  });

  it('should navigate home when going back without an exercise id', () => {
    component.exerciseId = 0;

    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should expose an error state when the route id is invalid', () => {
    const route = TestBed.inject(ActivatedRoute) as unknown as {
      snapshot: { paramMap: Map<string, string> };
    };
    route.snapshot.paramMap = new Map([['id', '0']]);

    component.ionViewWillEnter();

    httpMock.expectNone(`${apiUrl}/0`);
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });

  it('should expose an error state when loading the exercise fails', () => {
    component.ionViewWillEnter();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush('Error', { status: 404, statusText: 'Not Found' });

    expect(component.exercise).toBeNull();
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });

  it('should return empty errors for untouched or unsupported controls', () => {
    expect(component.getFieldError('videoLink')).toBe('');
    expect(component.getFieldError('difficulty')).toBe('');
  });
});
