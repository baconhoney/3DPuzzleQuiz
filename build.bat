@echo off
setlocal enabledelayedexpansion

REM Define root directories
set "cwd=%cd%"
set "clientRoot=\ClientWebpage"
set "searchRoot=\SearchWebpage"
set "adminRoot=\AdminWebpage\react"
set "serverRoot=\Server"
set "buildRoot=\Build"

REM Build flags
set buildClient=1
set buildSearch=1
set buildAdmin=1
set buildServer=1

echo Cleaning build folder...
mkdir \Build
del /q /s "%cwd%%buildRoot%\*.*"
for /d %%x in ("%cwd%%buildRoot%\*") do rd /s /q "%%x"
echo Cleaning build folder done

if "%buildClient%"=="1" (
    echo Building Client webpage...
    cd /d "%cwd%%clientRoot%"
    call npm i
    call npm run build
    xcopy /E /Y "%cwd%%clientRoot%\dist" "%cwd%%buildRoot%\webpages\client\"
    echo Building Client webpage done
)

if "%buildSearch%"=="1" (
    echo Building Search webpage...
    cd /d "%cwd%%searchRoot%"
    call npm i
    call npm run build
    xcopy /E /Y "%cwd%%searchRoot%\dist" "%cwd%%buildRoot%\webpages\search\"
    echo Building Search webpage done
)

if "%buildAdmin%"=="1" (
    echo Building Admin webpage...
    cd /d "%cwd%%adminRoot%"
    call npm i
    call npm run build
    xcopy /E /Y "%cwd%%adminRoot%\dist" "%cwd%%buildRoot%\webpages\admin\"
    echo Building Admin webpage done
)

if "%buildServer%"=="1" (
    echo Copying server files...
    cd /d "%cwd%"
    mkdir %cwd%%buildRoot%\modules
    :: Copy build.env as .env into destination folder
    copy /Y ".\build.env" "%cwd%%buildRoot%\.env"
    :: Copy only the specific root files
    copy .\main.py %cwd%%buildRoot%\
    copy .\manageQuizdata.py %cwd%%buildRoot%\
    :: Copy only files directly in modules\ (not in __pycache__ or subfolders)
    for %%F in (modules\*.py) do copy "%%F" "%cwd%%buildRoot%\modules\"
    :: Recursive copy all the cfg and data folders
    xcopy /E /I /Y "%cwd%%serverRoot%\cfg" "%cwd%%buildRoot%\cfg\"
    xcopy /E /I /Y "%cwd%%serverRoot%\data" "%cwd%%buildRoot%\data\"
    echo Copying server files done
)

echo --- Build done ---
pause
