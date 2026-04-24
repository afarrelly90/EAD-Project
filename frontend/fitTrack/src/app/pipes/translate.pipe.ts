import {
  ChangeDetectorRef,
  OnDestroy,
  Pipe,
  PipeTransform,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private readonly i18nService = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subscription: Subscription;

  constructor() {
    this.subscription = this.i18nService.languageChanges.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  transform(
    key: string,
    params?: Record<string, string | number | null | undefined>
  ): string {
    return this.i18nService.translate(key, params);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
