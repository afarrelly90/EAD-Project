import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, refreshOutline, timerOutline } from 'ionicons/icons';
import { ExerciseDto, ExerciseService } from 'src/app/services/exercise';

type WorkoutPhase = 'idle' | 'exercise' | 'rest' | 'complete';
type NumberRange = readonly [min: number, max: number];

@Component({
  selector: 'app-workout-timer',
  standalone: true,
  templateUrl: './workout-timer.component.html',
  styleUrls: ['./workout-timer.component.scss'],
  imports: [CommonModule, RouterModule, IonContent, IonButton, IonIcon],
})
export class WorkoutTimerComponent implements OnInit, OnDestroy {
  readonly minSets = 1;
  readonly maxSets = 20;
  readonly minExerciseSeconds = 5;
  readonly maxExerciseSeconds = 3600;
  readonly minRestSeconds = 5;
  readonly maxRestSeconds = 600;

  exercise: ExerciseDto | null = null;
  isLoading = true;
  hasError = false;
  plannedSets = 3;
  exerciseSeconds = 45;
  restSeconds = 60;
  plannedSetsInput = '3';
  exerciseSecondsInput = '45';
  restSecondsInput = '60';
  currentSet = 1;
  workoutStarted = false;
  workoutComplete = false;
  private currentPhase: WorkoutPhase = 'idle';
  private timerId: ReturnType<typeof setInterval> | null = null;
  private phaseRemainingMs = 0;
  private phaseDurationMs = 0;
  private lastTickAt = 0;

  private readonly setsRange: NumberRange = [this.minSets, this.maxSets];
  private readonly exerciseSecondsRange: NumberRange = [
    this.minExerciseSeconds,
    this.maxExerciseSeconds,
  ];
  private readonly restSecondsRange: NumberRange = [
    this.minRestSeconds,
    this.maxRestSeconds,
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private exerciseService: ExerciseService
  ) {
    addIcons({
      chevronBackOutline,
      refreshOutline,
      timerOutline,
    });
  }

