import { TestBed } from '@angular/core/testing';
import { AuthService } from 'src/app/services/auth';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:5240/api/Auth';

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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call register API', () => {
    const mockData = { email: 'test@test.com', password: '123456' };

    service.register(mockData).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockData);

    req.flush({ success: true });
  });

  it('should call login API', () => {
    const mockData = { email: 'test@test.com', password: '123456' };
    const mockResponse = { token: 'fake-jwt-token' };

    service.login(mockData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockData);

    req.flush(mockResponse);
  });
});