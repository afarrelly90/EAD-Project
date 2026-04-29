import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';

import { ExerciseCardComponent } from './exercise-card.component';

describe('ExerciseCardComponent', () => {
  let component: ExerciseCardComponent;
  let fixture: ComponentFixture<ExerciseCardComponent>;
  let router: Router;

  const exercise = {
    id: 7,
    title: 'Mountain Climbers',
    categoryKey: 'exercise.muscle_groups.core',
    image: 'https://example.com/mountain-climbers.jpg',
    isFavorite: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseCardComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    component.exercise = exercise;
    fixture.detectChanges();
  });

  it('should render the exercise content and link to the detail page', () => {
    const article = fixture.debugElement.query(By.css('article'));
    const title = fixture.debugElement.query(By.css('.exercise-card__title')).nativeElement;
    const category = fixture.debugElement.query(By.css('.exercise-card__category')).nativeElement;
    const image = fixture.debugElement.query(By.css('.exercise-card__image')).nativeElement as HTMLImageElement;
    const actionButton = fixture.debugElement.query(By.css('.exercise-card__action')).nativeElement;
    const routerLink = article.injector.get(RouterLink);

    expect(title.textContent.trim()).toBe('Mountain Climbers');
    expect(category.textContent.trim()).toBe('Core');
    expect(image.src).toContain('https://example.com/mountain-climbers.jpg');
    expect(image.alt).toBe('Mountain Climbers');
    expect(actionButton.getAttribute('aria-label')).toBe('View exercise');
    expect(routerLink.urlTree).not.toBeNull();
    expect(router.serializeUrl(routerLink.urlTree!)).toBe('/exercises/7');
  });

  it('should emit the favorite toggle output and stop the original event', () => {
    const event = jasmine.createSpyObj<Event>('event', ['preventDefault', 'stopPropagation']);
    spyOn(component.favoriteToggle, 'emit');

    component.toggleFavorite(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.favoriteToggle.emit).toHaveBeenCalledWith(7);
  });
});
