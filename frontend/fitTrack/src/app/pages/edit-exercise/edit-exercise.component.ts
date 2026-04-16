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
  ],
})
export class EditExerciseComponent implements OnInit {
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
    imageUrl: [''],
    videoLink: [''],
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    equipment: ['None'],
    calories: [50, [Validators.required, Validators.min(0), Validators.max(5000)]],
    durationMinutes: [10, [Validators.required, Validators.min(1), Validators.max(300)]],
    difficulty: ['Beginner', [Validators.required, Validators.maxLength(50)]],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private exerciseService: ExerciseService
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
        alert('Could not update exercise.');
      },
    });
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
