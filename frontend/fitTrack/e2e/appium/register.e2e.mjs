import { remote } from 'webdriverio';
import { fileURLToPath } from 'node:url';

const {
  APPIUM_HOST = '127.0.0.1',
  APPIUM_PORT = '4723',
  ANDROID_APP_PACKAGE = 'io.ionic.starter',
  ANDROID_APP_ACTIVITY = 'io.ionic.starter.MainActivity',
  CHROMEDRIVER_DIR = fileURLToPath(new URL('./chromedrivers/', import.meta.url)),
  CHROMEDRIVER_EXECUTABLE,
} = process.env;

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
      : { 'appium:chromedriverExecutableDir': CHROMEDRIVER_DIR }),
  },
});

const waitForWebView = async () => {
  await browser.waitUntil(
    async () => {
      const contexts = await browser.getContexts();
      return contexts.some((context) => context.startsWith('WEBVIEW'));
    },
    {
      timeout: 20000,
      timeoutMsg: 'WEBVIEW context did not become available.',
    }
  );

  const contexts = await browser.getContexts();
  const webviewContext = contexts.find((context) => context.startsWith('WEBVIEW'));

  if (!webviewContext) {
    throw new Error('Could not find a WEBVIEW context.');
  }

  await browser.switchContext(webviewContext);
};

const fillRegisterForm = async () => {
  const fullNameInput = await browser.$('[data-testid="register-full-name"] input');
  const emailInput = await browser.$('[data-testid="register-email"] input');
  const passwordInput = await browser.$('[data-testid="register-password"] input');
  const submitButton = await browser.$('[data-testid="register-submit"]');

  await fullNameInput.waitForDisplayed({ timeout: 15000 });
  await fullNameInput.setValue(testUser.fullName);
  await emailInput.setValue(testUser.email);
  await passwordInput.setValue(testUser.password);
  await submitButton.click();
};

try {
  await waitForWebView();
  await browser.url('/register');
  await fillRegisterForm();

  await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/login'),
    {
      timeout: 15000,
      timeoutMsg: 'Register flow did not navigate to /login.',
    }
  );

  console.log(`Register E2E passed for ${testUser.email}`);
} finally {
  await browser.deleteSession();
}
