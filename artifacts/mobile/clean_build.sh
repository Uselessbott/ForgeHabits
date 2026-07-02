#!/bin/bash
echo "🧹 Cleaning build..."
cd android
./gradlew clean
cd ..
echo "✅ Clean complete"
