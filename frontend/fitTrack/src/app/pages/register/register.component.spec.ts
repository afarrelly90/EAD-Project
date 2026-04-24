import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from 'src/app/services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;

  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.value.language).toBe('en');
  });

  it('should not submit if form is invalid', () => {
    spyOn(component['authService'], 'register');
    component.onSubmit();
    expect(component['authService'].register).not.toHaveBeenCalled();
  });

  it('should call register API and navigate on success', () => {
    const formData = {
      fullName: 'Marco',
      email: 'test@test.com',
      password: '123456',
      language: 'en',
    };

    component.registerForm.setValue(formData);

    component.onSubmit();

    const req = httpMock.expectOne(
      'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api/Auth/register'
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(formData);

    req.flush({});

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle API error', () => {
    spyOn(window, 'alert');

    const formData = {
      fullName: 'Marco',
      email: 'test@test.com',
      password: '123456',
      language: 'en',
    };

    component.registerForm.setValue(formData);

    component.onSubmit();

    const req = httpMock.expectOne(
      'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api/Auth/register'
    );
    req.flush('Error', { status: 400, statusText: 'Bad Request' });

    expect(window.alert).toHaveBeenCalled();
  });
});
