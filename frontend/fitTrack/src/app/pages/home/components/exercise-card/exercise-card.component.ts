import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, heart, heartOutline } from 'ionicons/icons';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

export interface ExerciseCardItem {
  id: number;
  title: string;
  categoryKey: string;
  image: string;
  isFavorite: boolean;
}

@Component({
  selector: 'app-exercise-card',
  standalone: true,
  templateUrl: './exercise-card.component.html',
  styleUrls: ['./exercise-card.component.scss'],
  imports: [CommonModule, RouterModule, IonIcon, TranslatePipe],
})
export class ExerciseCardComponent {
  @Input({ required: true }) exercise!: ExerciseCardItem;
  @Output() favoriteToggle = new EventEmitter<number>();

  constructor() {
    addIcons({ chevronForwardOutline, heart, heartOutline });
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggle.emit(this.exercise.id);
  }
}
