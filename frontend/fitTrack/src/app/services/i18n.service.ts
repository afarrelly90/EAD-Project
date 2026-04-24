import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import enTranslations from '../../assets/i18n/en.json';
import itTranslations from '../../assets/i18n/it.json';

interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly storageKey = 'language';
  private readonly fallbackLanguage = 'en';
  private readonly translations = new Map<string, TranslationDictionary>([
    ['en', enTranslations as TranslationDictionary],
    ['it', itTranslations as TranslationDictionary],
  ]);
  private readonly currentLanguageSubject = new BehaviorSubject<string>(
    this.fallbackLanguage
  );

  readonly languageChanges = this.currentLanguageSubject.asObservable();

  init(): void {
    this.use(this.detectInitialLanguage());
  }

  setLanguage(language: string): void {
    this.use(language);
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

  private use(language: string): void {
    const normalizedLanguage = this.normalizeLanguage(language);

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
