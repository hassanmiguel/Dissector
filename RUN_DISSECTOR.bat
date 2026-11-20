@echo off
setlocal EnableDelayedExpansion
color 0A
title Dissector - Easy Launcher

cd /d "%~dp0"

set "DEV_PORT=20127"
set "CLI_PORT=20128"
set "CLI_STAMP=cli\app\.build-stamp"

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
echo   [1] Open dashboard               http://localhost:%DEV_PORT%/dashboard
echo   [2] Start DEV dashboard          http://localhost:%DEV_PORT%
echo   [3] Start PRODUCTION server      http://localhost:%DEV_PORT%
echo   [4] Build production app
echo   [5] Install / update dependencies
echo   [6] Build CLI package
echo   [7] Start CLI gateway            http://localhost:%CLI_PORT%
echo   [8] Show status
echo   [0] Exit
echo.
choice /C 123456780 /N /M "  Select an option [0-8]: "
if errorlevel 9 goto :EXIT
if errorlevel 8 goto :STATUS
if errorlevel 7 goto :CLISTART
if errorlevel 6 goto :CLIBUILD
if errorlevel 5 goto :SETUP
if errorlevel 4 goto :BUILD
if errorlevel 3 goto :PROD
if errorlevel 2 goto :DEV
if errorlevel 1 goto :OPENBROWSER
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
call :WAITUP %DEV_PORT% 60
if errorlevel 1 (
  echo  [ERROR] DEV dashboard did not become ready on port %DEV_PORT%.
  echo  Check the "Dissector DEV" window for errors.
  goto :PAUSE_BACK
)
start "" "http://localhost:%DEV_PORT%/dashboard"
echo  Dev server launched in a new window. Close that window to stop it.
goto :PAUSE_BACK

:PROD
cls
echo.
echo  === Starting PRODUCTION server (port %DEV_PORT%) ===
if not exist "node_modules" (
  echo  Dependencies not found - running setup first...
  echo.
  call :DOINSTALL
)
if not exist ".next" (
  echo  [ERROR] No production build found. Run option [3] first.
  goto :PAUSE_BACK
)
start "Dissector PROD" cmd /k "npm start"
call :WAITUP %DEV_PORT% 60
if errorlevel 1 (
  echo  [ERROR] Production server did not become ready on port %DEV_PORT%.
  echo  Check the "Dissector PROD" window for errors.
  goto :PAUSE_BACK
)
start "" "http://localhost:%DEV_PORT%/dashboard"
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
call :DOCLIBUILD
if errorlevel 1 goto :PAUSE_BACK
echo  CLI package built into cli\app
goto :PAUSE_BACK

:DOCLIBUILD
if not exist "node_modules" (
  echo  Dependencies not found - running setup first...
  echo.
  call :DOINSTALL
)
if not exist "cli\node_modules\esbuild" (
  echo  CLI build dependencies missing - installing them now...
  npm --prefix cli install
  if errorlevel 1 (
    echo  [ERROR] CLI dependency install failed.
    exit /b 1
  )
)
npm --prefix cli run build
if errorlevel 1 (
  echo  [ERROR] CLI build failed.
  exit /b 1
)
rem Stamp the build so we can detect stale CLI bundles on the next launch.
echo built %DATE% %TIME% > "%CLI_STAMP%"
exit /b 0

:CLISTART
cls
echo.
echo  === Starting CLI gateway (port %CLI_PORT%) ===
if not exist "cli\app\custom-server.js" (
  echo  CLI package not built - building it now...
  call :DOCLIBUILD
  if errorlevel 1 goto :PAUSE_BACK
) else (
  call :CLISTALE
  if errorlevel 1 (
    echo  CLI bundle is older than the source - rebuilding it now...
    call :DOCLIBUILD
    if errorlevel 1 goto :PAUSE_BACK
  )
)
rem --no-menu keeps the gateway alive even when the window has no TTY.
start "Dissector CLI" cmd /k "node cli\cli.js -p %CLI_PORT% --no-menu --no-browser"
call :WAITUP %CLI_PORT% 90
if errorlevel 1 (
  echo  [ERROR] CLI gateway did not become ready on port %CLI_PORT%.
  echo  Check the "Dissector CLI" window for errors.
  goto :PAUSE_BACK
)
start "" "http://localhost:%CLI_PORT%/dashboard"
echo  CLI gateway launched in a new window.
goto :PAUSE_BACK

