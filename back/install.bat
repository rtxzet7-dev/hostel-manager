@echo off
echo Installing Flask and dependencies...
echo.
pip install Flask Flask-CORS Werkzeug requests
echo.
if errorlevel 1 (
    echo ERROR: Installation failed!
    pause
    exit /b 1
)
echo SUCCESS: All packages installed!
echo.
echo Now you can run: start.bat
pause
