@echo off
cls
echo ========================================
echo HOSTEL MANAGER BACKEND SERVER
echo ========================================
echo.
echo [1/4] Checking Python installation...
python --version 2>nul
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo.
    echo Please download Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)
echo OK: Python found
echo.

echo [2/4] Checking pip...
pip --version >nul 2>&1
if errorlevel 1 (
    echo Installing pip...
    python -m ensurepip --upgrade
)
echo OK: pip ready
echo.

echo [3/4] Installing dependencies...
echo This may take a minute...
pip install Flask Flask-CORS Werkzeug requests
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    echo.
    echo Try manually:
    echo    pip install Flask Flask-CORS
    echo.
    pause
    exit /b 1
)
echo OK: All dependencies installed
echo.

echo [4/4] Checking network settings...
python check_network.py
echo.

echo ========================================
echo STARTING SERVER...
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.
python app.py
pause
