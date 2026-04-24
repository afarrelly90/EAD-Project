import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronForwardOutline,
  closeOutline,
  personCircleOutline,
  searchOutline,
} from 'ionicons/icons';
import {
  ExerciseCardComponent,
  ExerciseCardItem,
} from './components/exercise-card/exercise-card.component';
import { ExerciseDto, ExerciseService } from 'src/app/services/exercise';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

type ExerciseFilter = 'All' | 'Core' | 'Upper' | 'Lower';
type ExerciseListItem = ExerciseCardItem & {
  filter: Exclude<ExerciseFilter, 'All'>;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonIcon,
    ExerciseCardComponent,
    TranslatePipe,
  ],
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
  searchTerm = '';
  isSearchOpen = false;
  exercises: ExerciseListItem[] = [];
  isLoading = true;
  hasError = false;

  constructor(private exerciseService: ExerciseService) {
    addIcons({
      addOutline,
      chevronForwardOutline,
      closeOutline,
      personCircleOutline,
      searchOutline,
    });
  }

  ngOnInit(): void {
    this.loadExercises();
  }

  ionViewWillEnter(): void {
    this.loadExercises();
  }

  get filteredExercises(): ExerciseListItem[] {
    const exercisesByFilter = this.selectedFilter === 'All'
      ? this.exercises
      : this.exercises.filter(
          (exercise) => exercise.filter === this.selectedFilter
        );

    const normalizedSearchTerm = this.searchTerm.trim().toLowerCase();
    if (!normalizedSearchTerm) {
      return exercisesByFilter;
    }

    return exercisesByFilter.filter((exercise) =>
      exercise.title.toLowerCase().includes(normalizedSearchTerm)
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

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;

    if (!this.isSearchOpen) {
      this.searchTerm = '';
    }

    this.currentPage = 1;
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  private mapExercise(exercise: ExerciseDto): ExerciseListItem {
    const filter = this.resolveFilter(exercise);

    return {
      id: exercise.id,
      title: exercise.title,
      categoryKey: this.getCategoryKey(filter),
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

  private getCategoryKey(filter: Exclude<ExerciseFilter, 'All'>): string {
    return `exercise.muscle_groups.${filter.toLowerCase()}`;
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
