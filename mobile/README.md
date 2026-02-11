# Sanctus Mobile

This directory contains the Flutter application for Sanctus, targeting Windows, Linux, Android, and iOS.

## Prerequisites
- Flutter SDK
- Android Studio / Xcode (for mobile development)
- Linux/Windows build tools (for desktop development)

## Initialization
Since the Flutter CLI was not detected in the environment, please initialize the project by running the following command in this directory:

```bash
flutter create . --org com.sanctus --platforms=android,ios,linux,windows
```

## Architecture
This app will use:
- **Provider/Riverpod** or **Bloc** for state management.
- **SQLite** (via `sqflite` or `drift`) for local offline storage.
- **Dio** or **http** for API communication with the Sanctus backend.
