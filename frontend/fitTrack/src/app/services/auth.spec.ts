import { TestBed } from '@angular/core/testing';
import { AuthService } from 'src/app/services/auth';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const apiUrl =
    'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api/Auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call register API', () => {
    const mockData = { email: 'test@test.com', password: '12345678' };

    service.register(mockData).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockData);

    req.flush({ success: true });
  });

  it('should call login API', () => {
    const mockData = { email: 'test@test.com', password: '12345678' };
    const mockResponse = {
      token: 'fake-jwt-token',
      user: {
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
      },
    };

    service.login(mockData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockData);

    req.flush(mockResponse);
  });

  it('should store and clear the session', () => {
    const response = {
      token: 'fake-jwt-token',
      user: {
        id: 1,
        fullName: 'Test User',
        email: 'test@test.com',
        weight: 72,
        language: 'it',
        preferredDifficulty: 'Intermediate',
        preferredMuscleGroup: 'Lower',
        preferredWorkoutMinutes: 30,
        preferredEquipment: 'Bench',
        defaultSets: 4,
        defaultExerciseSeconds: 50,
        defaultRestSeconds: 75,
      },
    };

    service.storeSession(response);

    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(service.getStoredUser()).toEqual(response.user);

    service.clearSession();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should clear the session when stored user data is invalid', () => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('user', '{"id":"bad"}');
    localStorage.setItem('language', 'en');

    expect(service.getStoredUser()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('language')).toBeNull();
  });

  it('should update only the stored user when a valid session exists', () => {
    const response = {
      token: 'fake-jwt-token',
      user: {
        id: 1,
        fullName: 'Test User',
        email: 'test@test.com',
        weight: 72,
        language: 'en',
        preferredDifficulty: 'Intermediate',
        preferredMuscleGroup: 'Lower',
        preferredWorkoutMinutes: 30,
        preferredEquipment: 'Bench',
        defaultSets: 4,
        defaultExerciseSeconds: 50,
        defaultRestSeconds: 75,
      },
    };

    service.storeSession(response);

    service.updateStoredUser({
      ...response.user,
      language: 'it',
      preferredDifficulty: 'Advanced',
    });

    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(service.getStoredUser()).toEqual({
      ...response.user,
      language: 'it',
      preferredDifficulty: 'Advanced',
    });
    expect(localStorage.getItem('language')).toBe('it');
  });
});
