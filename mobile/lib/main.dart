import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'services/api_service.dart';

void main() {
  final apiService = ApiService(baseUrl: 'http://localhost:3000');
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
