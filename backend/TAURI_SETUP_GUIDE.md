# 🚀 Sanctus Tauri Desktop Application

## 📋 Overview

This setup integrates the Sanctus backend with Tauri to create a desktop application that combines the power of the Rust backend with a modern web frontend in a single desktop package.

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│           Tauri Desktop App         │
├─────────────────────────────────────┤
│  Frontend (React/Vue/Svelte)        │
│  - Runs in embedded webview         │
│  - Communicates with backend API    │
├─────────────────────────────────────┤
│  Backend (Rust + Axum)              │
│  - REST API server on localhost:3000│
│  - Database operations              │
│  - Business logic                   │
├─────────────────────────────────────┤
│  Database (PostgreSQL)              │
│  - Persistent data storage          │
│  - Migrations and schemas           │
└─────────────────────────────────────┘
```

## 🛠️ Setup Instructions

### **Prerequisites**

1. **Rust Toolchain**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Tauri CLI**:
   ```bash
   cargo install tauri-cli
   ```

3. **Node.js & npm** (for frontend):
   ```bash
   # Install from https://nodejs.org or use your package manager
   ```

4. **PostgreSQL**:
   ```bash
   # Ubuntu/Debian:
   sudo apt install postgresql postgresql-contrib
   
   # macOS:
   brew install postgresql
   brew services start postgresql
   
   # Windows:
   # Download from https://www.postgresql.org/download/windows/
   ```

5. **System Dependencies**:
   ```bash
   # Ubuntu/Debian:
   sudo apt install build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
   
   # macOS:
   xcode-select --install
   ```

### **Database Setup**

1. **Create Database**:
   ```bash
   sudo -u postgres createdb sanctus_db
   sudo -u postgres createuser sanctus
   sudo -u postgres psql -c "ALTER USER admin PASSWORD 'Admin123';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sanctus_db TO admin;"
   ```

2. **Configure Environment**:
   ```bash
   cd /home/andrew/RustAppDevs/sanctus/backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

## 🚀 Running the Application

### **Option 1: Development Mode (Recommended)**

```bash
cd /home/andrew/RustAppDevs/sanctus/backend
./run_tauri.sh
```

This will:
- ✅ Check PostgreSQL connection
- ✅ Build web frontend automatically
- ✅ Run database migrations
- ✅ Start backend server on localhost:3000
- ✅ Launch Tauri desktop app

### **Option 2: Manual Development**

```bash
# Terminal 1: Start backend
cd /home/andrew/RustAppDevs/sanctus/backend
cargo run

# Terminal 2: Start frontend
cd /home/andrew/RustAppDevs/sanctus/web
npm run dev

# Terminal 3: Start Tauri
cd /home/andrew/RustAppDevs/sanctus/backend
cd src-tauri
cargo tauri dev
```

### **Option 3: Production Build**

```bash
cd /home/andrew/RustAppDevs/sanctus/backend
./build_tauri.sh
```

## 📁 Project Structure

```
sanctus/backend/
├── src/                    # Backend source code
│   ├── main.rs            # Original backend entry point
│   ├── models/            # Data models
│   ├── handlers/          # API handlers
│   ├── sync/              # Sync functionality
│   └── ...
├── src-tauri/             # Tauri configuration
│   ├── src/
│   │   ├── main.rs        # Tauri entry point
│   │   ├── lib.rs         # Main Tauri logic
│   │   ├── models/        # Symlink to backend models
│   │   ├── handlers/      # Symlink to backend handlers
│   │   └── sync/          # Symlink to backend sync
│   ├── Cargo.toml         # Tauri dependencies
│   ├── tauri.conf.json    # Tauri configuration
│   ├── build.rs           # Build script
│   └── icons/             # App icons
├── migrations/            # Database migrations
├── uploads/              # File uploads directory
├── .env                  # Environment variables
├── run_tauri.sh          # Development runner script
├── build_tauri.sh        # Production build script
└── Cargo.toml            # Backend dependencies
```

## ⚙️ Configuration

