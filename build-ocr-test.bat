@echo off
REM ============================================
REM NeuralConsult Frontend OCR Build & Test Script (Windows)
REM ============================================
REM Usage: build-ocr-test.bat [build|test|clean|logs|all|help]
REM ============================================

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set DOCKER_IMAGE=aymantantani/neuralconsult-frontend:ocr-test
set CONTAINER_NAME=neuralconsult-frontend-ocr-test
set FRONTEND_PORT=5173

REM Color codes (using PowerShell for colors)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

:main
if "%1"=="" goto help
if /i "%1"=="build" goto build
if /i "%1"=="run" goto run
if /i "%1"=="test" goto test
if /i "%1"=="logs" goto logs
if /i "%1"=="clean" goto clean
if /i "%1"=="all" goto all
if /i "%1"=="help" goto help
echo Unknown command: %1
goto help

:build
echo.
echo ============================================================
echo Building Docker Image for OCR Testing
echo ============================================================
echo.
echo Building image: %DOCKER_IMAGE%
echo This will compile the frontend with OCR improvements...
echo.

cd /d "%SCRIPT_DIR%"
docker build -f docker\frontend.Dockerfile -t %DOCKER_IMAGE% --build-arg BUILDKIT_INLINE_CACHE=1 .

if %ERRORLEVEL% EQU 0 (
  echo.
  echo [92mDocker image built successfully![0m
) else (
  echo.
  echo [91mFailed to build Docker image[0m
  exit /b 1
)
goto end

:run
echo.
echo ============================================================
echo Starting OCR Test Container
echo ============================================================
echo.

REM Check if container already running
docker ps --filter "name=%CONTAINER_NAME%" --format "{{.Names}}" | findstr /i "%CONTAINER_NAME%" >nul
if %ERRORLEVEL% EQU 0 (
  echo [93mContainer %CONTAINER_NAME% already running[0m
  echo Stopping existing container...
  docker stop %CONTAINER_NAME% >nul 2>&1
  docker rm %CONTAINER_NAME% >nul 2>&1
)

echo Starting container on port %FRONTEND_PORT%...
docker run -d ^
  --name %CONTAINER_NAME% ^
  -p %FRONTEND_PORT%:80 ^
  %DOCKER_IMAGE%

timeout /t 3 /nobreak

if %ERRORLEVEL% EQU 0 (
  echo.
  echo [92mContainer started: %CONTAINER_NAME%[0m
  echo [92mOCR Frontend is ready for testing![0m
  echo Access it at: http://localhost:%FRONTEND_PORT%
  echo Identity OCR Verifier: http://localhost:%FRONTEND_PORT%/#/register
) else (
  echo.
  echo [91mFailed to start container[0m
  exit /b 1
)
goto end

:test
echo.
echo ============================================================
echo Testing OCR Container
echo ============================================================
echo.

docker ps --filter "name=%CONTAINER_NAME%" --format "{{.Names}}" | findstr /i "%CONTAINER_NAME%" >nul
if %ERRORLEVEL% NEQ 0 (
  echo [91mContainer %CONTAINER_NAME% is not running[0m
  echo Run: build-ocr-test.bat build
  echo Then: build-ocr-test.bat run
  exit /b 1
)

echo Testing HTTP connectivity...
powershell -Command "try { $null = Invoke-WebRequest -Uri http://localhost:%FRONTEND_PORT%/ -UseBasicParsing; Write-Host '[92mFrontend is responding to HTTP requests[0m' } catch { Write-Host '[91mFrontend is not responding[0m'; exit 1 }"

if %ERRORLEVEL% EQU 0 (
  echo.
  echo [92mAll tests passed![0m
  echo.
  echo Manual Testing Checklist:
  echo   1. Navigate to http://localhost:%FRONTEND_PORT%/#/register
  echo   2. Fill in user details
  echo   3. Try uploading identity card images:
  echo      - Valid: JPEG/PNG, 500-3000px, landscape, non-blurry
  echo      - Invalid: Small, portrait, blurry, wrong format
  echo   4. Test auto-rotation: Upload image rotated 90 degrees
  echo   5. Verify error messages are clear and specific
) else (
  exit /b 1
)
goto end

:logs
echo.
echo ============================================================
echo Container Logs
echo ============================================================
echo.

docker ps --filter "name=%CONTAINER_NAME%" --format "{{.Names}}" | findstr /i "%CONTAINER_NAME%" >nul
if %ERRORLEVEL% EQU 0 (
  docker logs -f %CONTAINER_NAME%
) else (
  echo [91mContainer %CONTAINER_NAME% is not running[0m
)
goto end

:clean
echo.
echo ============================================================
echo Cleaning Up
echo ============================================================
echo.

echo Stopping container...
docker stop %CONTAINER_NAME% >nul 2>&1
echo Removing container...
docker rm %CONTAINER_NAME% >nul 2>&1

echo [92mCleanup completed[0m
goto end

:all
echo [94m════════════════════════════════════════════════════[0m
echo [94mRunning Full OCR Workflow[0m
echo [94m════════════════════════════════════════════════════[0m
call :build
if %ERRORLEVEL% NEQ 0 exit /b 1
call :run
if %ERRORLEVEL% NEQ 0 exit /b 1
call :test
if %ERRORLEVEL% NEQ 0 exit /b 1
echo.
echo [92mFull workflow completed![0m
goto end

:help
echo.
echo ════════════════════════════════════════════════════
echo NeuralConsult OCR Frontend Build ^& Test Script
echo ════════════════════════════════════════════════════
echo.
echo Usage: %0 [command]
echo.
echo Commands:
echo   build       - Build Docker image for OCR testing
echo   run         - Start the Docker container
echo   test        - Run tests on the running container
echo   logs        - View container logs
echo   clean       - Stop and remove the test container
echo   all         - Build, run, and test (full workflow)
echo   help        - Show this help message
echo.
echo Examples:
echo   %0 build              - Build the image
echo   %0 run                - Start container
echo   %0 test               - Test the running container
echo   %0 all                - Do everything
echo   %0 clean              - Clean up
echo.
echo Testing the OCR Improvements:
echo   1. Run: %0 all
echo   2. Open: http://localhost:%FRONTEND_PORT%/#/register
echo   3. Test with different card images:
echo      - Good: Clear JPEG, landscape, 800x500px+
echo      - Bad: Blurry, portrait, less than 500px
echo   4. Verify validation feedback is immediate and specific
echo.
echo Container Info:
echo   Image: %DOCKER_IMAGE%
echo   Container: %CONTAINER_NAME%
echo   Port: %FRONTEND_PORT%
echo.
echo ════════════════════════════════════════════════════
echo.

:end
endlocal
