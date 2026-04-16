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

  const apiUrl = 'http://localhost:5240/api/Exercises';
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
});