### **Tauri Configuration (`src-tauri/tauri.conf.json`)**

Key settings:
- **Window Size**: 1200x800 (minimum 800x600)
- **Frontend**: Points to `../web/dist`
- **Dev Server**: `http://localhost:5173`
- **Security**: CSP configured for localhost:3000 API access

### **Environment Variables (`.env`)**

```env
DATABASE_URL=postgresql://sanctus:sanctus123@localhost:5432/sanctus_db
RUST_LOG=debug
```

## 🔧 Features

### **Backend Integration**
- ✅ **Complete API**: All backend endpoints available
- ✅ **Database**: Full PostgreSQL integration
- ✅ **Authentication**: JWT-based auth system
- ✅ **File Uploads**: Image and document handling
- ✅ **Migrations**: Automatic database schema management

### **Desktop Features**
- ✅ **Native Window**: Desktop app window management
- ✅ **System Integration**: File dialogs, notifications
- ✅ **Security**: Sandboxed environment
- ✅ **Performance**: Native performance with Rust backend
- ✅ **Cross-Platform**: Windows, macOS, Linux support

### **Development Features**
- ✅ **Hot Reload**: Frontend changes update in real-time
- ✅ **Debug Tools**: Full debugging capabilities
- ✅ **Console Access**: Backend logs visible in dev console
- ✅ **Fast Builds**: Optimized build process

## 🌐 API Access

The backend API runs on `http://localhost:3000` and is accessible from:

1. **Frontend**: Via embedded webview
2. **External Apps**: If configured to allow external connections
3. **Mobile Apps**: Can connect to same backend

### **Key Endpoints**
- `GET /health` - Health check
- `POST /auth/login` - Authentication
- `GET /api/*` - All backend APIs
- `POST /upload/*` - File uploads

## 📱 Building for Distribution

### **Linux**
```bash
./build_tauri.sh
# Creates: .deb, .AppImage
```

### **macOS**
```bash
./build_tauri.sh
# Creates: .dmg, .app bundle
```

### **Windows**
```bash
./build_tauri.sh
# Creates: .msi installer
```

## 🐛 Troubleshooting

### **Common Issues**

1. **"Address already in use"**:
   ```bash
   # Kill existing processes
   pkill -f sanctus
   pkill -f cargo
   ```

2. **Database connection failed**:
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check database exists
   psql -l | grep sanctus_db
   ```

3. **Frontend build failed**:
   ```bash
   # Clean and rebuild
   cd ../web
   rm -rf node_modules dist
   npm install
   npm run build
   ```

4. **Tauri build failed**:
   ```bash
   # Clean build cache
   cd src-tauri
   cargo clean
   cargo tauri dev
   ```

### **Debug Mode**

Enable detailed logging:
```bash
RUST_LOG=debug ./run_tauri.sh
```

### **Development Tips**

1. **Backend Only**: Run `cargo run` for backend-only development
2. **Frontend Only**: Run `cd ../web && npm run dev` for frontend-only
3. **Database Migrations**: Backend automatically runs migrations on startup
4. **File Uploads**: Check `uploads/` directory for uploaded files

## 🚀 Deployment

### **Single Executable**
The Tauri build creates a single executable that includes:
- Embedded web frontend
- Rust backend runtime
- All dependencies

### **Installation**
- **Linux**: `sudo dpkg -i sanctus*.deb` or run `.AppImage`
- **macOS**: Open `.dmg` and drag to Applications
- **Windows**: Run `.msi` installer

### **Updates**
The app can be configured to auto-update using Tauri's updater plugin (currently disabled).

## 🎯 Next Steps

1. **Customize Icons**: Replace default icons in `src-tauri/icons/`
2. **Configure Auto-Updater**: Enable and configure update mechanism
3. **Add Native Features**: File system access, system notifications
4. **Optimize Build**: Reduce bundle size, optimize performance
5. **Security Hardening**: Production security configurations

---

**🎉 Your Sanctus desktop application is ready!**

Run `./run_tauri.sh` to start development, or `./build_tauri.sh` for production builds.
