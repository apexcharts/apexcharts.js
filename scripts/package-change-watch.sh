#!/bin/bash

ROOT_DIR=$(pwd)

echo "Watching apexcharts.js for changes..."
nodemon \
  --watch packages/apexcharts.js/src \
  --exec "yarn workspace apexcharts.js dev-no-watch:umd" \
  --watch packages/apexcharts.js/types/apexcharts.d.ts \
  --exec "echo 'Types updated: apexcharts.d.ts changed!'"

echo "Watching react-apexcharts for changes..."
nodemon \
  --watch packages/react-apexcharts/src \
  --exec "yarn workspace react-apexcharts dev-build"

cd "$ROOT_DIR"
