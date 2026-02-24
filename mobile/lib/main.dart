import 'package:flutter/material.dart';
import 'dart:io';
import 'screens/login_screen.dart';
import 'services/api_service.dart';

void main() {
  // Use 10.0.2.2 for Android emulator, localhost for others
  final String baseUrl = Platform.isAndroid 
      ? 'http://10.0.2.2:3000' 
      : 'http://localhost:3000';
      
  final apiService = ApiService(baseUrl: baseUrl);
  runApp(SanctusApp(apiService: apiService));
}

class SanctusApp extends StatelessWidget {
  final ApiService apiService;

  const SanctusApp({super.key, required this.apiService});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sanctus',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: LoginScreen(apiService: apiService),
    );
  }
}
