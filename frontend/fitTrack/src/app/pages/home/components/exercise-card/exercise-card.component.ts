import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';

export interface ExerciseCardItem {
  id: number;
  title: string;
  category: string;
  image: string;
}

@Component({
  selector: 'app-exercise-card',
  standalone: true,
  templateUrl: './exercise-card.component.html',
  styleUrls: ['./exercise-card.component.scss'],
  imports: [CommonModule, RouterModule, IonIcon],
})
export class ExerciseCardComponent {
  @Input({ required: true }) exercise!: ExerciseCardItem;

  constructor() {
    addIcons({ chevronForwardOutline });
  }
}
