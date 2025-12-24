#!/bin/bash
echo "=== 🐝 POLLENEER BUILD VERIFICATION ==="
echo "1. Checking directory structure..."
pwd
ls -la

echo "2. Building frontend..."
cd frontend
npm ci
npm run build

echo "3. Checking frontend build..."
ls -la dist/

echo "4. Copying to backend/public..."
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

echo "5. Checking backend/public..."
ls -la ../backend/public/

echo "6. Testing if index.html exists..."
if [ -f "../backend/public/index.html" ]; then
  echo "✅ index.html found!"
else
  echo "❌ index.html NOT FOUND!"
fi

echo "=== BUILD COMPLETE ==="
