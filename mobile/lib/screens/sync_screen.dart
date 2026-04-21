import 'package:flutter/material.dart';
import '../services/offline_api_service.dart';

class SyncScreen extends StatefulWidget {
  final OfflineApiService offlineApiService;
  const SyncScreen({super.key, required this.offlineApiService});

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  bool _isSyncing = false;
  String _status = 'Ready to sync';

  Future<void> _sync() async {
    setState(() {
      _isSyncing = true;
      _status = 'Syncing...';
    });

    try {
      await widget.offlineApiService.triggerSync();
      if (mounted) {
        setState(() {
          _status = 'Sync completed';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _status = 'Sync failed: $e';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSyncing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sync Data')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_isSyncing)
                const CircularProgressIndicator()
              else
                const Icon(Icons.cloud_sync, size: 80, color: Colors.blue),
              const SizedBox(height: 32),
              Text(
                _status, 
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSyncing ? null : _sync,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Sync Now'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
