@echo off
setlocal enabledelayedexpansion

REM Define root directories
set "cwd=%cd%"
set "clientRoot=\ClientWebpage"
set "searchRoot=\SearchWebpage"
set "adminRoot=\AdminWebpage"
set "serverRoot=\Server"
set "buildRoot=\Build"

REM Build flags
set buildClient=0
set buildSearch=0
set buildAdmin=0
set buildServer=1

echo Cleaning build folder...
del /q /s "%cwd%%buildRoot%\*.*"
for /d %%x in ("%cwd%%buildRoot%\*") do rd /s /q "%%x"
echo Cleaning build folder done

if "%buildClient%"=="1" (
    echo Building Client webpage...
    cd /d "%cwd%%clientRoot%"
    call npm run build
    xcopy /E /Y "%cwd%%clientRoot%\dist" "%cwd%%buildRoot%\webpages\client\"
    echo Building Client webpage done
)

if "%buildSearch%"=="1" (
    echo Building Search webpage...
    cd /d "%cwd%%searchRoot%"
    call npm run build
    xcopy /E /Y "%cwd%%searchRoot%\dist" "%cwd%%buildRoot%\webpages\search\"
    echo Building Search webpage done
)

if "%buildAdmin%"=="1" (
    echo Building Admin webpage...
    cd /d "%cwd%%adminRoot%"
    call npm run build
    xcopy /E /Y "%cwd%%adminRoot%\dist" "%cwd%%buildRoot%\webpages\admin\"
    echo Building Admin webpage done
)

if "%buildServer%"=="1" (
    echo Copying server files...
    cd /d "%cwd%"
    copy /Y "%cwd%%serverRoot%\API.py" "%cwd%%buildRoot%\"
    copy /Y "%cwd%%serverRoot%\QuizDB.py" "%cwd%%buildRoot%\"
    copy /Y "%cwd%%serverRoot%\manageQuizdata.py" "%cwd%%buildRoot%\"
    xcopy /E /Y "%cwd%%serverRoot%\cfg" "%cwd%%buildRoot%\cfg\"
    xcopy /E /Y "%cwd%%serverRoot%\data" "%cwd%%buildRoot%\data\"
    echo Copying server files done
)

echo --- Build done ---
pause
