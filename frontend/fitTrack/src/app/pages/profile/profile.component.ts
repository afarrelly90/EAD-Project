import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  closeOutline,
  createOutline,
  logOutOutline,
  personCircleOutline,
  saveOutline,
} from 'ionicons/icons';
import {
  AuthService,
  AuthUserProfile,
  UpdateProfileDto,
} from 'src/app/services/auth';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { I18nService } from 'src/app/services/i18n.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
  ],
})
export class ProfileComponent implements OnInit {
  user: AuthUserProfile | null = null;
  profileForm!: FormGroup;
  isLoading = true;
  hasError = false;
  isEditing = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private i18nService: I18nService
  ) {
    addIcons({
      chevronBackOutline,
      closeOutline,
      createOutline,
      logOutOutline,
      personCircleOutline,
      saveOutline,
    });
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      weight: [null, [Validators.min(0)]],
      language: ['en', [Validators.required]],
    });

    this.loadProfile();
  }

  ionViewWillEnter(): void {
    this.loadProfile();
  }

  get initials(): string {
    const source = this.user?.fullName?.trim() || this.user?.email || '';

    if (!source) {
      return 'U';
    }

    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  get weightLabel(): string {
    if (this.user?.weight === null || this.user?.weight === undefined) {
      return this.i18nService.translate('common.not_set');
    }

    return `${this.user.weight} ${this.i18nService.translate('common.kg')}`;
  }

  get languageLabel(): string {
    const language = this.user?.language || 'en';
    return this.i18nService.translate(`profile.language_options.${language}`);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  toggleEditing(): void {
    if (!this.user) {
      return;
    }

    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      this.profileForm.patchValue({
        weight: this.user.weight,
        language: this.user.language || 'en',
      });
      return;
    }

    this.resetFormFromUser();
  }

  saveProfile(): void {
    if (!this.user || this.profileForm.invalid) {
      return;
    }

    const rawWeight = this.profileForm.value.weight;
    const parsedWeight = rawWeight === null || rawWeight === '' ? null : Number(rawWeight);
    const payload: UpdateProfileDto = {
      weight: Number.isNaN(parsedWeight) ? null : parsedWeight,
      language: this.profileForm.value.language || 'en',
    };

    this.isSaving = true;
    this.authService.updateProfile(this.user.id, payload).subscribe({
      next: (updatedProfile) => {
        this.user = updatedProfile;
        this.authService.storeSession({
          token: localStorage.getItem('token') || '',
          user: updatedProfile,
        });
        this.i18nService.setLanguage(updatedProfile.language || 'en');
        this.isEditing = false;
        this.isSaving = false;
        this.resetFormFromUser();
      },
      error: (error) => {
        console.error(error);
        this.isSaving = false;
        window.alert(this.i18nService.translate('profile.update_error'));
      },
    });
  }

  logout(): void {
    this.authService.clearSession();
    this.router.navigate(['/login']);
  }

  private loadProfile(): void {
    const storedUser = this.authService.getStoredUser();

    if (!storedUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.authService.getProfile(storedUser.id).subscribe({
      next: (profile) => {
        this.user = profile;
        this.i18nService.setLanguage(profile.language || 'en');
        this.isLoading = false;
        this.resetFormFromUser();
      },
      error: (error) => {
        console.error(error);
        this.user = storedUser;
        this.i18nService.setLanguage(storedUser.language || 'en');
        this.hasError = false;
        this.isLoading = false;
        this.resetFormFromUser();
      },
    });
  }

  private resetFormFromUser(): void {
    if (!this.user) {
      return;
    }

    this.profileForm.reset({
      weight: this.user.weight,
      language: this.user.language || 'en',
    });
  }
}
