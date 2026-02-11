import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'database_helper.dart';
import 'api_service.dart';

class SyncService {
  final ApiService apiService;
  final String deviceId; // Should be persistent and unique per device

  SyncService({required this.apiService, required this.deviceId});

  Future<void> sync() async {
    // 1. Check Connectivity
    var connectivityResult = await (Connectivity().checkConnectivity());
    if (connectivityResult == ConnectivityResult.none) {
      print('No internet connection. Skipping sync.');
      return;
    }

    // 2. Get Pending Changes from Local DB
    final pendingChanges = await DatabaseHelper.instance.getSyncQueue();
    if (pendingChanges.isEmpty) {
      print('No pending changes to sync.');
      return;
    }

    // 3. Prepare Payload
    final changesPayload = pendingChanges.map((row) {
      return {
        'table': row['table_name'],
        'operation': row['operation'],
        'data': jsonDecode(row['data']),
        'timestamp': row['created_at'],
        'record_id': row['record_id'],
        'queue_id': row['id'],
      };
    }).toList();

    final requestBody = {
      'device_id': deviceId,
      'changes': changesPayload.map((c) => {
        'table': c['table'],
        'operation': c['operation'],
        'data': c['data'],
        'timestamp': c['timestamp'],
      }).toList(),
    };

    try {
      // 4. Send to Backend using apiService headers
      final response = await http.post(
        Uri.parse('${apiService.baseUrl}/sync'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${apiService.getToken()}',
        },
        body: jsonEncode(requestBody),
      );

      if (response.statusCode == 200) {
        print('Sync successful: ${response.body}');
        
        // 5. Clear Sync Queue on Success
        // In a robust system, the backend should return IDs of successfully processed items.
        // For now, we assume all sent were processed if 200 OK.
        for (var item in changesPayload) {
          await DatabaseHelper.instance.removeFromSyncQueue(item['queue_id']);
          
          // Optionally mark the actual record as is_synced = 1
          // await DatabaseHelper.instance.markAsSynced(item['table'], item['record_id']);
        }
      } else {
        print('Sync failed: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('Sync error: $e');
    }
  }
}
