import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  playCircleOutline,
  refreshOutline,
  timerOutline,
} from 'ionicons/icons';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { CountdownTimer } from 'src/app/services/countdown-timer';
import { ExerciseDto, GeneratedWorkoutDto } from 'src/app/services/exercise';
import { I18nService } from 'src/app/services/i18n.service';
import { WorkoutPlannerService } from 'src/app/services/workout-planner.service';

type GuidedPhase = 'idle' | 'exercise' | 'rest' | 'complete';

@Component({
  selector: 'app-guided-workout',
  standalone: true,
  templateUrl: './guided-workout.component.html',
  styleUrls: ['./guided-workout.component.scss'],
  imports: [CommonModule, IonButton, IonContent, IonIcon, TranslatePipe],
})
export class GuidedWorkoutComponent implements OnInit, OnDestroy {
  workout: GeneratedWorkoutDto | null = null;
  hasError = false;
  workoutStarted = false;
  workoutComplete = false;
  currentExerciseIndex = 0;
  currentSet = 1;
  private currentPhase: GuidedPhase = 'idle';
  private readonly countdownTimer = new CountdownTimer();

  constructor(
    private workoutPlannerService: WorkoutPlannerService,
    private router: Router,
    private i18nService: I18nService
  ) {
    addIcons({
      chevronBackOutline,
      playCircleOutline,
      refreshOutline,
      timerOutline,
    });
  }

  ngOnInit(): void {
    this.workout = this.workoutPlannerService.getWorkout();
    this.hasError = !this.workout;
  }

  ngOnDestroy(): void {
    this.countdownTimer.reset();
  }

  get currentExercise(): ExerciseDto | null {
    return this.workout?.exercises[this.currentExerciseIndex] || null;
  }

  get isExerciseActive(): boolean {
    return this.currentPhase === 'exercise';
  }

  get isRestActive(): boolean {
    return this.currentPhase === 'rest';
  }

  get isTimerRunning(): boolean {
    return this.isExerciseActive || this.isRestActive;
  }

  get secondsRemaining(): number {
    return this.countdownTimer.secondsRemaining;
  }

  get timerDisplayTime(): string {
    if (this.workoutComplete) {
      return this.formatTime(0);
    }

    return this.formatTime(this.secondsRemaining || this.activePhaseDuration);
  }

  get timerProgressPercent(): number {
    if (this.workoutComplete) {
      return 100;
    }

    if (!this.workoutStarted || this.countdownTimer.durationMs <= 0) {
      return 0;
    }

    return this.countdownTimer.progressPercent;
  }

  get phaseLabel(): string {
    switch (this.currentPhase) {
      case 'exercise':
        return this.i18nService.translate('guided_workout.phase.exercise');
      case 'rest':
        return this.i18nService.translate('guided_workout.phase.rest');
      case 'complete':
        return this.i18nService.translate('guided_workout.phase.complete');
      default:
        return this.i18nService.translate('guided_workout.phase.ready');
    }
  }

  get statusTitle(): string {
    if (!this.workoutStarted) {
      return this.i18nService.translate('guided_workout.status.setup_title');
    }

    if (this.workoutComplete) {
      return this.i18nService.translate('guided_workout.status.complete_title');
    }

    return this.i18nService.translate('guided_workout.status.progress_title', {
      exercise: this.currentExerciseIndex + 1,
      total: this.workout?.exercises.length || 0,
      set: this.currentSet,
      sets: this.workout?.prescribedSets || 0,
    });
  }

  get statusMessage(): string {
    if (!this.workoutStarted) {
      return this.i18nService.translate('guided_workout.status.setup_message', {
        count: this.workout?.exercises.length || 0,
      });
    }

    if (this.workoutComplete) {
      return this.i18nService.translate('guided_workout.status.complete_message', {
        count: this.workout?.exercises.length || 0,
      });
    }

    if (this.isExerciseActive) {
      return this.i18nService.translate('guided_workout.status.exercise_message', {
        title: this.currentExercise?.title || '',
        time: this.formatTime(this.secondsRemaining),
      });
    }

    if (this.isRestActive) {
      return this.i18nService.translate('guided_workout.status.rest_message', {
        time: this.formatTime(this.secondsRemaining),
      });
    }

    return this.i18nService.translate('guided_workout.status.ready_message');
  }

  goBack(): void {
    this.router.navigate(['/workouts/build']);
  }

  startWorkout(): void {
    if (!this.workout || this.workoutStarted) {
      return;
    }

    this.workoutStarted = true;
    this.workoutComplete = false;
    this.currentExerciseIndex = 0;
    this.currentSet = 1;
    this.startPhase('exercise', this.workout.exerciseSeconds);
  }

  resetWorkout(): void {
    this.countdownTimer.reset();
    this.workoutStarted = false;
    this.workoutComplete = false;
    this.currentExerciseIndex = 0;
    this.currentSet = 1;
    this.currentPhase = 'idle';
  }

  private get activePhaseDuration(): number {
    if (!this.workout) {
      return 0;
    }

    return this.isRestActive ? this.workout.restSeconds : this.workout.exerciseSeconds;
  }

  private startPhase(phase: Extract<GuidedPhase, 'exercise' | 'rest'>, seconds: number): void {
    this.currentPhase = phase;
    this.countdownTimer.start(seconds, () => this.advancePhase());
  }

  private advancePhase(): void {
    if (!this.workout) {
      return;
    }

    if (this.isExerciseActive) {
      const isLastSet = this.currentSet >= this.workout.prescribedSets;
      const isLastExercise = this.currentExerciseIndex >= this.workout.exercises.length - 1;

      if (isLastSet && isLastExercise) {
        this.countdownTimer.reset();
        this.currentPhase = 'complete';
        this.workoutComplete = true;
        return;
      }

      this.startPhase('rest', this.workout.restSeconds);
      return;
    }

    if (this.isRestActive) {
      if (this.currentSet < this.workout.prescribedSets) {
        this.currentSet += 1;
      } else {
        this.currentExerciseIndex += 1;
        this.currentSet = 1;
      }

      this.startPhase('exercise', this.workout.exerciseSeconds);
    }
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
