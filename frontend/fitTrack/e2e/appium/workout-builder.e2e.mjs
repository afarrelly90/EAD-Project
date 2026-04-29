import { remote } from 'webdriverio';
import chromedriver from 'chromedriver';

const {
  APPIUM_HOST = '127.0.0.1',
  APPIUM_PORT = '4723',
  ANDROID_APP_PACKAGE = 'io.ionic.starter',
  ANDROID_APP_ACTIVITY = 'io.ionic.starter.MainActivity',
  API_BASE_URL = 'https://fittrack-api-dga8g5dfabbyf4fv.francecentral-01.azurewebsites.net/api',
} = process.env;

const CHROMEDRIVER_EXECUTABLE = process.env.CHROMEDRIVER_EXECUTABLE || chromedriver.path;

const suffix = Date.now();
const testUser = {
  fullName: `Appium Builder User ${suffix}`,
  email: `appium-builder-${suffix}@example.com`,
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

const builderExercises = [
  {
    title: `Builder Crunch ${suffix}`,
    description: 'Appium test exercise for guided workout generation.',
    calories: 40,
    isCore: true,
    isUpperBody: false,
    isLowerBody: false,
    difficulty: 'Beginner',
    durationMinutes: 6,
    equipment: null,
  },
  {
    title: `Builder Bicycle ${suffix}`,
    description: 'Appium test exercise for guided workout generation.',
    calories: 55,
    isCore: true,
    isUpperBody: false,
    isLowerBody: false,
    difficulty: 'Beginner',
    durationMinutes: 7,
    equipment: null,
  },
  {
    title: `Builder Hollow Hold ${suffix}`,
    description: 'Appium test exercise for guided workout generation.',
    calories: 60,
    isCore: true,
    isUpperBody: false,
    isLowerBody: false,
    difficulty: 'Beginner',
    durationMinutes: 8,
    equipment: null,
  },
];

const ensureWorkoutBuilderSession = async () => {
  const registerResponse = await fetch(`${API_BASE_URL}/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  if (!registerResponse.ok) {
    const registerMessage = await registerResponse.text();
    if (!(registerResponse.status === 400 && registerMessage.includes('Email already exists'))) {
      throw new Error(
        `Failed to create workout builder test user: ${registerResponse.status} ${registerMessage}`
      );
    }
  }

  for (const exercise of builderExercises) {
    const response = await fetch(`${API_BASE_URL}/Exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Failed to create builder seed exercise: ${response.status} ${message}`);
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
    throw new Error(`Failed to log in workout builder test user: ${loginResponse.status} ${loginMessage}`);
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
  await browser.waitUntil(async () => Boolean(await getWebviewContext()), {
    timeout: 20000,
    timeoutMsg: 'WEBVIEW context did not become available.',
  });

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
    localStorage.clear();
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('language', response.user.language || 'en');
    localStorage.removeItem('generated-workout');
  }, session);
};

const navigateToPath = async (targetPath) => {
  await browser.execute((path) => {
    if (window.location.pathname === path) {
      return;
    }

    history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);

  await browser.waitUntil(
    async () => {
      const location = await getCurrentLocation();
      return location.pathname === targetPath;
    },
    {
      timeout: 10000,
      timeoutMsg: `Navigation to ${targetPath} route did not start.`,
    }
  );
};

const waitForBuilderPage = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        const title = document.querySelector('[data-testid="builder-title"]');
        const button = document.querySelector('[data-testid="builder-generate-button"]');
        return Boolean(title && button);
      }),
    {
      timeout: 15000,
      timeoutMsg: 'Workout builder page did not render.',
    }
  );

  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        const button = document.querySelector('[data-testid="builder-generate-button"]');
        if (!button) {
          return false;
        }

        const isDisabled =
          button.hasAttribute('disabled') ||
          button.getAttribute('aria-disabled') === 'true' ||
          button.disabled === true;

        return !isDisabled;
      }),
    {
      timeout: 15000,
      timeoutMsg: 'Workout builder generate button never became enabled.',
    }
  );
};

const generateWorkout = async () => {
  const button = await browser.$('[data-testid="builder-generate-button"]');
  await button.waitForDisplayed({ timeout: 15000 });
  await button.click();

  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        const preview = document.querySelector('[data-testid="builder-preview"]');
        const cards = document.querySelectorAll('[data-testid="builder-exercise-card"]');
        return Boolean(preview) && cards.length >= 2;
      }),
    {
      timeout: 15000,
      timeoutMsg: 'Generated workout preview did not render with multiple exercises.',
    }
  );
};

const startGuidedWorkout = async () => {
  const startGuidedButton = await browser.$('[data-testid="builder-start-guided-button"]');
  await startGuidedButton.waitForDisplayed({ timeout: 15000 });
  await startGuidedButton.click();

  await browser.waitUntil(
    async () => {
      const location = await getCurrentLocation();
      return location.pathname === '/workouts/guided';
    },
    {
      timeout: 10000,
      timeoutMsg: 'Did not navigate to guided workout page.',
    }
  );
};

const waitForGuidedWorkoutPage = async () => {
  await browser.waitUntil(
    async () =>
      browser.execute(() => {
        return (
          !!document.querySelector('[data-testid="guided-workout-title"]') &&
          !!document.querySelector('[data-testid="guided-workout-start-button"]') &&
          !!document.querySelector('[data-testid="guided-workout-countdown"]')
        );
      }),
    {
      timeout: 15000,
      timeoutMsg: 'Guided workout page did not render.',
    }
  );
};

const runGuidedWorkout = async () => {
  const startButton = await browser.$('[data-testid="guided-workout-start-button"]');
  const countdown = await browser.$('[data-testid="guided-workout-countdown"]');
  const initialCountdown = await countdown.getText();

  await startButton.waitForDisplayed({ timeout: 15000 });
  await startButton.click();

  await browser.waitUntil(
    async () => {
      const [currentCountdown, startDisabled, startAriaDisabled] = await Promise.all([
        countdown.getText(),
        startButton.getAttribute('disabled'),
        startButton.getAttribute('aria-disabled'),
      ]);

      return (
        currentCountdown !== initialCountdown ||
        startDisabled !== null ||
        startAriaDisabled === 'true'
      );
    },
    {
      timeout: 7000,
      timeoutMsg: 'Guided workout timer did not start.',
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
      builderTitle: Boolean(document.querySelector('[data-testid="builder-title"]')),
      builderPreview: Boolean(document.querySelector('[data-testid="builder-preview"]')),
      builderCards: document.querySelectorAll('[data-testid="builder-exercise-card"]').length,
      guidedTitle: Boolean(document.querySelector('[data-testid="guided-workout-title"]')),
      guidedCountdown: Boolean(document.querySelector('[data-testid="guided-workout-countdown"]')),
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
  const session = await ensureWorkoutBuilderSession();
  await waitForWebView();
  await waitForAppReady();
  await injectSession(session);
  await navigateToPath('/workouts/build');
  await waitForBuilderPage();
  await generateWorkout();
  await startGuidedWorkout();
  await waitForGuidedWorkoutPage();
  await runGuidedWorkout();

  console.log(`Workout Builder E2E passed for ${testUser.email}`);
} catch (error) {
  const failureContext = await collectFailureContext().catch(() => null);
  if (failureContext) {
    console.error('Workout Builder E2E failure context:', JSON.stringify(failureContext));
  }
  throw error;
} finally {
  await browser.deleteSession();
}
