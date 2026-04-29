import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  playCircleOutline,
  refreshOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { AuthService, AuthUserProfile } from 'src/app/services/auth';
import {
  ExerciseDto,
  ExerciseService,
  GeneratedWorkoutDto,
} from 'src/app/services/exercise';
import { I18nService } from 'src/app/services/i18n.service';
import { WorkoutPlannerService } from 'src/app/services/workout-planner.service';

@Component({
  selector: 'app-workout-builder',
  standalone: true,
  templateUrl: './workout-builder.component.html',
  styleUrls: ['./workout-builder.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
  ],
})
export class WorkoutBuilderComponent implements OnInit {
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
  generatedWorkout: GeneratedWorkoutDto | null = null;
  isLoadingProfile = true;
  isGenerating = false;
  hasError = false;
  showValidationMessage = false;

  builderForm = this.fb.group({
    difficulty: ['Beginner', [Validators.required]],
    muscleGroup: ['Core', [Validators.required]],
    equipment: ['None'],
    targetMinutes: [20, [Validators.required, Validators.min(5), Validators.max(180)]],
    maxExercises: [4, [Validators.required, Validators.min(1), Validators.max(8)]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private exerciseService: ExerciseService,
    private workoutPlannerService: WorkoutPlannerService,
    private router: Router,
    private i18nService: I18nService
  ) {
    addIcons({
      chevronBackOutline,
      playCircleOutline,
      refreshOutline,
      sparklesOutline,
    });
  }

  ngOnInit(): void {
    this.generatedWorkout = this.workoutPlannerService.getWorkout();
    this.loadProfilePreferences();
  }

  get presetSummary(): string {
    if (!this.generatedWorkout) {
      return '';
    }

    return this.i18nService.translate('builder.preset_summary', {
      sets: this.generatedWorkout.prescribedSets,
      exercise: this.generatedWorkout.exerciseSeconds,
      rest: this.generatedWorkout.restSeconds,
    });
  }

  get canGenerateWorkout(): boolean {
    return !this.isLoadingProfile && !this.isGenerating && !!this.user && this.builderForm.valid;
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  applySavedPreferences(): void {
    if (!this.user) {
      return;
    }

    this.builderForm.patchValue({
      difficulty: this.user.preferredDifficulty || 'Beginner',
      muscleGroup: this.user.preferredMuscleGroup || 'Core',
      equipment: this.user.preferredEquipment || 'None',
      targetMinutes: this.user.preferredWorkoutMinutes || 20,
    });
    this.showValidationMessage = false;
  }

  generateWorkout(): void {
    if (this.builderForm.invalid || !this.user) {
      this.showValidationMessage = true;
      this.builderForm.markAllAsTouched();
      return;
    }

    const formValue = this.builderForm.getRawValue();
    this.isGenerating = true;
    this.hasError = false;
    this.showValidationMessage = false;

    this.exerciseService.generateWorkout({
      userId: this.user.id,
      difficulty: formValue.difficulty || 'Beginner',
      muscleGroup: formValue.muscleGroup || 'Core',
      equipment:
        !formValue.equipment || formValue.equipment === 'None'
          ? null
          : formValue.equipment,
      targetMinutes: Number(formValue.targetMinutes) || 20,
      maxExercises: Number(formValue.maxExercises) || 4,
    }).subscribe({
      next: (workout) => {
        this.generatedWorkout = workout;
        this.workoutPlannerService.setWorkout(workout);
        this.isGenerating = false;
      },
      error: (error) => {
        console.error(error);
        this.hasError = true;
        this.generatedWorkout = null;
        this.isGenerating = false;
      },
    });
  }

  clearWorkout(): void {
    this.generatedWorkout = null;
    this.workoutPlannerService.clearWorkout();
  }

  startGuidedWorkout(): void {
    if (!this.generatedWorkout) {
      return;
    }

    this.router.navigate(['/workouts/guided']);
  }

  trackByExerciseId(_: number, exercise: ExerciseDto): number {
    return exercise.id;
  }

  translateEquipment(equipment: string | null | undefined): string {
    if (!equipment) {
      return this.i18nService.translate('exercise.equipment_options.none');
    }

    const key = `exercise.equipment_options.${equipment.toLowerCase().replace(/ /g, '_')}`;
    const translated = this.i18nService.translate(key);
    return translated === key ? equipment : translated;
  }

  private loadProfilePreferences(): void {
    const storedUser = this.authService.getStoredUser();
    if (!storedUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = storedUser;
    this.applySavedPreferences();

    this.authService.getProfile(storedUser.id).subscribe({
      next: (profile) => {
        this.user = profile;
        this.applySavedPreferences();
        this.isLoadingProfile = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoadingProfile = false;
      },
    });
  }
}
