import { remote } from 'webdriverio';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';

const {
  APPIUM_HOST = '127.0.0.1',
  APPIUM_PORT = '4723',
  ANDROID_APP_PACKAGE = 'io.ionic.starter',
  ANDROID_APP_ACTIVITY = 'io.ionic.starter.MainActivity',
  CHROMEDRIVER_DIR,
  CHROMEDRIVER_EXECUTABLE,
} = process.env;

const defaultChromedriverDir = fileURLToPath(new URL('./chromedrivers/', import.meta.url));
const resolvedChromedriverDir = CHROMEDRIVER_DIR ?? defaultChromedriverDir;
const hasLocalChromedriverDir =
  existsSync(resolvedChromedriverDir) &&
  readdirSync(resolvedChromedriverDir).some((entry) => !entry.startsWith('.'));

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
      : hasLocalChromedriverDir
        ? { 'appium:chromedriverExecutableDir': resolvedChromedriverDir }
        : {}),
  },
});

const getWebviewContext = async () => {
  const contexts = await browser.getContexts();
  return contexts.find((context) => context.startsWith('WEBVIEW'));
};

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

const waitForRegisterPage = async () => {
  await browser.url('/register');

  const registerSection = await browser.$('[data-testid="register-login-section"]');

  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes('/register') && (await registerSection.isDisplayed());
    },
    {
      timeout: 15000,
      timeoutMsg: 'Register page did not finish rendering.',
    }
  );
};

const setIonInputValue = async (testId, value) => {
  const host = await browser.$(`[data-testid="${testId}"]`);
  await host.waitForDisplayed({ timeout: 15000 });

  await browser.execute((element, nextValue) => {
    const input = element.shadowRoot?.querySelector('input');

    if (input) {
      input.focus();
      input.value = nextValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.blur();
    }

    element.value = nextValue;
    element.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: nextValue } }));
    element.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: nextValue } }));
  }, host, value);

  await browser.waitUntil(
    async () =>
      browser.execute((element) => {
        const input = element.shadowRoot?.querySelector('input');
        return String(input?.value ?? element.value ?? '');
      }, host) === value,
    {
      timeout: 5000,
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
  const [url, contexts] = await Promise.all([
    browser.getUrl().catch(() => 'unavailable'),
    browser.getContexts().catch(() => []),
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
    }));
  } catch {
    readyMarkers = { inspectable: false };
  }

  return { url, contexts, readyMarkers };
};

try {
  await waitForWebView();
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
