#!/bin/bash

ROOT_DIR="$(pwd)"

echo "Syncing apexcharts from upstream-apexcharts..."

# 1) upstream-apexcharts의 main 브랜치에서 packages/apexcharts에 반영
git subtree pull --prefix=packages/apexcharts upstream-apexcharts main

# 2) fork(origin) 레포에 push
git subtree push --prefix=packages/apexcharts origin-apexcharts main

# 3) package.json 수정 
echo "Applying local changes (package.json) for apexcharts..."
jq '.scripts["dev-no-watch:umd"] = "rollup -c build/config.js --environment TARGET:web-umd-dev"' \
  packages/apexcharts/package.json > tmp.json && mv tmp.json packages/apexcharts/package.json

echo "apexcharts synced."

echo "Syncing react-apexcharts from upstream-react-apexcharts..."

# 1) upstream-react-apexcharts의 master 브랜치에서 packages/react-apexcharts에 반영
git subtree pull --prefix=packages/react-apexcharts upstream-react-apexcharts master

# 2) fork(origin) 레포에 push
git subtree push --prefix=packages/react-apexcharts origin-react-apexcharts master

# 3) package.json 수정 
echo "Applying local changes (package.json) for react-apexcharts..."
jq '.peerDependencies.apexcharts = "workspace:*"' \
  packages/react-apexcharts/package.json > tmp.json && mv tmp.json packages/react-apexcharts/package.json

echo "react-apexcharts synced."

cd "$ROOT_DIR"
echo "All done."
