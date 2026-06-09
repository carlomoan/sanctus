#!/bin/bash
set -e

echo "=== Building OCMIS Desktop App ==="

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
mkdir -p backend/src-tauri/binaries
cp backend/target/release/ocmis_backend "backend/src-tauri/binaries/ocmis-backend-${TARGET_TRIPLE}"
echo "Copied to: backend/src-tauri/binaries/ocmis-backend-${TARGET_TRIPLE}"

# Step 3: Build Tauri app
echo ""
echo "--- Building Tauri app ---"
cd backend
cargo tauri build
cd ..

echo ""
echo "=== Build complete! ==="
echo ""
echo "IMPORTANT: After installing the app, place a .env file next to the"
echo "installed binary OR at ~/.ocmis/.env with the following contents:"
echo ""
echo "  DATABASE_URL=postgres://user:pass@localhost:5432/ocmis_db"
echo "  JWT_SECRET=your-secret-key"
echo "  RUST_LOG=ocmis_backend=info"
echo ""
