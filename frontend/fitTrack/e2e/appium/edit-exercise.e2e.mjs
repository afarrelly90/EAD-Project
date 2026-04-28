import { remote } from 'webdriverio';
import chromedriver from 'chromedriver';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';

const {
  APPIUM_HOST = '127.0.0.1',
  APPIUM_PORT = '4723',
  ANDROID_APP_PACKAGE = 'io.ionic.starter',
  ANDROID_APP_ACTIVITY = 'io.ionic.starter.MainActivity',
  API_BASE_URL = 'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api',
  CHROMEDRIVER_DIR,
} = process.env;

const CHROMEDRIVER_EXECUTABLE = process.env.CHROMEDRIVER_EXECUTABLE || chromedriver.path;



const testUser = {
  fullName: `Appium Edit Ex User ${Date.now()}`,
  email: `appium-edit-ex-${Date.now()}@example.com`,
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
      : {}),
  },
});

const ensureUserSession = async () => {
  const registerResponse = await fetch(`${API_BASE_URL}/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  if (!registerResponse.ok) {
    const registerMessage = await registerResponse.text();
    if (!(registerResponse.status === 400 && registerMessage.includes('Email already exists'))) {
      throw new Error(`Failed to create test user: ${registerResponse.status} ${registerMessage}`);
    }
  }

  const loginResponse = await fetch(`${API_BASE_URL}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });

  if (!loginResponse.ok) {
    const loginMessage = await loginResponse.text();
    throw new Error(`Failed to log in test user: ${loginResponse.status} ${loginMessage}`);
  }

  return loginResponse.json();
};

const createTestExercise = async (token) => {
  const response = await fetch(`${API_BASE_URL}/Exercises`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: `E2E Exercise To Edit ${Date.now()}`,
      description: 'Test description',
      calories: 100,
      durationMinutes: 10,
      difficulty: 'Beginner'
    }),
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`Failed to create test exercise: ${response.status} ${msg}`);
  }
  return response.json();
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
    { timeout: 20000, timeoutMsg: 'WEBVIEW context did not become available.' }
  );

  const webviewContext = await getWebviewContext();
  if (!webviewContext) throw new Error('Could not find a WEBVIEW context.');
  await browser.switchContext(webviewContext);
};

const waitForAppReady = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => document.readyState === 'complete' && !!document.querySelector('ion-app')),
    { timeout: 15000, timeoutMsg: 'Ionic app did not mount.' }
  );
};

const injectSession = async (session) => {
  await browser.execute((response) => {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('language', response.user.language || 'en');
  }, session);
};

const navigateToPath = async (targetPath) => {
  await browser.execute((p) => {
    if (window.location.pathname === p) return;
    history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);

  await browser.waitUntil(
    async () => {
      const location = await getCurrentLocation();
      return location.pathname === targetPath;
    },
    { timeout: 10000, timeoutMsg: `Navigation to ${targetPath} route did not start.` }
  );
};

const waitForEditExercisePage = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        return (
          !!document.querySelector('[data-testid="edit-exercise-title"]') &&
          !!document.querySelector('[data-testid="edit-exercise-submit"]')
        );
      }),
    { timeout: 15000, timeoutMsg: 'Edit Exercise page did not render correctly.' }
  );
};

const testSubmitForm = async () => {
  await browser.execute(() => {
    document.querySelector('[data-testid="edit-exercise-submit"]').click();
  });
  
  // Wait for navigation away from edit page or something indicating success
  // Usually it routes back to /exercises/{id}
  await browser.waitUntil(
    async () => {
      const location = await getCurrentLocation();
      return location.pathname.startsWith('/exercises/');
    },
    { timeout: 10000, timeoutMsg: `Navigation back to exercise details did not occur.` }
  );
}

try {
  const session = await ensureUserSession();
  const exercise = await createTestExercise(session.token);
  
  await waitForWebView();
  await waitForAppReady();
  await injectSession(session);
  
  await navigateToPath(`/exercises/${exercise.id}/edit`);
  await waitForEditExercisePage();
  await testSubmitForm();

  console.log(`Edit Exercise E2E passed for exercise ${exercise.id}`);
} catch (error) {
  console.error(error);
  throw error;
} finally {
  await browser.deleteSession();
}
