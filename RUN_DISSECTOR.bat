@echo off
setlocal EnableDelayedExpansion
color 0A
title Dissector - Easy Launcher

cd /d "%~dp0"

set "DEV_PORT=20127"
set "CLI_PORT=20128"

echo.
echo  Checking environment...
node -v >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Node.js was not found on PATH.
  echo  Install Node.js 20.18.1 or newer, then run this file again.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do set "NODEVER=%%v"
set "NODEVER=!NODEVER:v=!"
for /f "tokens=1 delims=." %%m in ("!NODEVER!") do set "NODEMAJOR=%%m"
if defined NODEMAJOR if !NODEMAJOR! LSS 20 (
  echo  [WARN] Node !NODEVER! detected. Version 20.18.1+ is recommended.
)

:MENU
cls
echo.
echo  +--------------------------------------------------------------+
echo  ^|                                                              ^|
echo  ^|   D I S S E C T O R    ^>^>   AI INFRASTRUCTURE GATEWAY       ^|
echo  ^|                                                              ^|
echo  +--------------------------------------------------------------+
echo.
echo   Node: !NODEVER!     Project: %CD%
echo.
echo   [1] Start DEV dashboard          http://localhost:%DEV_PORT%
echo   [2] Start PRODUCTION server      http://localhost:%DEV_PORT%
echo   [3] Build production app
echo   [4] Install / update dependencies
echo   [5] Build CLI package
echo   [6] Start CLI gateway             http://localhost:%CLI_PORT%
echo   [7] Open dashboard in browser
echo   [8] Show status
echo   [0] Exit
echo.
choice /C 123456780 /N /M "  Select an option [0-8]: "
if errorlevel 9 goto :EXIT
if errorlevel 8 goto :STATUS
if errorlevel 7 goto :OPENBROWSER
if errorlevel 6 goto :CLISTART
if errorlevel 5 goto :CLIBUILD
if errorlevel 4 goto :SETUP
if errorlevel 3 goto :BUILD
if errorlevel 2 goto :PROD
if errorlevel 1 goto :DEV
goto :MENU

:DEV
cls
echo.
echo  === Starting DEV dashboard (port %DEV_PORT%) ===
if not exist "node_modules" (
  echo  Dependencies not found - running setup first...
  echo.
  call :DOINSTALL
)
start "Dissector DEV" cmd /k "npm run dev"
echo  Waiting for the server to boot...
timeout /t 6 >nul
start "" "http://localhost:%DEV_PORT%"
echo  Dev server launched in a new window. Close that window to stop it.
goto :PAUSE_BACK

:PROD
cls
echo.
echo  === Starting PRODUCTION server (port %DEV_PORT%) ===
if not exist "node_modules" (
  echo  Dependencies not found - running setup first...
  call :DOINSTALL
)
if not exist ".next" (
  echo  [ERROR] No production build found. Run option [3] first.
  goto :PAUSE_BACK
)
start "Dissector PROD" cmd /k "npm start"
timeout /t 6 >nul
start "" "http://localhost:%DEV_PORT%"
echo  Production server launched in a new window.
goto :PAUSE_BACK

:BUILD
cls
echo.
echo  === Building production app ===
npm run build
if errorlevel 1 (
  echo  [ERROR] Build failed.
  goto :PAUSE_BACK
)
echo  Build completed.
goto :PAUSE_BACK

:SETUP
cls
echo.
echo  === Install / update dependencies ===
call :DOINSTALL
goto :PAUSE_BACK

:DOINSTALL
echo  [1/2] Root dependencies (npm install)...
npm install
if errorlevel 1 (
  echo  [ERROR] Root install failed.
  goto :DOINSTALL_END
)
if exist "cli\package.json" (
  echo  [2/2] CLI dependencies...
  npm --prefix cli install
  if errorlevel 1 echo  [WARN] CLI install failed - CLI features may not work.
)
echo  Setup finished.
:DOINSTALL_END
goto :eof

:CLIBUILD
cls
echo.
echo  === Building CLI package (this also builds the Next.js app) ===
if not exist "node_modules" (
  echo  Dependencies not found - running setup first...
  call :DOINSTALL
)
npm --prefix cli run build
if errorlevel 1 (
  echo  [ERROR] CLI build failed.
  goto :PAUSE_BACK
)
echo  CLI package built into cli\app
goto :PAUSE_BACK

:CLISTART
cls
echo.
echo  === Starting CLI gateway (port %CLI_PORT%) ===
if not exist "cli\app\custom-server.js" (
  echo  [ERROR] CLI package not built. Run option [5] first.
  goto :PAUSE_BACK
)
start "Dissector CLI" cmd /k "node cli\cli.js -p %CLI_PORT%"
timeout /t 6 >nul
start "" "http://localhost:%CLI_PORT%"
echo  CLI gateway launched in a new window.
goto :PAUSE_BACK

:OPENBROWSER
start "" "http://localhost:%DEV_PORT%"
echo  Opened http://localhost:%DEV_PORT%
goto :PAUSE_BACK

:STATUS
cls
echo.
echo  === Status ===
echo   Node.js      : !NODEVER!
if exist "node_modules" (echo   Dependencies  : installed) else (echo   Dependencies  : MISSING - run option 4)
if exist ".next" (echo   Prod build    : present) else (echo   Prod build    : none - run option 3)
if exist "cli\app\custom-server.js" (echo   CLI package   : built) else (echo   CLI package   : not built - run option 5)
goto :PAUSE_BACK

:PAUSE_BACK
echo.
pause
goto :MENU

:EXIT
echo  Bye.
timeout /t 2 >nul
exit /b 0
