import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    service = new I18nService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should default to English and translate known keys', () => {
    expect(service.currentLanguage).toBe('en');
    expect(service.translate('auth.login.submit')).toBe('Log In');
  });

  it('should normalize and store the selected language', () => {
    service.setLanguage('it-IT');

    expect(service.currentLanguage).toBe('it');
    expect(localStorage.getItem('language')).toBe('it');
    expect(service.translate('auth.login.submit')).toBe('Accedi');
  });

  it('should fall back to English for unsupported languages', () => {
    service.setLanguage('fr-FR');

    expect(service.currentLanguage).toBe('en');
    expect(service.translate('auth.login.submit')).toBe('Log In');
  });

  it('should interpolate translation parameters', () => {
    const text = service.translate('home.daily_goal_description', { minutes: 25 });

    expect(text).toContain('25');
    expect(text).toContain('minutes');
  });

  it('should replace missing interpolation params with empty strings', () => {
    const text = service.translate('home.daily_goal_description');

    expect(text).not.toContain('{{');
    expect(text).toContain('minutes today.');
  });

  it('should return the key when the translation resolves to an object', () => {
    expect(service.translate('auth.login')).toBe('auth.login');
  });

  it('should fall back to the English dictionary when the current language misses a key', () => {
    const translations = (service as any).translations as Map<string, Record<string, unknown>>;
    (translations.get('en') as Record<string, unknown>)['branch_test'] = {
      fallback_value: 'English fallback value',
    };
    (translations.get('it') as Record<string, unknown>)['branch_test'] = {};

    service.setLanguage('it');

    expect(service.translate('branch_test.fallback_value')).toBe('English fallback value');
  });

  it('should initialize from a stored language value', () => {
    localStorage.setItem('language', 'it');

    service.init();

    expect(service.currentLanguage).toBe('it');
  });

  it('should initialize from the stored user language when no explicit language exists', () => {
    localStorage.setItem('user', JSON.stringify({ language: 'it' }));

    service.init();

    expect(service.currentLanguage).toBe('it');
  });

  it('should initialize from navigator language when storage is empty', () => {
    spyOnProperty(window.navigator, 'language', 'get').and.returnValue('it-IE');

    service.init();

    expect(service.currentLanguage).toBe('it');
  });

  it('should ignore invalid stored user JSON and fall back to navigator language', () => {
    localStorage.setItem('user', '{not valid json');
    spyOnProperty(window.navigator, 'language', 'get').and.returnValue('en-US');

    service.init();

    expect(service.currentLanguage).toBe('en');
  });
});
