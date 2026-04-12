#!/bin/bash

echo "🚀 Sanctus Tauri Development Runner"
echo "==================================="

# Check if we're in the correct directory
if [ ! -f "src-tauri/tauri.conf.json" ]; then
    echo "❌ Please run this script from the sanctus/backend directory"
    exit 1
fi

echo "✅ In correct backend directory"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cat > .env << EOL
DATABASE_URL=postgresql://admin:Admin123@localhost:5432/sanctus_db
RUST_LOG=debug
EOL
    echo "✅ Created .env file with default settings"
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
    echo "   On Ubuntu/Debian: sudo systemctl start postgresql"
    echo "   On macOS: brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check if database exists
echo "🔍 Checking database..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw sanctus_db; then
    echo "⚠️  Database 'sanctus_db' not found. Creating..."
    createdb sanctus_db
    echo "✅ Database created"
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "target" ]; then
    echo "📦 Installing Tauri dependencies..."
    cargo build --manifest-path=src-tauri/Cargo.toml
fi

# Check if web frontend is built
if [ ! -d "../web/dist" ]; then
    echo "🌐 Building web frontend..."
    cd ../web
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    npm run build
    cd ../backend
    echo "✅ Web frontend built"
fi

echo ""
echo "🎯 Starting Sanctus Tauri Application..."
echo "   - Backend server: http://localhost:3000"
echo "   - Frontend: Embedded in Tauri window"
echo "   - Database: PostgreSQL (sanctus_db)"
echo ""
echo "🛑 Press Ctrl+C to stop the application"
echo ""

# Run the Tauri application
cd src-tauri
cargo tauri dev
