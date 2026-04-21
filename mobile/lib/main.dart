import 'package:flutter/material.dart';
import 'dart:io';
import 'screens/login_screen.dart';
import 'services/api_service.dart';
import 'services/database_service.dart';
import 'services/sync_service.dart';
import 'services/offline_api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Use the IP address that the device is actually trying to connect to
  String baseUrl;
  if (Platform.isAndroid) {
    // The error shows the app is trying to connect to 10.0.22.22:3000
    baseUrl = 'http://10.0.22.22:3000'; // Use the IP from the error message
  } else {
    baseUrl = 'http://localhost:3000';
  }
      
  // Initialize services
  final apiService = ApiService(baseUrl: baseUrl);
  final syncService = SyncService(apiService);
  final offlineApiService = OfflineApiService(apiService, syncService);
  
  // Initialize database
  await DatabaseService.instance.database;
  
  runApp(SanctusApp(offlineApiService: offlineApiService));
}

class SanctusApp extends StatelessWidget {
  final OfflineApiService offlineApiService;

  const SanctusApp({super.key, required this.offlineApiService});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sanctus',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: LoginScreen(offlineApiService: offlineApiService),
    );
  }
}
