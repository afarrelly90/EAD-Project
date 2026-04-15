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
import { CreateExerciseDto, ExerciseService } from 'src/app/services/exercise';

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
  ],
})
export class CreateExerciseComponent implements OnInit {
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
    private exerciseService: ExerciseService,
    private router: Router
  ) {
    addIcons({
      chevronBackOutline,
      chevronDownOutline,
      linkOutline,
    });
  }

  ngOnInit(): void {}

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
        alert('Could not save exercise.');
      },
    });
  }
}
