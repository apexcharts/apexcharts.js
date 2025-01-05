#!/bin/bash

ROOT_DIR=$(pwd)

echo "Adding upstream to apexcharts.js..."
cd ./packages/apexcharts.js
git remote add upstream https://github.com/apexcharts/apexcharts.js.git || echo "upstream already exists for apexcharts"
echo "Done."

echo "Adding upstream to react-apexcharts..."
cd ../react-apexcharts
git remote add upstream https://github.com/apexcharts/react-apexcharts.git || echo "upstream already exists for react-apexcharts"
echo "Done."

cd "$ROOT_DIR"
