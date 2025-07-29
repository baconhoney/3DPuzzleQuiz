#!/bin/bash
cwd=$(pwd)
clientRoot="/ClientWebpage"
searchRoot="/SearchWebpage"
adminRoot="/AdminWebpage/react"
serverRoot="/Server"
buildRoot="/Build"

buildClient=0
buildSearch=0
buildAdmin=0
buildServer=1

echo "Cleaning build folder..."
rm -rf "$cwd$buildRoot/*"
echo "Cleaning build folder done"

if [ $buildClient -eq 1 ]; then
    echo "Building Client webpage..."
    cd "$cwd$clientRoot"
    npm i
    npm run build
    cp -r -u "$cwd$clientRoot/dist" "$cwd$buildRoot/webpages/client"
    echo "Building Client webpage done"
fi

if [ $buildSearch -eq 1 ]; then
    echo "Building Search webpage..."
    cd "$cwd$searchRoot"
    npm i
    npm run build
    cp -r -u "$cwd$searchRoot/dist" "$cwd$buildRoot/webpages/search"
    echo "Building Search webpage done"
fi

if [ $buildAdmin -eq 1 ]; then
    echo "Building Admin webpage..."
    cd "$cwd$adminRoot"
    npm i
    npm run build
    cp -r -u "$cwd$adminRoot/dist" "$cwd$buildRoot/webpages/admin"
    echo "Building Admin webpage done"
fi

if [ $buildServer -eq 1 ]; then
    echo "Copying server files..."
    cd "$cwd"
    # Create destination directory
    mkdir -p "$cwd$buildRoot/modules"
    # Copy build.env as .env into destination folder
    cp "$cwd/build.env" "$cwd$buildRoot/.env"
    # Copy the specific root files
    cp "$cwd/main.py" "$cwd$buildRoot/"
    cp "$cwd/manageQuizdata.py" "$cwd$buildRoot/"
    # Copy all files from modules/, excluding __pycache__
    find "$cwd$serverRoot/modules" -type f ! -path "*/__pycache__/*" -exec cp {} "$cwd$buildRoot/modules" \;
    # Copy cfg and data folders recursively
    cp -r ./cfg "$cwd$buildRoot/"
    cp -r ./data "$cwd$buildRoot/"
    echo "Copying server files done"
fi

echo "--- BUild done ---"
