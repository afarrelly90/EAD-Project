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
  fullName: `Appium Home User ${Date.now()}`,
  email: `appium-home-${Date.now()}@example.com`,
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

const ensureHomeUserSession = async () => {
  const registerResponse = await fetch(`${API_BASE_URL}/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  if (!registerResponse.ok) {
    const registerMessage = await registerResponse.text();
    if (!(registerResponse.status === 400 && registerMessage.includes('Email already exists'))) {
      throw new Error(`Failed to create home test user: ${registerResponse.status} ${registerMessage}`);
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
    throw new Error(`Failed to log in home test user: ${loginResponse.status} ${loginMessage}`);
  }

  return loginResponse.json();
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

const navigateToHome = async () => {
  await browser.execute(() => {
    if (window.location.pathname === '/home') {
      return;
    }

    history.pushState({}, '', '/home');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await browser.waitUntil(
    async () => {
      const location = await getCurrentLocation();
      return location.pathname === '/home';
    },
    {
      timeout: 10000,
      timeoutMsg: 'Navigation to home route did not start.',
    }
  );
};

const waitForHomePage = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        return (
          !!document.querySelector('[data-testid="home-title"]') &&
          !!document.querySelector('[data-testid="home-create-action"]') &&
          !!document.querySelector('[data-testid="home-exercises-section"]')
        );
      }),
    {
      timeout: 15000,
      timeoutMsg: 'Home page did not render.',
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
      title: Boolean(document.querySelector('[data-testid="home-title"]')),
      createAction: Boolean(document.querySelector('[data-testid="home-create-action"]')),
      exercisesSection: Boolean(document.querySelector('[data-testid="home-exercises-section"]')),
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
  const session = await ensureHomeUserSession();
  await waitForWebView();
  await waitForAppReady();
  await injectSession(session);
  await navigateToHome();
  await waitForHomePage();

  console.log(`Home E2E passed for ${testUser.email}`);
} catch (error) {
  const failureContext = await collectFailureContext().catch(() => null);
  if (failureContext) {
    console.error('Home E2E failure context:', JSON.stringify(failureContext));
  }
  throw error;
} finally {
  await browser.deleteSession();
}
