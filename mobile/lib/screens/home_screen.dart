import 'package:flutter/material.dart';
import 'collection_screen.dart';
import 'sync_screen.dart';
import 'member_list_screen.dart';
import 'expense_screen.dart';
import 'sacrament_screen.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class HomeScreen extends StatelessWidget {
  final ApiService apiService;

  const HomeScreen({super.key, required this.apiService});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sanctus'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (context) => LoginScreen(apiService: apiService),
                ),
              );
            },
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.church, size: 80, color: Colors.blueGrey),
              const SizedBox(height: 16),
              const Text(
                'Sanctus Mobile', 
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const Text(
                'Parish Management System', 
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const SizedBox(height: 48),
              
              Expanded(
                child: ListView(
                  children: [
                    _buildMenuButton(
                      context,
                      icon: Icons.add_circle_outline,
                      label: 'Record Collection',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => CollectionScreen(apiService: apiService)),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildMenuButton(
                      context,
                      icon: Icons.receipt_long,
                      label: 'Record Expense',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => ExpenseScreen(apiService: apiService)),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildMenuButton(
                      context,
                      icon: Icons.people_outline,
                      label: 'Manage Members',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => MemberListScreen(apiService: apiService)),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildMenuButton(
                      context,
                      icon: Icons.history_edu,
                      label: 'Record Sacrament',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => SacramentScreen(apiService: apiService)),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildMenuButton(
                      context,
                      icon: Icons.sync,
                      label: 'Sync Data',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => SyncScreen(apiService: apiService)),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuButton(BuildContext context, {
    required IconData icon, 
    required String label, 
    required VoidCallback onPressed
  }) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 24),
        label: Text(label, style: const TextStyle(fontSize: 18)),
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          alignment: Alignment.centerLeft,
        ),
      ),
    );
  }
}
