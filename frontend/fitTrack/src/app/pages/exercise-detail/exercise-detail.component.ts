import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  chevronBackOutline,
  flameOutline,
  playCircleOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { ExerciseDto, ExerciseService } from 'src/app/services/exercise';
import { FavoritesService } from 'src/app/services/favorites.service';
import { I18nService } from 'src/app/services/i18n.service';
import { heart, heartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  templateUrl: './exercise-detail.component.html',
  styleUrls: ['./exercise-detail.component.scss'],
  imports: [CommonModule, RouterModule, IonContent, IonIcon, IonButton, TranslatePipe],
})
export class ExerciseDetailComponent implements OnInit {
  exercise: ExerciseDto | null = null;
  isLoading = true;
  hasError = false;
  isFavorite = false;

  readonly fallbackImages = {
    core: 'assets/images/register-fitness.jpg',
    upper: 'assets/images/login-fitness.jpg',
    lower: 'assets/images/login-fitness.jpg',
    other: 'assets/images/register-fitness.jpg',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private exerciseService: ExerciseService,
    private favoritesService: FavoritesService,
    private i18nService: I18nService
  ) {
    addIcons({
      createOutline,
      chevronBackOutline,
      flameOutline,
      heart,
      heartOutline,
      playCircleOutline,
      timeOutline,
      trashOutline,
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
    return this.categoryKey ? this.i18nService.translate(this.categoryKey) : '';
  }

  get categoryKey(): string {
    if (!this.exercise) {
      return '';
    }

    if (this.exercise.isUpperBody) {
      return 'exercise.muscle_groups.upper';
    }

    if (this.exercise.isLowerBody) {
      return 'exercise.muscle_groups.lower';
    }

    if (this.exercise.isCore) {
      return 'exercise.muscle_groups.core';
    }

    return 'exercise.muscle_groups.general';
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
    const equipment = this.exercise?.equipment;
    if (!equipment) {
      return this.i18nService.translate('exercise.equipment_options.none');
    }

    const key = `exercise.equipment_options.${equipment
      .toLowerCase()
      .replace(/ /g, '_')}`;
    const translated = this.i18nService.translate(key);
    return translated === key ? equipment : translated;
  }

  get difficultyKey(): string {
    const difficulty = this.exercise?.difficulty?.toLowerCase();
    return difficulty ? `exercise.difficulty_options.${difficulty}` : '';
  }

  get editExerciseUrl(): string {
    return this.exercise ? `/exercises/${this.exercise.id}/edit` : '/home';
  }

  get workoutUrl(): string {
    return this.exercise ? `/exercises/${this.exercise.id}/workout` : '/home';
  }

  get favoriteButtonLabel(): string {
    return this.isFavorite
      ? this.i18nService.translate('favorites.remove')
      : this.i18nService.translate('favorites.add');
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  editExercise(): void {
    if (!this.exercise) {
      return;
    }

    window.location.href = this.editExerciseUrl;
  }

  toggleFavorite(): void {
    if (!this.exercise) {
      return;
    }

    this.isFavorite = this.favoritesService.toggleFavorite(this.exercise.id);
  }

  deleteExercise(): void {
    if (!this.exercise) {
      return;
    }

    const confirmed = window.confirm(
      this.i18nService.translate('exercise_detail.delete_confirm', {
        title: this.exercise.title,
      })
    );

    if (!confirmed) {
      return;
    }

    this.exerciseService.deleteExercise(this.exercise.id).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error(error);
        window.alert(this.i18nService.translate('exercise_detail.delete_error'));
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

    this.isLoading = true;
    this.hasError = false;

    this.exerciseService.getExerciseById(id).subscribe({
      next: (exercise) => {
        this.exercise = exercise;
        this.isFavorite = this.favoritesService.isFavorite(exercise.id);
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
