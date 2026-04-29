import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import {
  chevronBackOutline,
  chevronDownOutline,
  linkOutline,
} from 'ionicons/icons';
import {
  ExerciseDto,
  ExerciseService,
  UpdateExerciseDto,
} from 'src/app/services/exercise';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { I18nService } from 'src/app/services/i18n.service';

type MuscleGroup = 'Core' | 'Upper' | 'Lower' | 'Other';

@Component({
  selector: 'app-edit-exercise',
  standalone: true,
  templateUrl: './edit-exercise.component.html',
  styleUrls: ['./edit-exercise.component.scss'],
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
export class EditExerciseComponent implements OnInit {
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
  exerciseId = 0;
  exercise: ExerciseDto | null = null;
  isLoading = true;
  isSaving = false;
  hasError = false;
  showValidationMessage = false;

  editExerciseForm = this.fb.group({
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
    private route: ActivatedRoute,
    private router: Router,
    private exerciseService: ExerciseService,
    private i18nService: I18nService
  ) {
    addIcons({
      chevronBackOutline,
      chevronDownOutline,
      linkOutline,
    });
  }

  ngOnInit(): void {
    this.loadExercise();
  }

  ionViewWillEnter(): void {
    this.loadExercise();
  }

  get canSubmit(): boolean {
    return !this.isSaving && this.editExerciseForm.valid;
  }

  selectMuscleGroup(group: MuscleGroup): void {
    this.selectedMuscleGroup = group;
  }

  goBack(): void {
    if (this.exerciseId) {
      this.router.navigate(['/exercises', this.exerciseId]);
      return;
    }

    this.router.navigate(['/home']);
  }

  onSubmit(): void {
    if (this.editExerciseForm.invalid || !this.exerciseId) {
      this.showValidationMessage = true;
      this.editExerciseForm.markAllAsTouched();
      return;
    }

    this.showValidationMessage = false;

    const formValue = this.editExerciseForm.getRawValue();
    const payload: UpdateExerciseDto = {
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

    this.exerciseService.updateExercise(this.exerciseId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/exercises', this.exerciseId]);
      },
      error: (error) => {
        console.error(error);
        this.isSaving = false;
        alert(this.i18nService.translate('edit_exercise.update_error'));
      },
    });
  }

  getFieldError(controlName: string): string {
    const control = this.editExerciseForm.get(controlName);
    if (!control?.touched || !control.errors) {
      return '';
    }

    if (controlName === 'title' && control.errors['required']) {
      return this.i18nService.translate('edit_exercise.name_required');
    }

    if ((controlName === 'imageUrl' || controlName === 'videoLink') && control.errors['pattern']) {
      return this.i18nService.translate('edit_exercise.link_invalid');
    }

    if (controlName === 'calories' && (control.errors['required'] || control.errors['min'] || control.errors['max'])) {
      return this.i18nService.translate('edit_exercise.calories_invalid', {
        min: this.exerciseLimits.minCalories,
        max: this.exerciseLimits.maxCalories,
      });
    }

    if (
      controlName === 'durationMinutes' &&
      (control.errors['required'] || control.errors['min'] || control.errors['max'])
    ) {
      return this.i18nService.translate('edit_exercise.minutes_invalid', {
        min: this.exerciseLimits.minDurationMinutes,
        max: this.exerciseLimits.maxDurationMinutes,
      });
    }

    return '';
  }

  private loadExercise(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.exerciseId = id;
    this.isLoading = true;
    this.hasError = false;

    this.exerciseService.getExerciseById(id).subscribe({
      next: (exercise) => {
        this.exercise = exercise;
        this.patchForm(exercise);
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.exercise = null;
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  private patchForm(exercise: ExerciseDto): void {
    this.selectedMuscleGroup = exercise.isUpperBody
      ? 'Upper'
      : exercise.isLowerBody
        ? 'Lower'
        : exercise.isCore
          ? 'Core'
          : 'Other';

    this.editExerciseForm.patchValue({
      imageUrl: exercise.imageUrl || '',
      videoLink: exercise.videoLink || '',
      title: exercise.title,
      description: exercise.description || '',
      equipment: exercise.equipment || 'None',
      calories: exercise.calories,
      durationMinutes: exercise.durationMinutes,
      difficulty: exercise.difficulty,
    });
  }
}
