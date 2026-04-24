import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

export interface ExerciseCardItem {
  id: number;
  title: string;
  categoryKey: string;
  image: string;
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

  constructor() {
    addIcons({ chevronForwardOutline });
  }
}
