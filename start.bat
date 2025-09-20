@echo off
echo Activating virtual environment...
call Server\.venv\Scripts\activate
echo Starting app...
cd Server
python main.py
echo App finished. Deactivating...
cd ..
deactivate
pause
