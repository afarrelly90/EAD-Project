import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  flameOutline,
  playCircleOutline,
  timeOutline,
} from 'ionicons/icons';
import { ExerciseDto, ExerciseService } from 'src/app/services/exercise';

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.scss'],
  imports: [CommonModule, RouterModule, IonContent, IonIcon, IonButton],
})
export class ExerciseDetailComponent implements OnInit {
  exercise: ExerciseDto | null = null;
  isLoading = true;
  hasError = false;

  readonly fallbackImages = {
    core: 'assets/images/register-fitness.jpg',
    upper: 'assets/images/login-fitness.jpg',
    lower: 'assets/images/login-fitness.jpg',
    other: 'assets/images/register-fitness.jpg',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private exerciseService: ExerciseService
  ) {
    addIcons({
      chevronBackOutline,
      flameOutline,
      playCircleOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    this.loadExercise();
  }

  ionViewWillEnter(): void {
    this.loadExercise();
  }

  get heroImage(): string {
    if (!this.exercise) {
      return this.fallbackImages.other;
    }

    return this.exercise.imageUrl || this.fallbackImageByCategory;
  }

  get categoryLabel(): string {
    if (!this.exercise) {
      return '';
    }

    if (this.exercise.isUpperBody) {
      return 'Upper Body';
    }

    if (this.exercise.isLowerBody) {
      return 'Lower Body';
    }

    if (this.exercise.isCore) {
      return 'Core';
    }

    return 'General Fitness';
  }

  get fallbackImageByCategory(): string {
    if (!this.exercise) {
      return this.fallbackImages.other;
    }

    if (this.exercise.isUpperBody) {
      return this.fallbackImages.upper;
    }

    if (this.exercise.isLowerBody) {
      return this.fallbackImages.lower;
    }

    if (this.exercise.isCore) {
      return this.fallbackImages.core;
    }

    return this.fallbackImages.other;
  }

  get equipmentLabel(): string {
    return this.exercise?.equipment || 'None';
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  private loadExercise(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.exerciseService.getExerciseById(id).subscribe({
      next: (exercise) => {
        this.exercise = exercise;
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
}
