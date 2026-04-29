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
    expect(component.preferredDifficultyLabel).toBe('Beginner');
    expect(component.preferredMuscleGroupLabel).toBe('Core');
    expect(component.preferredEquipmentLabel).toBe('None');
    expect(component.timerPresetLabel).toContain('3');
  });

  it('should expose label fallbacks for missing preferences and raw equipment names', () => {
    component.user = {
      ...storedUser,
      weight: 82,
      language: '',
      preferredDifficulty: '',
      preferredMuscleGroup: '',
      preferredEquipment: 'Sandbag',
    };

    expect(component.weightLabel).toBe('82 kg');
    expect(component.languageLabel).toBe('English');
    expect(component.preferredDifficultyLabel).toBe('Beginner');
    expect(component.preferredMuscleGroupLabel).toBe('Core');
    expect(component.preferredEquipmentLabel).toBe('Sandbag');

    component.user = null;
    expect(component.timerPresetLabel).toBe('');
  });

  it('should update the profile and persist the new data', () => {
    component.toggleEditing();
    component.profileForm.setValue({
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

    component.saveProfile();

    const req = httpMock.expectOne(`${apiUrl}/profile/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
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

  it('should reset the form values when editing is cancelled', () => {
    component.toggleEditing();
    component.profileForm.patchValue({
      weight: 85,
      preferredDifficulty: 'Advanced',
    });

    component.toggleEditing();

    expect(component.isEditing).toBeFalse();
    expect(component.profileForm.value.weight).toBeNull();
    expect(component.profileForm.value.preferredDifficulty).toBe('Beginner');
  });

  it('should ignore editing toggles when there is no user', () => {
    component.user = null;
    component.showValidationMessage = true;

    component.toggleEditing();

    expect(component.isEditing).toBeFalse();
    expect(component.showValidationMessage).toBeTrue();
  });

  it('should block saving when the profile form is invalid', () => {
    component.toggleEditing();
    component.profileForm.patchValue({
      weight: 7000,
    });

    component.saveProfile();

    httpMock.expectNone(`${apiUrl}/profile/1`);
    expect(component.showValidationMessage).toBeTrue();
    expect(component.isSaving).toBeFalse();
  });

  it('should expose the save button state from validity and saving status', () => {
    expect(component.canSaveProfile).toBeTrue();

    component.isSaving = true;
    expect(component.canSaveProfile).toBeFalse();

    component.isSaving = false;
    component.profileForm.patchValue({ preferredWorkoutMinutes: 999 });
    expect(component.canSaveProfile).toBeFalse();
  });

  it('should map a cleared weight and no equipment to null when saving', () => {
    component.toggleEditing();
    component.profileForm.patchValue({
      weight: '',
      language: 'en',
      preferredDifficulty: 'Beginner',
      preferredMuscleGroup: 'Core',
      preferredWorkoutMinutes: 25,
      preferredEquipment: 'None',
      defaultSets: 3,
      defaultExerciseSeconds: 45,
      defaultRestSeconds: 60,
    });

    component.saveProfile();

    const req = httpMock.expectOne(`${apiUrl}/profile/1`);
    expect(req.request.body.weight).toBeNull();
    expect(req.request.body.preferredEquipment).toBeNull();
    req.flush({
      ...storedUser,
      preferredWorkoutMinutes: 25,
    });
  });

  it('should show a translated error when updating the profile fails', () => {
    spyOn(window, 'alert');
    component.toggleEditing();
    component.profileForm.patchValue({
      weight: 75,
      preferredWorkoutMinutes: 30,
    });

    component.saveProfile();

    const req = httpMock.expectOne(`${apiUrl}/profile/1`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(window.alert).toHaveBeenCalledWith('Could not update your profile.');
    expect(component.isSaving).toBeFalse();
    expect(component.isEditing).toBeTrue();
  });

  it('should navigate back home', () => {
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should redirect to login when there is no stored user', async () => {
    localStorage.clear();
    mockRouter.navigate.calls.reset();

    const redirectedFixture = TestBed.createComponent(ProfileComponent);
    redirectedFixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should fall back to the stored user when the profile request fails', async () => {
    localStorage.clear();
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        ...storedUser,
        preferredDifficulty: 'Advanced',
      })
    );

    const fallbackFixture = TestBed.createComponent(ProfileComponent);
    const fallbackComponent = fallbackFixture.componentInstance;
    fallbackFixture.detectChanges();

    const req = httpMock.expectOne(`${apiUrl}/profile/1`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(fallbackComponent.user?.preferredDifficulty).toBe('Advanced');
    expect(fallbackComponent.isLoading).toBeFalse();
    expect(fallbackComponent.hasError).toBeFalse();
  });

  it('should expose validation messages for the numeric profile fields', () => {
    component.toggleEditing();
    component.profileForm.patchValue({
      preferredWorkoutMinutes: 999,
      defaultSets: 0,
      defaultExerciseSeconds: 1,
      defaultRestSeconds: 1,
    });

    component.profileForm.get('preferredWorkoutMinutes')?.markAsTouched();
    component.profileForm.get('defaultSets')?.markAsTouched();
    component.profileForm.get('defaultExerciseSeconds')?.markAsTouched();
    component.profileForm.get('defaultRestSeconds')?.markAsTouched();

    expect(component.getFieldError('preferredWorkoutMinutes')).toContain('Workout length');
    expect(component.getFieldError('defaultSets')).toContain('Default sets');
    expect(component.getFieldError('defaultExerciseSeconds')).toContain('Exercise seconds');
    expect(component.getFieldError('defaultRestSeconds')).toContain('Rest seconds');
  });

  it('should expose weight validation and return empty errors for untouched controls', () => {
    component.toggleEditing();
    component.profileForm.patchValue({
      weight: 5,
    });

    component.profileForm.get('weight')?.markAsTouched();

    expect(component.getFieldError('weight')).toContain('Weight must be between');
    expect(component.getFieldError('language')).toBe('');
  });

  it('should compute initials from the full name and fall back to email when needed', () => {
    expect(component.initials).toBe('TU');

    component.user = {
      ...storedUser,
      fullName: '',
      email: 'solo@example.com',
    };

    expect(component.initials).toBe('S');
  });

  it('should return the default initial when there is no name or email', () => {
    component.user = {
      ...storedUser,
      fullName: '',
      email: '',
    };

    expect(component.initials).toBe('U');
  });

  it('should reload the profile when the view re-enters', () => {
    component.ionViewWillEnter();

    const req = httpMock.expectOne(`${apiUrl}/profile/1`);
    req.flush({
      ...storedUser,
      weight: 90,
    });

    expect(component.user?.weight).toBe(90);
    expect(component.weightLabel).toBe('90 kg');
  });

  it('should logout and clear the session', () => {
    component.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