:OPENBROWSER
call :ISUP %DEV_PORT%
if not errorlevel 1 (
  start "" "http://localhost:%DEV_PORT%/dashboard"
  echo  Opened http://localhost:%DEV_PORT%/dashboard
  goto :PAUSE_BACK
)
call :ISUP %CLI_PORT%
if not errorlevel 1 (
  start "" "http://localhost:%CLI_PORT%/dashboard"
  echo  Opened http://localhost:%CLI_PORT%/dashboard
  goto :PAUSE_BACK
)
if exist ".next\BUILD_ID" (
  echo  No dashboard is running yet - starting the production server...
  goto :PROD
)
echo  No dashboard is running yet - starting the DEV dashboard...
goto :DEV

:STATUS
cls
echo.
echo  === Status ===
echo   Node.js      : !NODEVER!
if exist "node_modules" (echo   Dependencies  : installed) else (echo   Dependencies  : MISSING - run option 4)
if exist ".next" (echo   Prod build    : present) else (echo   Prod build    : none - run option 3)
if exist "cli\app\custom-server.js" (echo   CLI package   : built) else (echo   CLI package   : not built - run option 5)
call :ISUP %DEV_PORT%
if errorlevel 1 (echo   Dashboard    : OFFLINE on port %DEV_PORT%) else (echo   Dashboard    : ONLINE  on port %DEV_PORT%)
call :ISUP %CLI_PORT%
if errorlevel 1 (echo   CLI gateway  : OFFLINE on port %CLI_PORT%) else (echo   CLI gateway  : ONLINE  on port %CLI_PORT%)
goto :PAUSE_BACK

rem ---------------------------------------------------------------------------
rem Helpers
rem ---------------------------------------------------------------------------

rem :ISUP <port> - errorlevel 0 when /api/health answers 200, else 1.
:ISUP
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -Uri 'http://localhost:%~1/api/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
exit /b %errorlevel%

rem :WAITUP <port> <seconds> - wait until the port answers /api/health.
:WAITUP
set /a WAIT_LEFT=%~2
:WAITUP_LOOP
call :ISUP %~1
if not errorlevel 1 exit /b 0
set /a WAIT_LEFT-=1
if !WAIT_LEFT! LEQ 0 exit /b 1
call :SLEEP 1
goto :WAITUP_LOOP

rem :CLISTALE - errorlevel 1 when cli\app is missing/stamp old.
:CLISTALE
if not exist "%CLI_STAMP%" exit /b 1
powershell -NoProfile -Command "$stamp='%CLI_STAMP%'; $files=@('package.json','src\app\(dashboard)\dashboard\page.js','src\shared\components\DashboardOverview.js','src\app\globals.css','cli\cli.js','cli\scripts\build-cli.js'); $newest=$null; foreach($f in $files){ if(Test-Path -LiteralPath $f){ $i=Get-Item -LiteralPath $f; if(-not $newest -or $i.LastWriteTime -gt $newest.LastWriteTime){$newest=$i} } }; if(-not $newest -or (Get-Item -LiteralPath $stamp).LastWriteTime -lt $newest.LastWriteTime){exit 1}else{exit 0}" >nul 2>&1
exit /b %errorlevel%

:PAUSE_BACK
echo.
pause
goto :MENU

:EXIT
echo  Bye.
call :SLEEP 2
exit /b 0

rem :SLEEP <seconds> - portable delay that also works when stdin is redirected.
:SLEEP
set /a PINGS=%~1+1
ping -n %PINGS% 127.0.0.1 >nul 2>&1
exit /b 0
