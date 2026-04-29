import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { ProfileComponent } from './profile.component';
import { AuthService } from 'src/app/services/auth';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let httpMock: HttpTestingController;

  const apiUrl =
    'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api/Auth';
  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
  };

  const storedUser = {
    id: 1,
    fullName: 'Test User',
    email: 'test@test.com',
    weight: null,
    language: 'en',
    preferredDifficulty: 'Beginner',
    preferredMuscleGroup: 'Core',
    preferredWorkoutMinutes: 20,
    preferredEquipment: null,
    defaultSets: 3,
    defaultExerciseSeconds: 45,
    defaultRestSeconds: 60,
  };

  beforeEach(async () => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', JSON.stringify(storedUser));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const req = httpMock.expectOne(`${apiUrl}/profile/1`);
    req.flush({ ...storedUser });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    mockRouter.navigate.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the stored user information', () => {
    expect(component.user?.email).toBe(storedUser.email);
    expect(component.user?.fullName).toBe(storedUser.fullName);
    expect(component.weightLabel).toBe('Not set');
    expect(component.languageLabel).toBe('English');
  });

  it('should update the profile and persist the new data', () => {
    component.toggleEditing();
    component.profileForm.setValue({
      weight: 75.4,
      language: 'pt',
      preferredDifficulty: 'Advanced',
      preferredMuscleGroup: 'Upper',
      preferredWorkoutMinutes: 35,
      preferredEquipment: 'Dumbbell',
      defaultSets: 4,
      defaultExerciseSeconds: 50,
      defaultRestSeconds: 75,
    });

    component.saveProfile();

    const req = httpMock.expectOne(`${apiUrl}/profile/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      weight: 75.4,
      language: 'pt',
      preferredDifficulty: 'Advanced',
      preferredMuscleGroup: 'Upper',
      preferredWorkoutMinutes: 35,
      preferredEquipment: 'Dumbbell',
      defaultSets: 4,
      defaultExerciseSeconds: 50,
      defaultRestSeconds: 75,
    });
    req.flush({
      id: 1,
      fullName: 'Test User',
      email: 'test@test.com',
      weight: 75.4,
      language: 'it',
      preferredDifficulty: 'Advanced',
      preferredMuscleGroup: 'Upper',
      preferredWorkoutMinutes: 35,
      preferredEquipment: 'Dumbbell',
      defaultSets: 4,
      defaultExerciseSeconds: 50,
      defaultRestSeconds: 75,
    });

    expect(JSON.parse(localStorage.getItem('user') || 'null')).toEqual({
      id: 1,
      fullName: 'Test User',
      email: 'test@test.com',
      weight: 75.4,
      language: 'it',
      preferredDifficulty: 'Advanced',
      preferredMuscleGroup: 'Upper',
      preferredWorkoutMinutes: 35,
      preferredEquipment: 'Dumbbell',
      defaultSets: 4,
      defaultExerciseSeconds: 50,
      defaultRestSeconds: 75,
    });
  });

  it('should logout and clear the session', () => {
    component.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
