import { remote } from 'webdriverio';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';

const {
  APPIUM_HOST = '127.0.0.1',
  APPIUM_PORT = '4723',
  ANDROID_APP_PACKAGE = 'io.ionic.starter',
  ANDROID_APP_ACTIVITY = 'io.ionic.starter.MainActivity',
  API_BASE_URL = 'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api',
  CHROMEDRIVER_DIR,
  CHROMEDRIVER_EXECUTABLE,
} = process.env;

const defaultChromedriverDir = fileURLToPath(new URL('./chromedrivers/', import.meta.url));
const resolvedChromedriverDir = CHROMEDRIVER_DIR ?? defaultChromedriverDir;
const hasLocalChromedriverDir =
  existsSync(resolvedChromedriverDir) &&
  readdirSync(resolvedChromedriverDir).some((entry) => !entry.startsWith('.'));

const testUser = {
  fullName: `Appium Timer User ${Date.now()}`,
  email: `appium-timer-${Date.now()}@example.com`,
  password: 'Appium123!',
  language: 'en',
};

const browser = await remote({
  hostname: APPIUM_HOST,
  port: Number(APPIUM_PORT),
  path: '/',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:appPackage': ANDROID_APP_PACKAGE,
    'appium:appActivity': ANDROID_APP_ACTIVITY,
    'appium:noReset': true,
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 240,
    'appium:chromedriverAutodownload': true,
    'appium:waitForWebviewMs': 10000,
    ...(CHROMEDRIVER_EXECUTABLE
      ? { 'appium:chromedriverExecutable': CHROMEDRIVER_EXECUTABLE }
      : hasLocalChromedriverDir
        ? { 'appium:chromedriverExecutableDir': resolvedChromedriverDir }
        : {}),
  },
});

const ensureTimerUserSession = async () => {
  const registerResponse = await fetch(`${API_BASE_URL}/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  if (!registerResponse.ok) {
    const registerMessage = await registerResponse.text();
    if (!(registerResponse.status === 400 && registerMessage.includes('Email already exists'))) {
      throw new Error(`Failed to create timer test user: ${registerResponse.status} ${registerMessage}`);
    }
  }

  const loginResponse = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  });

  if (!loginResponse.ok) {
    const loginMessage = await loginResponse.text();
    throw new Error(`Failed to log in timer test user: ${loginResponse.status} ${loginMessage}`);
  }

  const exercisesResponse = await fetch(`${API_BASE_URL}/Exercises`);
  if (!exercisesResponse.ok) {
    const exercisesMessage = await exercisesResponse.text();
    throw new Error(`Failed to load exercises for timer test: ${exercisesResponse.status} ${exercisesMessage}`);
  }

  const exercises = await exercisesResponse.json();
  const exercise = exercises.find((item) => item && item.id);

  if (!exercise) {
    throw new Error('No exercise available for timer E2E.');
  }

  return {
    session: await loginResponse.json(),
    exerciseId: exercise.id,
  };
};

const getWebviewContext = async () => {
  const contexts = await browser.getContexts();
  return contexts.find((context) => context.startsWith('WEBVIEW'));
};

const getCurrentLocation = async () =>
  browser.execute(() => ({
    href: window.location.href,
    pathname: window.location.pathname,
    hash: window.location.hash,
    readyState: document.readyState,
  }));

const waitForWebView = async () => {
  await browser.waitUntil(
    async () => Boolean(await getWebviewContext()),
    {
      timeout: 20000,
      timeoutMsg: 'WEBVIEW context did not become available.',
    }
  );

  const webviewContext = await getWebviewContext();

  if (!webviewContext) {
    throw new Error('Could not find a WEBVIEW context.');
  }

  await browser.switchContext(webviewContext);
};

const waitForAppReady = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => document.readyState === 'complete' && !!document.querySelector('ion-app')),
    {
      timeout: 15000,
      timeoutMsg: 'Ionic app did not mount.',
    }
  );
};

const injectSession = async (session) => {
  await browser.execute((response) => {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('language', response.user.language || 'en');
  }, session);
};

const navigateToTimer = async (exerciseId) => {
  await browser.execute((id) => {
    const targetPath = `/exercises/${id}/workout`;
    if (window.location.pathname === targetPath) {
      return;
    }

    history.pushState({}, '', targetPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, exerciseId);

  await browser.waitUntil(
    async () => {
      const location = await getCurrentLocation();
      return location.pathname === `/exercises/${exerciseId}/workout`;
    },
    {
      timeout: 10000,
      timeoutMsg: 'Navigation to timer route did not start.',
    }
  );
};

const waitForTimerPage = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        return (
          !!document.querySelector('[data-testid="timer-title"]') &&
          !!document.querySelector('[data-testid="timer-primary-button"]') &&
          !!document.querySelector('[data-testid="timer-countdown"]')
        );
      }),
    {
      timeout: 15000,
      timeoutMsg: 'Timer page did not render.',
    }
  );
};

const startTimer = async () => {
  const primaryButton = await browser.$('[data-testid="timer-primary-button"]');
  const resetButton = await browser.$('[data-testid="timer-reset-button"]');
  const countdown = await browser.$('[data-testid="timer-countdown"]');

  await primaryButton.waitForDisplayed({ timeout: 15000 });
  const initialCountdown = await countdown.getText();
  await primaryButton.click();

  await browser.waitUntil(
    async () => {
      const [primaryDisabled, resetDisabled, currentCountdown] = await Promise.all([
        primaryButton.getAttribute('disabled'),
        resetButton.getAttribute('disabled'),
        countdown.getText(),
      ]);

      return (
        primaryDisabled !== null ||
        resetDisabled === null ||
        (currentCountdown.trim().length > 0 && currentCountdown !== initialCountdown)
      );
    },
    {
      timeout: 5000,
      timeoutMsg: 'Timer did not start after clicking the primary button.',
    }
  );
};

const collectFailureContext = async () => {
  const [url, contexts, location] = await Promise.all([
    browser.getUrl().catch(() => 'unavailable'),
    browser.getContexts().catch(() => []),
    getCurrentLocation().catch(() => ({
      href: 'unavailable',
      pathname: 'unavailable',
      hash: 'unavailable',
      readyState: 'unavailable',
    })),
  ]);

  let readyMarkers = {};
  try {
    readyMarkers = await browser.execute(() => ({
      hero: Boolean(document.querySelector('[data-testid="timer-hero"]')),
      title: Boolean(document.querySelector('[data-testid="timer-title"]')),
      countdown: Boolean(document.querySelector('[data-testid="timer-countdown"]')),
      primaryButton: Boolean(document.querySelector('[data-testid="timer-primary-button"]')),
      resetButton: Boolean(document.querySelector('[data-testid="timer-reset-button"]')),
      pathname: window.location.pathname,
      hash: window.location.hash,
      pageTitle: document.title,
      ionApp: Boolean(document.querySelector('ion-app')),
    }));
  } catch {
    readyMarkers = { inspectable: false };
  }

  return { url, contexts, location, readyMarkers };
};

try {
  const { session, exerciseId } = await ensureTimerUserSession();
  await waitForWebView();
  await waitForAppReady();
  await injectSession(session);
  await navigateToTimer(exerciseId);
  await waitForTimerPage();
  await startTimer();

  console.log(`Timer E2E passed for ${testUser.email}`);
} catch (error) {
  const failureContext = await collectFailureContext().catch(() => null);
  if (failureContext) {
    console.error('Timer E2E failure context:', JSON.stringify(failureContext));
  }
  throw error;
} finally {
  await browser.deleteSession();
}
