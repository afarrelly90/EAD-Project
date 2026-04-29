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
  readonly profileLimits = {
    minWeight: 20,
    maxWeight: 400,
    minWorkoutMinutes: 5,
    maxWorkoutMinutes: 180,
    minSets: 1,
    maxSets: 10,
    minExerciseSeconds: 5,
    maxExerciseSeconds: 3600,
    minRestSeconds: 5,
    maxRestSeconds: 600,
  };
  readonly difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];
  readonly muscleGroupOptions = ['Core', 'Upper', 'Lower', 'Other'];
  readonly equipmentOptions = [
    'None',
    'Mat',
    'Dumbbell',
    'Resistance Band',
    'Kettlebell',
    'Bench',
  ];

  user: AuthUserProfile | null = null;
  profileForm!: FormGroup;
  isLoading = true;
  hasError = false;
  isEditing = false;
  isSaving = false;
  showValidationMessage = false;

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
      weight: [
        null,
        [
          Validators.min(this.profileLimits.minWeight),
          Validators.max(this.profileLimits.maxWeight),
        ],
      ],
      language: ['en', [Validators.required]],
      preferredDifficulty: ['Beginner', [Validators.required]],
      preferredMuscleGroup: ['Core', [Validators.required]],
      preferredWorkoutMinutes: [
        20,
        [
          Validators.required,
          Validators.min(this.profileLimits.minWorkoutMinutes),
          Validators.max(this.profileLimits.maxWorkoutMinutes),
        ],
      ],
      preferredEquipment: ['None'],
      defaultSets: [
        3,
        [
          Validators.required,
          Validators.min(this.profileLimits.minSets),
          Validators.max(this.profileLimits.maxSets),
        ],
      ],
      defaultExerciseSeconds: [
        45,
        [
          Validators.required,
          Validators.min(this.profileLimits.minExerciseSeconds),
          Validators.max(this.profileLimits.maxExerciseSeconds),
        ],
      ],
      defaultRestSeconds: [
        60,
        [
          Validators.required,
          Validators.min(this.profileLimits.minRestSeconds),
          Validators.max(this.profileLimits.maxRestSeconds),
        ],
      ],
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

  get preferredDifficultyLabel(): string {
    const difficulty = this.user?.preferredDifficulty?.toLowerCase() || 'beginner';
    return this.i18nService.translate(`exercise.difficulty_options.${difficulty}`);
  }

  get preferredMuscleGroupLabel(): string {
    const muscleGroup = this.user?.preferredMuscleGroup?.toLowerCase() || 'core';
    return this.i18nService.translate(`exercise.muscle_groups.${muscleGroup}`);
  }

  get preferredEquipmentLabel(): string {
    const equipment = this.user?.preferredEquipment;
    if (!equipment) {
      return this.i18nService.translate('exercise.equipment_options.none');
    }

    const key = `exercise.equipment_options.${equipment
      .toLowerCase()
      .replace(/ /g, '_')}`;
    const translated = this.i18nService.translate(key);
    return translated === key ? equipment : translated;
  }

  get timerPresetLabel(): string {
    if (!this.user) {
      return '';
    }

    return this.i18nService.translate('profile.timer_preset_value', {
      sets: this.user.defaultSets,
      exercise: this.user.defaultExerciseSeconds,
      rest: this.user.defaultRestSeconds,
    });
  }

  get canSaveProfile(): boolean {
    return !this.isSaving && this.profileForm.valid;
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  toggleEditing(): void {
    if (!this.user) {
      return;
    }

    this.isEditing = !this.isEditing;
    this.showValidationMessage = false;

    if (this.isEditing) {
      this.profileForm.patchValue({
        weight: this.user.weight,
        language: this.user.language || 'en',
        preferredDifficulty: this.user.preferredDifficulty || 'Beginner',
        preferredMuscleGroup: this.user.preferredMuscleGroup || 'Core',
        preferredWorkoutMinutes: this.user.preferredWorkoutMinutes || 20,
        preferredEquipment: this.user.preferredEquipment || 'None',
        defaultSets: this.user.defaultSets || 3,
        defaultExerciseSeconds: this.user.defaultExerciseSeconds || 45,
        defaultRestSeconds: this.user.defaultRestSeconds || 60,
      });
      return;
    }

    this.resetFormFromUser();
  }

  saveProfile(): void {
    if (!this.user || this.profileForm.invalid) {
      this.showValidationMessage = true;
      this.profileForm.markAllAsTouched();
      return;
    }

    const rawWeight = this.profileForm.value.weight;
    const parsedWeight = rawWeight === null || rawWeight === '' ? null : Number(rawWeight);
    const payload: UpdateProfileDto = {
      weight: Number.isNaN(parsedWeight) ? null : parsedWeight,
      language: this.profileForm.value.language || 'en',
      preferredDifficulty: this.profileForm.value.preferredDifficulty || 'Beginner',
      preferredMuscleGroup: this.profileForm.value.preferredMuscleGroup || 'Core',
      preferredWorkoutMinutes: Number(this.profileForm.value.preferredWorkoutMinutes) || 20,
      preferredEquipment:
        !this.profileForm.value.preferredEquipment ||
        this.profileForm.value.preferredEquipment === 'None'
          ? null
          : this.profileForm.value.preferredEquipment,
      defaultSets: Number(this.profileForm.value.defaultSets) || 3,
      defaultExerciseSeconds: Number(this.profileForm.value.defaultExerciseSeconds) || 45,
      defaultRestSeconds: Number(this.profileForm.value.defaultRestSeconds) || 60,
    };

    this.isSaving = true;
    this.showValidationMessage = false;
    this.authService.updateProfile(this.user.id, payload).subscribe({
      next: (updatedProfile) => {
        this.user = updatedProfile;
        this.authService.updateStoredUser(updatedProfile);
        this.i18nService.setLanguage(updatedProfile.language || 'en');
        this.isEditing = false;
        this.isSaving = false;
        this.showValidationMessage = false;
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

  getFieldError(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (!control?.touched || !control.errors) {
      return '';
    }

    if (controlName === 'weight' && (control.errors['min'] || control.errors['max'])) {
      return this.i18nService.translate('profile.field_errors.weight', {
        min: this.profileLimits.minWeight,
        max: this.profileLimits.maxWeight,
      });
    }

    if (
      controlName === 'preferredWorkoutMinutes' &&
      (control.errors['required'] || control.errors['min'] || control.errors['max'])
    ) {
      return this.i18nService.translate('profile.field_errors.workout_minutes', {
        min: this.profileLimits.minWorkoutMinutes,
        max: this.profileLimits.maxWorkoutMinutes,
      });
    }

    if (
      controlName === 'defaultSets' &&
      (control.errors['required'] || control.errors['min'] || control.errors['max'])
    ) {
      return this.i18nService.translate('profile.field_errors.default_sets', {
        min: this.profileLimits.minSets,
        max: this.profileLimits.maxSets,
      });
    }

    if (
      controlName === 'defaultExerciseSeconds' &&
      (control.errors['required'] || control.errors['min'] || control.errors['max'])
    ) {
      return this.i18nService.translate('profile.field_errors.default_exercise_seconds', {
        min: this.profileLimits.minExerciseSeconds,
        max: this.profileLimits.maxExerciseSeconds,
      });
    }

    if (
      controlName === 'defaultRestSeconds' &&
      (control.errors['required'] || control.errors['min'] || control.errors['max'])
    ) {
      return this.i18nService.translate('profile.field_errors.default_rest_seconds', {
        min: this.profileLimits.minRestSeconds,
        max: this.profileLimits.maxRestSeconds,
      });
    }

    return '';
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
      preferredDifficulty: this.user.preferredDifficulty || 'Beginner',
      preferredMuscleGroup: this.user.preferredMuscleGroup || 'Core',
      preferredWorkoutMinutes: this.user.preferredWorkoutMinutes || 20,
      preferredEquipment: this.user.preferredEquipment || 'None',
      defaultSets: this.user.defaultSets || 3,
      defaultExerciseSeconds: this.user.defaultExerciseSeconds || 45,
      defaultRestSeconds: this.user.defaultRestSeconds || 60,
    });
    this.showValidationMessage = false;
  }
}
