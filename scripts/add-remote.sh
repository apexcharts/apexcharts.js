#!/bin/bash

ROOT_DIR=$(pwd)

echo "Adding remotes for apexcharts.js and react-apexcharts in monorepo..."

git remote add origin https://github.com/Invincible-Study-Soru/apexchart-contribution.git || echo "origin already exists for monorepo"

git remote add origin-apexcharts https://github.com/Invincible-Study-Soru/apexcharts.js.git || echo "origin for apexcharts already exists"
git remote add upstream-apexcharts https://github.com/apexcharts/apexcharts.js.git || echo "upstream for apexcharts already exists"

git remote add origin-react-apexcharts https://github.com/Invincible-Study-Soru/react-apexcharts.git || echo "origin for react-apexcharts already exists"
git remote add upstream-react-apexcharts https://github.com/apexcharts/react-apexcharts.git || echo "upstream for react-apexcharts already exists"

echo "Remotes added successfully."

cd "$ROOT_DIR"
