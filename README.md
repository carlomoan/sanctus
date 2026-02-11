# Sanctus - Roman Catholic Church Morogoro Diocese Management System

## Project Overview
Sanctus is a digital management system designed for the Roman Catholic Church Morogoro Diocese. It aims to solve challenges related to manual record-keeping, lack of internet connectivity, and difficulty in tracking financial and sacramental records across parishes.

## Problem Statement
- **No Internet:** Many parishes lack reliable internet access.
- **Manual Records:** Hand-written receipts and registers lead to errors and data loss.
- **Reporting:** Generating financial reports is time-consuming.
- **Tracking:** Difficulty in tracking member sacraments and family connections.
- **Visibility:** The Diocese lacks real-time visibility into parish activities.

## Solution
Sanctus acts as a smart digital notebook that functions offline (using SQLite) and syncs to the cloud (PostgreSQL) when internet connectivity is available.

## Architecture & Tech Stack

### Backend
- **Language:** Rust
- **Framework:** Axum
- **Database (Cloud/Main):** PostgreSQL
- **Database (Offline/Local):** SQLite (embedded in clients)

### Web UI (Desktop/Admin)
- **Framework:** Tauri (Rust)
- **Frontend:** Vite + React

### Mobile & Desktop UI (Cross-Platform)
- **Framework:** Flutter
- **Platforms:** Windows, Linux, Android, iOS

## Features
- **Offline-First:** Mobile app uses SQLite for local storage and syncs when online.
- **Secure Auth:** JWT-based authentication with Role-Based Access Control (RBAC).
- **Financial Management:** Tithes, expenses, budgeting, and automated financial reports (Trial Balance, etc.).
- **Sacramental Records:** Track Baptisms, Confirmations, Marriages, etc.
- **Data Portability:** Export/Import data via CSV and Excel (.xlsx).

## Getting Started

### Prerequisites
- Rust (latest stable)
- PostgreSQL
- Node.js & npm (for Web UI)
- Flutter SDK (for Mobile UI)

### Backend Setup
1. `cd backend`
2. Create a `.env` file based on `.env.example`:
   ```env
   DATABASE_URL=postgres://user:password@localhost/sanctus
   JWT_SECRET=your_super_secret_key
   ```
3. Run migrations and start:
   ```bash
   cargo run
   ```

### Web UI Setup
1. `cd web`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

### Mobile UI Setup
1. `cd mobile`
2. Get packages: `flutter pub get`
3. Run app: `flutter run`

## API Reference (Summary)
- `POST /auth/login`: Authenticate and get JWT.
- `GET /sync`: Get latest changes from server.
- `POST /sync`: Push local changes to server.
- `GET /reports/trial-balance`: Generate financial reports.
- `POST /import/members`: Bulk import members via CSV/Excel.
