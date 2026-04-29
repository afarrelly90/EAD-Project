export class CountdownTimer {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = 0;
  private onElapsed: (() => void) | null = null;

  durationMs = 0;
  remainingMs = 0;

  get isRunning(): boolean {
    return this.timerId !== null;
  }

  get secondsRemaining(): number {
    return Math.ceil(this.remainingMs / 1000);
  }

  get progressPercent(): number {
    if (this.durationMs <= 0) {
      return 0;
    }

    return ((this.durationMs - this.remainingMs) / this.durationMs) * 100;
  }

  start(seconds: number, onElapsed: () => void): void {
    this.stop();
    this.onElapsed = onElapsed;
    this.setDuration(seconds);
    this.lastTickAt = Date.now();

    this.timerId = setInterval(() => {
      const now = Date.now();
      const elapsedMs = Math.max(now - this.lastTickAt, 0);
      this.lastTickAt = now;
      this.remainingMs = Math.max(this.remainingMs - elapsedMs, 0);

      if (this.remainingMs === 0) {
        this.stop();
        this.onElapsed?.();
      }
    }, 100);
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  reset(): void {
    this.stop();
    this.durationMs = 0;
    this.remainingMs = 0;
    this.lastTickAt = 0;
    this.onElapsed = null;
  }

  setDuration(seconds: number): void {
    this.durationMs = seconds * 1000;
    this.remainingMs = this.durationMs;
  }
}
