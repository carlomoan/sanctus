#!/bin/bash
set -e

echo "=== Building Sanctus Desktop App ==="

# Determine target triple
TARGET_TRIPLE=$(rustc -vV | grep host | awk '{print $2}')
echo "Target: $TARGET_TRIPLE"

# Step 1: Build backend in release mode
echo ""
echo "--- Building backend ---"
cd backend
cargo build --release
cd ..

# Step 2: Copy backend binary to Tauri sidecar location
echo ""
echo "--- Copying backend binary to sidecar ---"
mkdir -p web/src-tauri/binaries
cp backend/target/release/sanctus_backend "web/src-tauri/binaries/sanctus-backend-${TARGET_TRIPLE}"
echo "Copied to: web/src-tauri/binaries/sanctus-backend-${TARGET_TRIPLE}"

# Step 3: Build Tauri app
echo ""
echo "--- Building Tauri app ---"
cargo tauri build

echo ""
echo "=== Build complete! ==="
echo ""
echo "IMPORTANT: After installing the app, place a .env file next to the"
echo "installed binary OR at ~/.sanctus/.env with the following contents:"
echo ""
echo "  DATABASE_URL=postgres://user:pass@localhost:5432/sanctus_db"
echo "  JWT_SECRET=your-secret-key"
echo "  RUST_LOG=sanctus_backend=info"
echo ""
