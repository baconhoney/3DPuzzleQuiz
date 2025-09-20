#!/bin/bash
echo "Activating virtual environment..."
source Server/.venv/bin/activate
echo "Starting app..."
cd Server
python main.py
echo "App finished. Deactivating..."
cd ..
deactivate
read -p "Press enter to continue"
