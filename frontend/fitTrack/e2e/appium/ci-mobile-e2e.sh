#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PROJECT_DIR}"

sleep 10

echo "=== Connected devices ==="
adb devices

echo "=== Installing app ==="
(
  cd android
  ./gradlew app:installDebug --stacktrace
)

echo "=== Ensuring Chrome is available ==="
adb shell cmd package install-existing com.android.chrome || true
adb shell settings put global webview_provider com.android.chrome || true

sleep 5

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

echo "=== Starting Appium ==="
npx appium --port 4725 --allow-insecure chromedriver_autodownload > /tmp/appium.log 2>&1 &
APPIUM_PID=$!

cleanup() {
  kill "${APPIUM_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "=== Waiting for Appium ==="
APPium_WAIT_SECONDS=60
APPium_WAIT_ELAPSED=0
until curl -fsS http://localhost:4725/status | grep -q '"ready":true'; do
  APPium_WAIT_ELAPSED=$((APPium_WAIT_ELAPSED + 2))
  if [ "${APPium_WAIT_ELAPSED}" -ge "${APPium_WAIT_SECONDS}" ]; then
    echo "Appium did not become ready within ${APPium_WAIT_SECONDS} seconds"
    exit 1
  fi
  sleep 2
done

echo "=== Running E2E tests ==="
APPIUM_PORT=4725 npm run test:e2e:register
