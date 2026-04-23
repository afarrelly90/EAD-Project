import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly storageKey = 'language';
  private readonly fallbackLanguage = 'en';
  private readonly translations = new Map<string, TranslationDictionary>();
  private readonly currentLanguageSubject = new BehaviorSubject<string>(
    this.fallbackLanguage
  );

  readonly languageChanges = this.currentLanguageSubject.asObservable();

  init(): void {
    void this.use(this.detectInitialLanguage());
  }

  setLanguage(language: string): void {
    void this.use(language);
  }

  get currentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  translate(
    key: string,
    params?: Record<string, string | number | null | undefined>
  ): string {
    const language = this.currentLanguage;
    const value =
      this.resolveKey(this.translations.get(language), key) ??
      this.resolveKey(this.translations.get(this.fallbackLanguage), key) ??
      key;

    if (typeof value !== 'string') {
      return key;
    }

    return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token: string) =>
      params?.[token] !== undefined && params?.[token] !== null
        ? String(params[token])
        : ''
    );
  }

  private async use(language: string): Promise<void> {
    const normalizedLanguage = this.normalizeLanguage(language);

    await this.ensureLoaded(this.fallbackLanguage);
    await this.ensureLoaded(normalizedLanguage);

    this.currentLanguageSubject.next(normalizedLanguage);
    localStorage.setItem(this.storageKey, normalizedLanguage);
  }

  private detectInitialLanguage(): string {
    const storedLanguage =
      localStorage.getItem(this.storageKey) ?? this.getStoredUserLanguage();

    if (storedLanguage) {
      return storedLanguage;
    }

    return typeof navigator !== 'undefined' ? navigator.language : 'en';
  }

  private getStoredUserLanguage(): string | null {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    try {
      const user = JSON.parse(storedUser) as { language?: string };
      return user.language || null;
    } catch {
      return null;
    }
  }

  private normalizeLanguage(language: string): string {
    return language?.toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  private async ensureLoaded(language: string): Promise<void> {
    if (this.translations.has(language)) {
      return;
    }

    try {
      const response = await fetch(`assets/i18n/${language}.json`);
      if (!response.ok) {
        throw new Error(`Could not load translations for ${language}`);
      }

      this.translations.set(language, await response.json());
    } catch (error) {
      console.error(error);
      this.translations.set(language, {});
    }
  }

  private resolveKey(
    dictionary: TranslationDictionary | undefined,
    key: string
  ): string | TranslationDictionary | null {
    if (!dictionary) {
      return null;
    }

    return key.split('.').reduce<string | TranslationDictionary | null>((current, segment) => {
      if (!current || typeof current === 'string') {
        return null;
      }

      return current[segment] ?? null;
    }, dictionary);
  }
}
