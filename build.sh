#!/bin/bash
cwd=$(pwd)
clientRoot="/ClientWebpage"
searchRoot="/SearchWebpage"
adminRoot="/AdminWebpage"
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
    npm run build
    cp -r -u "$cwd$clientRoot/dist" "$cwd$buildRoot/webpages/client"
    echo "Building Client webpage done"
fi

if [ $buildSearch -eq 1 ]; then
    echo "Building Search webpage..."
    cd "$cwd$searchRoot"
    npm run build
    cp -r -u "$cwd$searchRoot/dist" "$cwd$buildRoot/webpages/search"
    echo "Building Search webpage done"
fi

if [ $buildAdmin -eq 1 ]; then
    echo "Building Admin webpage..."
    cd "$cwd$adminRoot"
    npm run build
    cp -r -u "$cwd$adminRoot/dist" "$cwd$buildRoot/webpages/admin"
    echo "Building Admin webpage done"
fi

if [ $buildServer -eq 1 ]; then
    echo "Copying server files..."
    cd "$cwd"
    cp -u "$cwd$serverRoot/API.py" "$cwd$buildRoot"
    cp -u "$cwd$serverRoot/QuizDB.py" "$cwd$buildRoot"
    cp -u "$cwd$serverRoot/manageQuizdata.py" "$cwd$buildRoot"
    cp -r -u "$cwd$serverRoot/cfg" "$cwd$buildRoot"
    cp -r -u "$cwd$serverRoot/data" "$cwd$buildRoot"
    echo "Copying server files done"
fi

echo "--- BUild done ---"
