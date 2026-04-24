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
  fullName: `Appium Login User ${Date.now()}`,
  email: `appium-login-${Date.now()}@example.com`,
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

const ensureLoginUser = async () => {
  const response = await fetch(`${API_BASE_URL}/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  if (response.ok) {
    return;
  }

  const message = await response.text();
  if (response.status === 400 && message.includes('Email already exists')) {
    return;
  }

  throw new Error(`Failed to create login test user: ${response.status} ${message}`);
};

const getWebviewContext = async () => {
  const contexts = await browser.getContexts();
  return contexts.find((context) => context.startsWith('WEBVIEW'));
};

const getCurrentLocation = async () =>
  browser.execute(() => ({
    href: window.location.href,
    origin: window.location.origin,
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

const navigateToLogin = async () => {
  await browser.execute(() => {
    if (window.location.pathname === '/login') {
      return;
    }

    history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await browser.waitUntil(
    async () => {
      const location = await getCurrentLocation();
      return location.pathname === '/login';
    },
    {
      timeout: 10000,
      timeoutMsg: 'Navigation to login route did not start.',
    }
  );
};

const waitForLoginPage = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => !!document.querySelector('[data-testid="login-signup-section"]')),
    {
      timeout: 15000,
      timeoutMsg: 'Login page did not render.',
    }
  );
};

const setIonInputValue = async (testId, value) => {
  const host = await browser.$(`[data-testid="${testId}"]`);
  await host.waitForDisplayed({ timeout: 15000 });

  await browser.waitUntil(
    async () => {
      await browser.execute((element, nextValue) => {
        const input = element.shadowRoot?.querySelector('input');

        if (input) {
          input.focus();
          input.value = nextValue;
          input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
          input.blur();
        }

        element.value = nextValue;
        element.dispatchEvent(
          new CustomEvent('ionInput', { bubbles: true, composed: true, detail: { value: nextValue } })
        );
        element.dispatchEvent(
          new CustomEvent('ionChange', { bubbles: true, composed: true, detail: { value: nextValue } })
        );
      }, host, value);

      const currentValue = await browser.execute((element) => {
        const input = element.shadowRoot?.querySelector('input');
        return String(input?.value ?? element.value ?? '');
      }, host);

      return currentValue === value;
    },
    {
      timeout: 5000,
      interval: 250,
      timeoutMsg: `Input "${testId}" did not keep the expected value.`,
    }
  );
};

const fillLoginForm = async () => {
  const submitButton = await browser.$('[data-testid="login-submit"]');

  await setIonInputValue('login-email', testUser.email);
  await setIonInputValue('login-password', testUser.password);
  await submitButton.waitForDisplayed({ timeout: 15000 });
  await submitButton.click();
};

const collectFailureContext = async () => {
  const [url, contexts, location] = await Promise.all([
    browser.getUrl().catch(() => 'unavailable'),
    browser.getContexts().catch(() => []),
    getCurrentLocation().catch(() => ({
      href: 'unavailable',
      origin: 'unavailable',
      pathname: 'unavailable',
      hash: 'unavailable',
      readyState: 'unavailable',
    })),
  ]);

  let readyMarkers = {};
  try {
    readyMarkers = await browser.execute(() => ({
      signupSection: Boolean(document.querySelector('[data-testid="login-signup-section"]')),
      email: Boolean(document.querySelector('[data-testid="login-email"]')),
      password: Boolean(document.querySelector('[data-testid="login-password"]')),
      submit: Boolean(document.querySelector('[data-testid="login-submit"]')),
      title: document.title,
      pathname: window.location.pathname,
      hash: window.location.hash,
      ionApp: Boolean(document.querySelector('ion-app')),
    }));
  } catch {
    readyMarkers = { inspectable: false };
  }

  return { url, contexts, location, readyMarkers };
};

try {
  await ensureLoginUser();
  await waitForWebView();
  await waitForAppReady();
  await navigateToLogin();
  await waitForLoginPage();
  await fillLoginForm();

  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/home'),
    {
      timeout: 15000,
      timeoutMsg: 'Login flow did not navigate to /home.',
    }
  );

  console.log(`Login E2E passed for ${testUser.email}`);
} catch (error) {
  const failureContext = await collectFailureContext().catch(() => null);
  if (failureContext) {
    console.error('Login E2E failure context:', JSON.stringify(failureContext));
  }
  throw error;
} finally {
  await browser.deleteSession();
}
