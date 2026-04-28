import { remote } from 'webdriverio';
import chromedriver from 'chromedriver';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';

const {
  APPIUM_HOST = '127.0.0.1',
  APPIUM_PORT = '4723',
  ANDROID_APP_PACKAGE = 'io.ionic.starter',
  ANDROID_APP_ACTIVITY = 'io.ionic.starter.MainActivity',
  CHROMEDRIVER_DIR,
} = process.env;

const CHROMEDRIVER_EXECUTABLE = process.env.CHROMEDRIVER_EXECUTABLE || chromedriver.path;



const testUser = {
  fullName: `Appium User ${Date.now()}`,
  email: `appium-${Date.now()}@example.com`,
  password: 'Appium123!',
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
      browser.execute(() => {
        return document.readyState === 'complete' && !!document.querySelector('ion-app');
      }),
    {
      timeout: 15000,
      timeoutMsg: 'Ionic app did not mount.',
    }
  );
};

const navigateToRegister = async () => {
  await browser.execute(() => {
    if (window.location.pathname === '/register') {
      return;
    }

    history.pushState({}, '', '/register');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await browser.waitUntil(
    async () => {
      const location = await getCurrentLocation();
      return location.pathname === '/register';
    },
    {
      timeout: 10000,
      timeoutMsg: 'Navigation to register route did not start.',
    }
  );
};

const waitForRegisterPage = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        return !!document.querySelector('[data-testid="register-login-section"]');
      }),
    {
      timeout: 15000,
      timeoutMsg: 'Register page did not render.',
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
        element.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, composed: true, detail: { value: nextValue } }));
        element.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, composed: true, detail: { value: nextValue } }));
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

const fillRegisterForm = async () => {
  const submitButton = await browser.$('[data-testid="register-submit"]');

  await setIonInputValue('register-full-name', testUser.fullName);
  await setIonInputValue('register-email', testUser.email);
  await setIonInputValue('register-password', testUser.password);
  await submitButton.waitForDisplayed({ timeout: 15000 });
  await submitButton.click();
};

const collectFailureContext = async () => {
  const [url, contexts, location] = await Promise.all([
    browser.getUrl().catch(() => 'unavailable'),
    browser.getContexts().catch(() => []),
    getCurrentLocation().catch(() => ({ href: 'unavailable', origin: 'unavailable', pathname: 'unavailable', hash: 'unavailable', readyState: 'unavailable' })),
  ]);

  let readyMarkers = {};
  try {
    readyMarkers = await browser.execute(() => ({
      registerSection: Boolean(document.querySelector('[data-testid="register-login-section"]')),
      fullName: Boolean(document.querySelector('[data-testid="register-full-name"]')),
      email: Boolean(document.querySelector('[data-testid="register-email"]')),
      password: Boolean(document.querySelector('[data-testid="register-password"]')),
      submit: Boolean(document.querySelector('[data-testid="register-submit"]')),
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
  await waitForWebView();
  await waitForAppReady();
  await navigateToRegister();
  await waitForRegisterPage();
  await fillRegisterForm();

  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/login'),
    {
      timeout: 15000,
      timeoutMsg: 'Register flow did not navigate to /login.',
    }
  );

  console.log(`Register E2E passed for ${testUser.email}`);
} catch (error) {
  const failureContext = await collectFailureContext().catch(() => null);
  if (failureContext) {
    console.error('Register E2E failure context:', JSON.stringify(failureContext));
  }
  throw error;
} finally {
  await browser.deleteSession();
}
