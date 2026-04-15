import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronForwardOutline,
  searchOutline,
} from 'ionicons/icons';
import {
  ExerciseCardComponent,
  ExerciseCardItem,
} from './components/exercise-card/exercise-card.component';
import { ExerciseDto, ExerciseService } from 'src/app/services/exercise';

type ExerciseFilter = 'All' | 'Core' | 'Upper' | 'Lower';
type ExerciseListItem = ExerciseCardItem & {
  filter: Exclude<ExerciseFilter, 'All'>;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, ExerciseCardComponent],
})
export class HomeComponent implements OnInit {
  readonly filters: ExerciseFilter[] = ['All', 'Core', 'Upper', 'Lower'];
  readonly pageSize = 4;
  readonly fallbackImages = {
    core: 'assets/images/register-fitness.jpg',
    upper: 'assets/images/login-fitness.jpg',
    lower: 'assets/images/login-fitness.jpg',
  };

  selectedFilter: ExerciseFilter = 'All';
  currentPage = 1;
  exercises: ExerciseListItem[] = [];
  isLoading = true;
  hasError = false;

  constructor(private exerciseService: ExerciseService) {
    addIcons({
      addOutline,
      chevronForwardOutline,
      searchOutline,
    });
  }

  ngOnInit(): void {
    this.loadExercises();
  }

  get filteredExercises(): ExerciseListItem[] {
    if (this.selectedFilter === 'All') {
      return this.exercises;
    }

    return this.exercises.filter(
      (exercise) => exercise.filter === this.selectedFilter
    );
  }

  get paginatedExercises(): Array<ExerciseCardItem> {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    return this.filteredExercises.slice(startIndex, endIndex);
  }

  get totalPages(): number[] {
    const pageCount = Math.ceil(this.filteredExercises.length / this.pageSize);

    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  loadExercises(): void {
    this.isLoading = true;
    this.hasError = false;

    this.exerciseService.getExercises().subscribe({
      next: (exercises) => {
        this.exercises = exercises.map((exercise) => this.mapExercise(exercise));
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.exercises = [];
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  selectFilter(filter: ExerciseFilter): void {
    this.selectedFilter = filter;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  private mapExercise(exercise: ExerciseDto): ExerciseListItem {
    const filter = this.resolveFilter(exercise);

    return {
      title: exercise.title,
      category: this.getCategoryLabel(filter),
      filter,
      image: exercise.imageUrl || this.getFallbackImage(filter),
    };
  }

  private resolveFilter(exercise: ExerciseDto): Exclude<ExerciseFilter, 'All'> {
    if (exercise.isUpperBody) {
      return 'Upper';
    }

    if (exercise.isLowerBody) {
      return 'Lower';
    }

    return 'Core';
  }

  private getCategoryLabel(filter: Exclude<ExerciseFilter, 'All'>): string {
    if (filter === 'Upper') {
      return 'Upper Body';
    }

    if (filter === 'Lower') {
      return 'Lower Body';
    }

    return 'Core';
  }

  private getFallbackImage(filter: Exclude<ExerciseFilter, 'All'>): string {
    if (filter === 'Upper') {
      return this.fallbackImages.upper;
    }

    if (filter === 'Lower') {
      return this.fallbackImages.lower;
    }

    return this.fallbackImages.core;
  }
}
