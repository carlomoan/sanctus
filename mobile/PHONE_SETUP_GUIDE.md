# 📱 Running Sanctus Mobile on Your Phone

## 🚀 Quick Start

### **Option 1: Automated Script (Recommended)**
```bash
cd /home/andrew/RustAppDevs/sanctus/mobile
./run_on_phone.sh
```

### **Option 2: Manual Steps**
```bash
cd /home/andrew/RustAppDevs/sanctus/mobile
flutter pub get
flutter devices
flutter run -d <your_device_id>
```

## 📋 Setup Instructions

### **🔧 Android Setup**

#### **1. Enable Developer Options**
```
Settings → About Phone → Build Number (tap 7 times)
```

#### **2. Enable USB Debugging**
```
Settings → Developer Options → USB Debugging (enable)
```

#### **3. Connect Phone**
- Connect via USB cable
- Select "File Transfer" mode
- Allow USB debugging authorization

#### **4. Verify Connection**
```bash
adb devices
flutter devices
```

### **🍎 iOS Setup**

#### **1. Enable Developer Mode (iOS 16+)**
```
Settings → Privacy & Security → Developer Mode (enable)
```

#### **2. Trust Computer**
- Connect iPhone to Mac via USB
- Tap "Trust" on iPhone prompt

#### **3. Install Dependencies (Mac only)**
```bash
brew install cocoapods
cd ios && pod install && cd ..
```

#### **4. Verify Connection**
```bash
flutter devices
```

## 🛠️ Troubleshooting

### **❌ No Device Found**
```bash
# Check Android devices
adb devices

# Check iOS devices (Mac only)
xcrun simctl list

# Restart adb server
adb kill-server && adb start-server

# Check USB debugging
flutter doctor -v
```

### **❌ USB Debugging Issues**
- Check USB cable (try different cable)
- Enable "USB Debugging (Security settings)"
- Try different USB port
- Revoke USB authorizations and re-authorize

### **❌ iOS Build Issues**
```bash
# Clean and rebuild
flutter clean
flutter pub get
cd ios && pod install --repo-update
cd ..
flutter run
```

### **❌ Android Build Issues**
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

## 📱 Device-Specific Notes

### **Android**
- Minimum API Level: 21 (Android 5.0)
- Required permissions: Camera, Storage, Network
- Grant permissions when prompted

### **iOS**
- Minimum iOS Version: 11.0
- Requires Xcode on Mac for building
- Test on real device recommended

## 🔧 Development Features

### **🔥 Hot Reload**
- Make code changes while app is running
- Press 'r' in terminal for hot reload
- Press 'R' for hot restart

### **🐛 Debug Mode**
- App runs in debug mode by default
- Use Flutter Inspector for UI debugging
- Check console logs for errors

### **📊 Performance**
- Use `flutter run --profile` for performance testing
- Use `flutter run --release` for production testing

## 🌐 Network Configuration

### **Backend URL**
Update the API base URL in `lib/services/api_service.dart`:
```dart
ApiService({required this.baseUrl}) // e.g., "http://192.168.1.100:8080"
```

### **Local Development**
- Use your computer's IP address (not localhost)
- Ensure phone and computer are on same WiFi network
- Check firewall settings

## 📦 Build for Release

### **Android APK**
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### **Android App Bundle**
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### **iOS (Mac only)**
```bash
flutter build ios --release
# Then use Xcode to archive and distribute
```

## 🎯 Next Steps

1. **Connect your phone** via USB
2. **Enable USB debugging** (Android) or **trust computer** (iOS)
3. **Run the script**: `./run_on_phone.sh`
4. **Choose your device** from the list
5. **App will install and launch** automatically

## 🆘 Need Help?

If you encounter issues:
1. Check `flutter doctor -v` for detailed diagnostics
2. Ensure phone drivers are installed
3. Try different USB cable/port
4. Check network connectivity for API calls
5. Review console logs for specific errors

---

**🚀 Ready to run Sanctus Mobile on your phone!**
