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
  IonTextarea,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronDownOutline, linkOutline } from 'ionicons/icons';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { CreateExerciseDto, ExerciseService } from 'src/app/services/exercise';
import { I18nService } from 'src/app/services/i18n.service';

type MuscleGroup = 'Core' | 'Upper' | 'Lower' | 'Other';

@Component({
  selector: 'app-create-exercise',
  standalone: true,
  templateUrl: './create-exercise.component.html',
  styleUrls: ['./create-exercise.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
  ],
})
export class CreateExerciseComponent implements OnInit {
  readonly exerciseLimits = {
    minCalories: 1,
    maxCalories: 2000,
    minDurationMinutes: 1,
    maxDurationMinutes: 180,
  };
  readonly urlPattern = /^https?:\/\/.+/i;
  readonly muscleGroups: MuscleGroup[] = ['Core', 'Upper', 'Lower', 'Other'];
  readonly difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];
  readonly equipmentOptions = [
    'None',
    'Mat',
    'Dumbbell',
    'Resistance Band',
    'Kettlebell',
    'Bench',
  ];

  selectedMuscleGroup: MuscleGroup = 'Core';
  isSaving = false;
  showValidationMessage = false;

  createExerciseForm = this.fb.group({
    imageUrl: ['', [Validators.pattern(this.urlPattern)]],
    videoLink: ['', [Validators.pattern(this.urlPattern)]],
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    equipment: ['None'],
    calories: [
      50,
      [
        Validators.required,
        Validators.min(this.exerciseLimits.minCalories),
        Validators.max(this.exerciseLimits.maxCalories),
      ],
    ],
    durationMinutes: [
      10,
      [
        Validators.required,
        Validators.min(this.exerciseLimits.minDurationMinutes),
        Validators.max(this.exerciseLimits.maxDurationMinutes),
      ],
    ],
    difficulty: ['Beginner', [Validators.required, Validators.maxLength(50)]],
  });

  constructor(
    private fb: FormBuilder,
    private exerciseService: ExerciseService,
    private router: Router,
    private i18nService: I18nService
  ) {
    addIcons({
      chevronBackOutline,
      chevronDownOutline,
      linkOutline,
    });
  }

  ngOnInit(): void {}

  get canSubmit(): boolean {
    return !this.isSaving && this.createExerciseForm.valid;
  }

  selectMuscleGroup(group: MuscleGroup): void {
    this.selectedMuscleGroup = group;
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  onSubmit(): void {
    if (this.createExerciseForm.invalid) {
      this.showValidationMessage = true;
      this.createExerciseForm.markAllAsTouched();
      return;
    }

    this.showValidationMessage = false;

    const formValue = this.createExerciseForm.getRawValue();
    const payload: CreateExerciseDto = {
      title: formValue.title?.trim() || '',
      description: formValue.description?.trim() || null,
      videoLink: formValue.videoLink?.trim() || null,
      imageUrl: formValue.imageUrl?.trim() || null,
      calories: Number(formValue.calories) || 0,
      isCore: this.selectedMuscleGroup === 'Core',
      isUpperBody: this.selectedMuscleGroup === 'Upper',
      isLowerBody: this.selectedMuscleGroup === 'Lower',
      difficulty: formValue.difficulty || 'Beginner',
      durationMinutes: Number(formValue.durationMinutes) || 1,
      equipment:
        !formValue.equipment || formValue.equipment === 'None'
          ? null
          : formValue.equipment,
    };

    this.isSaving = true;

    this.exerciseService.createExercise(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error(error);
        this.isSaving = false;
        alert(this.i18nService.translate('create_exercise.save_error'));
      },
    });
  }

  getFieldError(controlName: string): string {
    const control = this.createExerciseForm.get(controlName);
    if (!control?.touched || !control.errors) {
      return '';
    }

    if (controlName === 'title' && control.errors['required']) {
      return this.i18nService.translate('create_exercise.name_required');
    }

    if ((controlName === 'imageUrl' || controlName === 'videoLink') && control.errors['pattern']) {
      return this.i18nService.translate('create_exercise.link_invalid');
    }

    if (controlName === 'calories' && (control.errors['required'] || control.errors['min'] || control.errors['max'])) {
      return this.i18nService.translate('create_exercise.calories_invalid', {
        min: this.exerciseLimits.minCalories,
        max: this.exerciseLimits.maxCalories,
      });
    }

    if (
      controlName === 'durationMinutes' &&
      (control.errors['required'] || control.errors['min'] || control.errors['max'])
    ) {
      return this.i18nService.translate('create_exercise.minutes_invalid', {
        min: this.exerciseLimits.minDurationMinutes,
        max: this.exerciseLimits.maxDurationMinutes,
      });
    }

    return '';
  }
}