  ngOnInit(): void {
    this.loadExercise();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  get nextSetNumber(): number {
    return Math.min(this.currentSet + 1, this.plannedSets);
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

  get timerButtonLabel(): string {
    if (!this.workoutStarted) {
      return 'Begin Workout';
    }

    switch (this.currentPhase) {
      case 'complete':
        return 'Workout Complete';
      case 'exercise':
        return 'Exercise in progress';
      case 'rest':
        return 'Rest in progress';
      default:
        return 'Workout in progress';
    }
  }

  get timerStatusTitle(): string {
    if (!this.workoutStarted) {
      return 'Set up your workout';
    }

    switch (this.currentPhase) {
      case 'complete':
        return 'All sets complete';
      case 'exercise':
        return `Exercise set ${this.currentSet} of ${this.plannedSets}`;
      case 'rest':
        return `Rest before set ${this.nextSetNumber}`;
      default:
        return `Current set: ${this.currentSet} of ${this.plannedSets}`;
    }
  }

  get timerStatusMessage(): string {
    if (!this.workoutStarted) {
      return 'Choose your set count, exercise length, and rest time, then start when you are ready.';
    }

    if (this.workoutComplete) {
      return `You finished ${this.plannedSets} set${this.plannedSets === 1 ? '' : 's'}.`;
    }

    if (this.isExerciseActive) {
      return `${this.formatTime(this.secondsRemaining)} left in set ${this.currentSet}.`;
    }

    if (this.isRestActive) {
      return `${this.formatTime(this.secondsRemaining)} remaining before the next set.`;
    }

    return 'Workout ready.';
  }

  get timerDisplayTime(): string {
    return this.formatTime(
      this.secondsRemaining > 0
        ? this.secondsRemaining
        : this.workoutStarted && !this.workoutComplete
          ? this.activePhaseDuration
          : this.exerciseSeconds
    );
  }

  get countdownLabel(): string {
    switch (this.currentPhase) {
      case 'complete':
        return 'Workout complete';
      case 'exercise':
        return 'Exercise countdown';
      case 'rest':
        return 'Rest countdown';
      default:
        return 'Exercise target';
    }
  }

  get phaseLabel(): string {
    switch (this.currentPhase) {
      case 'complete':
        return 'Done';
      case 'exercise':
        return 'Exercise';
      case 'rest':
        return 'Rest';
      default:
        return 'Ready';
    }
  }

  get secondsRemaining(): number {
    return Math.ceil(this.phaseRemainingMs / 1000);
  }

  get isWorkoutConfigValid(): boolean {
    return (
      this.getValidatedValue(this.plannedSetsInput, this.setsRange) !== null &&
      this.getValidatedValue(
        this.exerciseSecondsInput,
        this.exerciseSecondsRange
      ) !== null &&
      this.getValidatedValue(this.restSecondsInput, this.restSecondsRange) !==
        null
    );
  }

  get workoutConfigErrorMessage(): string {
    if (this.isWorkoutConfigValid || this.workoutStarted) {
      return '';
    }

    return `Enter ${this.minSets}-${this.maxSets} sets, ${this.minExerciseSeconds}-${this.maxExerciseSeconds} exercise seconds, and ${this.minRestSeconds}-${this.maxRestSeconds} rest seconds.`;
  }

  get timerProgressPercent(): number {
    if (this.workoutComplete) {
      return 100;
    }

    if (!this.workoutStarted || !this.isTimerRunning) {
      return 0;
    }

    if (this.phaseDurationMs <= 0) {
      return 0;
    }

    return ((this.phaseDurationMs - this.phaseRemainingMs) / this.phaseDurationMs) * 100;
  }

  private get activePhaseDuration(): number {
    if (this.isRestActive) {
      return this.restSeconds;
    }

    return this.exerciseSeconds;
  }

  goBack(): void {
    const id = this.exercise?.id ?? this.route.snapshot.paramMap.get('id');
    this.router.navigate([`/exercises/${id}`]);
  }

  updatePlannedSets(value: string): void {
    this.plannedSetsInput = value;
    const nextValue = this.getValidatedValue(value, this.setsRange);

    if (nextValue === null) {
      return;
    }

    this.plannedSets = nextValue;

    if (!this.workoutStarted) {
      this.currentSet = 1;
    }

    if (this.currentSet > this.plannedSets) {
      this.currentSet = this.plannedSets;
    }

    if (this.workoutComplete && this.currentSet !== this.plannedSets) {
      this.workoutComplete = false;
    }
  }

  updateExerciseSeconds(value: string): void {
    this.updateDurationValue(
      value,
      this.exerciseSecondsRange,
      'exerciseSecondsInput',
      'exerciseSeconds',
      this.isExerciseActive
    );
  }

  updateRestSeconds(value: string): void {
    this.updateDurationValue(
      value,
      this.restSecondsRange,
      'restSecondsInput',
      'restSeconds',
      this.isRestActive
    );
  }

  handleTimerAction(): void {
    if (!this.workoutStarted && this.isWorkoutConfigValid) {
      this.beginWorkout();
    }
  }

  resetWorkoutTimer(): void {
    this.clearTimer();
    this.currentSet = 1;
    this.workoutStarted = false;
    this.workoutComplete = false;
    this.currentPhase = 'idle';
    this.phaseRemainingMs = 0;
    this.phaseDurationMs = 0;
    this.lastTickAt = 0;
    this.plannedSetsInput = this.plannedSets.toString();
    this.exerciseSecondsInput = this.exerciseSeconds.toString();
    this.restSecondsInput = this.restSeconds.toString();
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

  private beginWorkout(): void {
    this.clearTimer();
    this.currentSet = 1;
    this.workoutStarted = true;
    this.workoutComplete = false;
    this.startPhase('exercise', this.exerciseSeconds);
  }

  private startPhase(phase: Extract<WorkoutPhase, 'exercise' | 'rest'>, seconds: number): void {
    this.currentPhase = phase;
    this.setPhaseDuration(seconds);
    this.startTicking();
  }

  private startTicking(): void {
    this.clearTimer();
    this.lastTickAt = Date.now();

    this.timerId = setInterval(() => {
      const now = Date.now();
      const elapsedMs = Math.max(now - this.lastTickAt, 0);
      this.lastTickAt = now;

      if (this.phaseRemainingMs > 0) {
        this.phaseRemainingMs = Math.max(this.phaseRemainingMs - elapsedMs, 0);
      }

      if (this.phaseRemainingMs === 0) {
        this.advanceWorkoutPhase();
      }
    }, 100);
  }

  private advanceWorkoutPhase(): void {
    this.clearTimer();

    if (this.isExerciseActive) {
      if (this.currentSet >= this.plannedSets) {
        this.completeWorkout();
        return;
      }

      this.startPhase('rest', this.restSeconds);
      return;
    }

    if (this.isRestActive) {
      this.currentSet += 1;
      this.startPhase('exercise', this.exerciseSeconds);
    }
  }

  private completeWorkout(): void {
    this.clearTimer();
    this.currentPhase = 'complete';
    this.phaseRemainingMs = 0;
    this.phaseDurationMs = 0;
    this.workoutComplete = true;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private setPhaseDuration(seconds: number): void {
    this.phaseDurationMs = seconds * 1000;
    this.phaseRemainingMs = this.phaseDurationMs;
  }

  private updateDurationValue(
    value: string,
    range: NumberRange,
    inputKey: 'exerciseSecondsInput' | 'restSecondsInput',
    stateKey: 'exerciseSeconds' | 'restSeconds',
    isActive: boolean
  ): void {
    this[inputKey] = value;
    const nextValue = this.getValidatedValue(value, range);

    if (nextValue === null) {
      return;
    }

    this[stateKey] = nextValue;
    this.syncActivePhaseDuration(nextValue, isActive);
  }

  private syncActivePhaseDuration(seconds: number, isActive: boolean): void {
    if (isActive && this.phaseRemainingMs > seconds * 1000) {
      this.setPhaseDuration(seconds);
    }
  }

  private getValidatedValue(
    value: string,
    [min, max]: NumberRange
  ): number | null {
    return this.parseValidatedNumber(value, min, max);
  }

  private parseValidatedNumber(
    value: string,
    min: number,
    max: number
  ): number | null {
    if (value.trim() === '') {
      return null;
    }

    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue) || !Number.isInteger(parsedValue)) {
      return null;
    }

    if (parsedValue < min || parsedValue > max) {
      return null;
    }

    return parsedValue;
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
