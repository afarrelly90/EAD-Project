import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { CreateExerciseComponent } from './create-exercise.component';
import { ExerciseService } from 'src/app/services/exercise';

describe('CreateExerciseComponent', () => {
  let component: CreateExerciseComponent;
  let fixture: ComponentFixture<CreateExerciseComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:5240/api/Exercises';
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
      imports: [CreateExerciseComponent],
      providers: [
        ExerciseService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateExerciseComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    mockRouter.navigate.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.createExerciseForm).toBeDefined();
    expect(component.createExerciseForm.value.equipment).toBe('None');
    expect(component.createExerciseForm.value.calories).toBe(50);
    expect(component.createExerciseForm.value.durationMinutes).toBe(10);
    expect(component.createExerciseForm.value.difficulty).toBe('Beginner');
    expect(component.selectedMuscleGroup).toBe('Core');
  });

  it('should change the selected muscle group', () => {
    component.selectMuscleGroup('Upper');

    expect(component.selectedMuscleGroup).toBe('Upper');
  });

  it('should navigate back to home', () => {
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should show validation message and not submit when form is invalid', () => {
    component.createExerciseForm.patchValue({ title: '' });

    component.onSubmit();

    expect(component.showValidationMessage).toBeTrue();
    expect(component.createExerciseForm.controls.title.touched).toBeTrue();
  });

  it('should submit the exercise and navigate on success', () => {
    component.selectMuscleGroup('Upper');
    component.createExerciseForm.patchValue({
      imageUrl: ' https://example.com/image.jpg ',
      videoLink: ' https://example.com/video ',
      title: ' Push-Ups ',
      description: ' Upper body exercise ',
      equipment: 'Dumbbell',
      calories: 80,
      durationMinutes: 12,
      difficulty: 'Intermediate',
    });

    component.onSubmit();

    expect(component.isSaving).toBeTrue();
    expect(component.showValidationMessage).toBeFalse();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
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
    });

    req.flush({
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
    });

    expect(component.isSaving).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should send null equipment when None is selected', () => {
    component.selectMuscleGroup('Core');
    component.createExerciseForm.patchValue({
      title: 'Plank',
      description: 'Core hold',
      equipment: 'None',
      calories: 40,
      durationMinutes: 5,
      difficulty: 'Beginner',
    });

    component.onSubmit();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.equipment).toBeNull();
    expect(req.request.body.isCore).toBeTrue();
    expect(req.request.body.isUpperBody).toBeFalse();
    expect(req.request.body.isLowerBody).toBeFalse();

    req.flush({
      id: 2,
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
      equipment: null,
      createdAtUtc: '2026-04-15T10:00:00Z',
    });
  });

  it('should submit all muscle booleans as false when Other is selected', () => {
    component.selectMuscleGroup('Other');
    component.createExerciseForm.patchValue({
      title: 'Mobility Flow',
      calories: 30,
      durationMinutes: 7,
      difficulty: 'Beginner',
    });

    component.onSubmit();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.body.isCore).toBeFalse();
    expect(req.request.body.isUpperBody).toBeFalse();
    expect(req.request.body.isLowerBody).toBeFalse();

    req.flush({
      id: 3,
      title: 'Mobility Flow',
      description: null,
      videoLink: null,
      imageUrl: null,
      calories: 30,
      isCore: false,
      isUpperBody: false,
      isLowerBody: false,
      difficulty: 'Beginner',
      durationMinutes: 7,
      equipment: null,
      createdAtUtc: '2026-04-15T10:00:00Z',
    });
  });

  it('should handle API errors', () => {
    spyOn(window, 'alert');
    spyOn(console, 'error');

    component.createExerciseForm.patchValue({
      title: 'Crunches',
      calories: 55,
      durationMinutes: 9,
      difficulty: 'Beginner',
    });

    component.onSubmit();

    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(component.isSaving).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith('Could not save exercise.');
    expect(console.error).toHaveBeenCalled();
  });
});
