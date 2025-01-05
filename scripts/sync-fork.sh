#!/bin/bash

ROOT_DIR=$(pwd)

echo "Syncing apexcharts..."
cd ./packages/apexcharts
git fetch upstream
git merge --no-edit upstream/main
git push origin main
jq '.scripts["dev-no-watch:umd"] = "rollup -c build/config.js --environment TARGET:web-umd-dev"' ./package.json > tmp.json && mv tmp.json ./package.json
echo "apexcharts synced."

echo "Syncing react-apexcharts..."
cd ../react-apexcharts
git fetch upstream
git merge --no-edit upstream/master
git push origin master
jq '.peerDependencies.apexcharts = "workspace:*"' ./package.json > tmp.json && mv tmp.json ./package.json
echo "react-apexcharts synced."

cd "$ROOT_DIR"
