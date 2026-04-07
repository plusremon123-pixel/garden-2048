@echo off
title Plant 2048 Android Build

set LOGFILE=C:\Users\19002857\Desktop\plant2048\build-android-log.txt
echo Build started: %DATE% %TIME% > %LOGFILE%

set NODEJS_EXE=C:\Program Files\nodejs\node.exe
set PNPM_CMD=C:\Users\19002857\AppData\Roaming\npm\pnpm.cmd
set PROJECT_DIR=C:\Users\19002857\Desktop\plant2048\artifacts\plant-2048
set VITE_BIN=%PROJECT_DIR%\node_modules\.bin\vite.cmd
set CAP_BIN=%PROJECT_DIR%\node_modules\.bin\cap.cmd
set PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%

echo ========================================
echo   Plant 2048 - Android Build
echo ========================================
echo.

if not exist "%NODEJS_EXE%" (
    echo [FAIL] Node.js not found: %NODEJS_EXE% >> %LOGFILE%
    echo [FAIL] Node.js not found. Install from https://nodejs.org
    goto :END
)
echo [OK] Node.js found >> %LOGFILE%

if not exist "%PNPM_CMD%" (
    echo [FAIL] pnpm not found: %PNPM_CMD% >> %LOGFILE%
    echo [FAIL] pnpm not found. Run: npm install -g pnpm
    goto :END
)
echo [OK] pnpm found >> %LOGFILE%

if not exist "%VITE_BIN%" (
    echo [FAIL] vite not found: %VITE_BIN% >> %LOGFILE%
    echo [FAIL] node_modules missing. Run pnpm install first.
    goto :END
)
echo [OK] vite found >> %LOGFILE%

if not exist "%CAP_BIN%" (
    echo [FAIL] cap not found: %CAP_BIN% >> %LOGFILE%
    echo [FAIL] @capacitor/cli missing.
    goto :END
)
echo [OK] cap found >> %LOGFILE%

echo [1/3] Node version:
"%NODEJS_EXE%" --version
"%NODEJS_EXE%" --version >> %LOGFILE%
echo.

cd /d "%PROJECT_DIR%"
echo [2/3] Building web app...
set BASE_PATH=./
call "%VITE_BIN%" build --config vite.config.ts >> %LOGFILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Build failed. See log: %LOGFILE%
    echo Build failed with error %ERRORLEVEL% >> %LOGFILE%
    goto :END
)
echo [OK] Build done! >> %LOGFILE%
echo [2/3] Build OK!
echo.

echo [3/3] Syncing Android project...
call "%CAP_BIN%" sync android >> %LOGFILE% 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAIL] Sync failed. See log: %LOGFILE%
    echo Sync failed with error %ERRORLEVEL% >> %LOGFILE%
    goto :END
)
echo [OK] Sync done! >> %LOGFILE%
echo [3/3] Sync OK!
echo.

echo ========================================
echo   SUCCESS! Log: %LOGFILE%
echo ========================================
echo.
echo Next: Open Android Studio and build APK
echo   Build ^> Build APK(s)
echo.
set /p OPEN=Open Android Studio? (Y/N):
if /i "%OPEN%"=="Y" (
    call "%CAP_BIN%" open android
)

:END
echo.
echo Press any key to exit...
pause > nul
