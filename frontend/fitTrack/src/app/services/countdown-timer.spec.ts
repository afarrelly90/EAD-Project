import { CountdownTimer } from './countdown-timer';

describe('CountdownTimer', () => {
  let timer: CountdownTimer;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-04-29T12:00:00Z'));
    timer = new CountdownTimer();
  });

  afterEach(() => {
    timer.reset();
    jasmine.clock().uninstall();
  });

  it('should expose empty defaults before starting', () => {
    expect(timer.isRunning).toBeFalse();
    expect(timer.secondsRemaining).toBe(0);
    expect(timer.progressPercent).toBe(0);
  });

  it('should count down and invoke the callback when time elapses', () => {
    const onElapsed = jasmine.createSpy('onElapsed');

    timer.start(1, onElapsed);

    expect(timer.isRunning).toBeTrue();
    expect(timer.secondsRemaining).toBe(1);

    jasmine.clock().tick(500);

    expect(timer.progressPercent).toBeCloseTo(50, 0);
    expect(timer.isRunning).toBeTrue();

    jasmine.clock().tick(500);

    expect(timer.isRunning).toBeFalse();
    expect(timer.secondsRemaining).toBe(0);
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it('should stop an active timer without firing the callback', () => {
    const onElapsed = jasmine.createSpy('onElapsed');

    timer.start(1, onElapsed);
    timer.stop();
    jasmine.clock().tick(1500);

    expect(timer.isRunning).toBeFalse();
    expect(onElapsed).not.toHaveBeenCalled();
  });

  it('should reset the timer state', () => {
    timer.start(2, () => undefined);
    jasmine.clock().tick(600);

    timer.reset();

    expect(timer.isRunning).toBeFalse();
    expect(timer.durationMs).toBe(0);
    expect(timer.remainingMs).toBe(0);
    expect(timer.progressPercent).toBe(0);
  });

  it('should update duration directly when setDuration is called', () => {
    timer.setDuration(3);

    expect(timer.durationMs).toBe(3000);
    expect(timer.remainingMs).toBe(3000);
    expect(timer.secondsRemaining).toBe(3);
  });
});
