#!/bin/bash

echo "🏗️  Sanctus Tauri Production Builder"
echo "=================================="

# Check if we're in the correct directory
if [ ! -f "src-tauri/tauri.conf.json" ]; then
    echo "❌ Please run this script from the sanctus/backend directory"
    exit 1
fi

echo "✅ In correct backend directory"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with DATABASE_URL"
    exit 1
fi

# Tauri will handle frontend build via beforeBuildCommand
echo "🌐 Tauri will build web frontend automatically..."
echo "✅ Ready for Tauri build"

# Create production build of Tauri app
echo "🔨 Building Tauri application for production..."
cd src-tauri

# Determine platform
case "$(uname -s)" in
    Linux*)     platform="linux";;
    Darwin*)    platform="macos";;
    CYGWIN*|MINGW*|MSYS*) platform="windows";;
    *)          platform="unknown";;
esac

echo "🎯 Building for platform: $platform"

# Build based on platform
case $platform in
    "linux")
        echo "🐧 Building Linux AppImage and Debian package..."
        cargo tauri build --target x86_64-unknown-linux-gnu
        ;;
    "macos")
        echo "🍎 Building macOS DMG and app bundle..."
        cargo tauri build --target x86_64-apple-darwin
        ;;
    "windows")
        echo "🪟 Building Windows MSI..."
        cargo tauri build --target x86_64-pc-windows-msvc
        ;;
    *)
        echo "❌ Unsupported platform: $platform"
        exit 1
        ;;
esac

cd ..

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📦 Build artifacts location:"
if [ -d "src-tauri/target/release/bundle" ]; then
    find src-tauri/target/release/bundle -name "*.deb" -o -name "*.dmg" -o -name "*.msi" -o -name "*.AppImage" | while read file; do
        echo "   📄 $file"
    done
fi

echo ""
echo "🚀 To run the production build:"
echo "   Linux: ./src-tauri/target/release/bundle/deb/*.deb or *.AppImage"
echo "   macOS: Open the .dmg file"
echo "   Windows: Run the .msi installer"
echo ""
