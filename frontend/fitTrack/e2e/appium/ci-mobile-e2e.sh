#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PROJECT_DIR}"

# The emulator action has already waited for Android boot before calling us.
sleep 10

echo "=== Connected devices ==="
adb devices

echo "=== Installing app ==="
(
  cd android
  ./gradlew app:installDebug --stacktrace
)

echo "=== Detecting WebView version ==="
WEBVIEW_VERSION="$(adb shell dumpsys package com.google.android.webview | sed -n 's/.*versionName=//p' | head -n 1 | tr -d '\r')"
if [ -z "${WEBVIEW_VERSION}" ]; then
  WEBVIEW_VERSION="$(adb shell dumpsys package com.android.chrome | sed -n 's/.*versionName=//p' | head -n 1 | tr -d '\r')"
fi

if [ -z "${WEBVIEW_VERSION}" ]; then
  echo "Could not detect Android WebView/Chrome version"
  exit 1
fi

echo "Detected WebView version: ${WEBVIEW_VERSION}"
export CHROME_BUILD
CHROME_BUILD="$(echo "${WEBVIEW_VERSION}" | cut -d. -f1-3)"


echo "=== Starting Appium ==="
npx appium --port 4725 --allow-insecure chromedriver_autodownload > /tmp/appium.log 2>&1 &
APPIUM_PID=$!

cleanup() {
  kill "${APPIUM_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "=== Waiting for Appium ==="
sleep 10
curl -fsS http://localhost:4725/status > /tmp/appium-status.json

echo "=== Running E2E tests ==="
APPIUM_PORT=4725 npm run test:e2e:register