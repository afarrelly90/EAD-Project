import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from 'src/app/services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;

  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
    createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
    serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue(''),
    events: {
      subscribe: jasmine.createSpy('subscribe')
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.loginForm).toBeDefined();
  });

  it('should not submit if form is invalid', () => {
    spyOn(component['authService'], 'login');
    component.onSubmit();
    expect(component['authService'].login).not.toHaveBeenCalled();
  });

  it('should call login API and store token + navigate on success', () => {
    const formData = {
      email: 'test@test.com',
      password: '123456'
    };

    const mockResponse = { token: 'fake-jwt-token' };

    component.loginForm.setValue(formData);

    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:5240/api/Auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(formData);

    req.flush(mockResponse);

    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should handle API error', () => {
    spyOn(window, 'alert');

    const formData = {
      email: 'test@test.com',
      password: 'wrong'
    };

    component.loginForm.setValue(formData);

    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:5240/api/Auth/login');
    req.flush('Error', { status: 401, statusText: 'Unauthorized' });

    expect(window.alert).toHaveBeenCalledWith('Invalid credentials');
  });
});
