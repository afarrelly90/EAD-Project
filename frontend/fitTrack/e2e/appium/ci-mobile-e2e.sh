#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_DIR="$(cd "${PROJECT_DIR}/../.." && pwd)"

cd "${PROJECT_DIR}"

sleep 10

echo "=== Starting local backend ==="
ASPNETCORE_ENVIRONMENT=Development \
ASPNETCORE_URLS=http://0.0.0.0:5240 \
dotnet run --no-restore --project "${REPO_DIR}/backend/fitTrackBackend/fitTrackBackend.csproj" > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "=== Connected devices ==="
adb devices

echo "=== Installing app ==="
(
  cd android
  ./gradlew app:installDebug --stacktrace
)

echo "=== Ensuring Chrome is available ==="
adb shell cmd package install-existing com.android.chrome || true

echo "=== Setting Chrome as WebView ==="
adb shell settings put global webview_provider com.android.chrome || true

adb shell am force-stop com.android.chrome || true
adb shell am force-stop com.google.android.webview || true

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
CHROME_MAJOR="$(echo "${WEBVIEW_VERSION}" | cut -d. -f1)"
CHROME_BUILD="$(echo "${WEBVIEW_VERSION}" | cut -d. -f1-3)"

echo "=== Resolving Chromedriver ==="
if [ "${CHROME_MAJOR}" -ge 115 ]; then
  export CHROME_BUILD
  python3 -c "import json, os, urllib.request; build=os.environ['CHROME_BUILD']; url='https://googlechromelabs.github.io/chrome-for-testing/latest-patch-versions-per-build-with-downloads.json'; data=json.load(urllib.request.urlopen(url)); downloads=data.get('builds', {}).get(build, {}).get('downloads', {}).get('chromedriver', []); linux=next((item['url'] for item in downloads if item['platform']=='linux64'), None); linux or (_ for _ in ()).throw(SystemExit(f'No linux64 chromedriver found for Chrome build {build}')); open('/tmp/chromedriver-url.txt', 'w', encoding='utf-8').write(linux)"
else
  case "${CHROME_MAJOR}" in
    91) CHROMEDRIVER_VERSION="91.0.4472.101" ;;
    *) echo "No pinned legacy Chromedriver configured for Chrome major ${CHROME_MAJOR}"; exit 1 ;;
  esac
  CHROMEDRIVER_URL="https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
  printf '%s' "${CHROMEDRIVER_URL}" > /tmp/chromedriver-url.txt
fi

CHROMEDRIVER_URL="$(cat /tmp/chromedriver-url.txt)"
echo "Using Chromedriver URL: ${CHROMEDRIVER_URL}"
curl -fsSL "${CHROMEDRIVER_URL}" -o /tmp/chromedriver.zip
unzip -oq /tmp/chromedriver.zip -d /tmp/chromedriver

CHROMEDRIVER_BIN="$(find /tmp/chromedriver -type f -name chromedriver | head -n 1)"
if [ -z "${CHROMEDRIVER_BIN}" ]; then
  echo "Chromedriver binary not found after download"
  exit 1
fi
chmod +x "${CHROMEDRIVER_BIN}"

echo "=== Starting Appium ==="
npx appium --port 4725 --allow-insecure chromedriver_autodownload > /tmp/appium.log 2>&1 &
APPIUM_PID=$!

cleanup() {
  kill "${BACKEND_PID}" >/dev/null 2>&1 || true
  kill "${APPIUM_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "=== Waiting for backend ==="
BACKEND_WAIT_SECONDS=60
BACKEND_WAIT_ELAPSED=0
until curl -fsS http://localhost:5240/swagger/index.html >/dev/null; do
  BACKEND_WAIT_ELAPSED=$((BACKEND_WAIT_ELAPSED + 2))
  if [ "${BACKEND_WAIT_ELAPSED}" -ge "${BACKEND_WAIT_SECONDS}" ]; then
    echo "Backend did not become ready within ${BACKEND_WAIT_SECONDS} seconds"
    cat /tmp/backend.log || true
    exit 1
  fi
  sleep 2
done

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

echo "=== Running login E2E ==="
APPIUM_PORT=4725 API_BASE_URL=http://localhost:5240/api CHROMEDRIVER_EXECUTABLE="${CHROMEDRIVER_BIN}" npm run test:e2e:login

echo "=== Running register E2E ==="
APPIUM_PORT=4725 API_BASE_URL=http://localhost:5240/api CHROMEDRIVER_EXECUTABLE="${CHROMEDRIVER_BIN}" npm run test:e2e:register

echo "=== Running home E2E ==="
APPIUM_PORT=4725 API_BASE_URL=http://localhost:5240/api CHROMEDRIVER_EXECUTABLE="${CHROMEDRIVER_BIN}" npm run test:e2e:home

echo "=== Running timer E2E ==="
APPIUM_PORT=4725 API_BASE_URL=http://localhost:5240/api CHROMEDRIVER_EXECUTABLE="${CHROMEDRIVER_BIN}" npm run test:e2e:timer

echo "=== Running workout builder E2E ==="
APPIUM_PORT=4725 API_BASE_URL=http://localhost:5240/api CHROMEDRIVER_EXECUTABLE="${CHROMEDRIVER_BIN}" npm run test:e2e:workout-builder
