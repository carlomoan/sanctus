import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'database_service.dart';
import 'api_service.dart';
import '../models/user.dart';
import '../models/family.dart';
import '../models/budget.dart';

class SyncService {
  final DatabaseService _databaseService = DatabaseService.instance;
  final ApiService _apiService;
  
  SyncService(this._apiService);

  // Sync status stream
  final StreamController<SyncStatus> _syncStatusController = StreamController<SyncStatus>.broadcast();
  Stream<SyncStatus> get syncStatusStream => _syncStatusController.stream;

  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;

  Future<void> startSync() async {
    if (_isSyncing) return;
    
    _isSyncing = true;
    _syncStatusController.add(SyncStatus.running);
    
    try {
      // Check connectivity
      final connectivityResult = await Connectivity().checkConnectivity();
      if (connectivityResult == ConnectivityResult.none) {
        _syncStatusController.add(SyncStatus.noConnection);
        return;
      }

      // Get pending sync items
      final pendingItems = await _databaseService.getPendingSyncItems();
      
      for (final item in pendingItems) {
        try {
          await _processSyncItem(item);
          await _databaseService.markSyncItemCompleted(item['id']);
        } catch (e) {
          await _databaseService.markSyncItemFailed(item['id'], e.toString());
          _logSyncError(item['table_name'] as String?, e.toString());
        }
      }

      // After uploading local changes, download remote changes
      await _downloadRemoteChanges();
      
      _syncStatusController.add(SyncStatus.completed);
    } catch (e) {
      _syncStatusController.add(SyncStatus.error);
      _logSyncError(null, 'Sync failed: $e');
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _processSyncItem(Map<String, dynamic> item) async {
    final tableName = item['table_name'] as String;
    final recordId = item['record_id'] as String;
    final operation = item['operation'] as String;
    final data = jsonDecode(item['data'] as String);

    switch (tableName) {
      case 'members':
        await _syncMember(operation, data);
        break;
      case 'families':
        await _syncFamily(operation, data);
        break;
      case 'parishes':
        await _syncParish(operation, data);
        break;
      case 'income_transactions':
        await _syncIncomeTransaction(operation, data);
        break;
      case 'expense_vouchers':
        await _syncExpenseVoucher(operation, data);
        break;
      case 'sacrament_records':
        await _syncSacrament(operation, data);
        break;
      case 'budgets':
        await _syncBudget(operation, data);
        break;
    }
  }

  Future<void> _syncMember(String operation, Map<String, dynamic> data) async {
    switch (operation) {
      case 'create':
        await _apiService.createMember(data);
        break;
      case 'update':
        await _apiService.updateMember(data['id'], data);
        break;
      case 'delete':
        // Implement delete if API supports it
        break;
    }
  }

  Future<void> _syncFamily(String operation, Map<String, dynamic> data) async {
    switch (operation) {
      case 'create':
        // For now, skip family sync as the API might need specific request objects
        // This can be implemented later when the API is fully integrated
        break;
    }
  }

  Future<void> _syncParish(String operation, Map<String, dynamic> data) async {
    switch (operation) {
      case 'create':
        await _apiService.createParish(data);
        break;
      case 'update':
        await _apiService.updateParish(data['id'], data);
        break;
    }
  }

  Future<void> _syncIncomeTransaction(String operation, Map<String, dynamic> data) async {
    switch (operation) {
      case 'create':
        await _apiService.createIncomeTransaction(data);
        break;
    }
  }

  Future<void> _syncExpenseVoucher(String operation, Map<String, dynamic> data) async {
    switch (operation) {
      case 'create':
        await _apiService.createExpenseVoucher(data);
        break;
    }
  }

  Future<void> _syncSacrament(String operation, Map<String, dynamic> data) async {
    switch (operation) {
      case 'create':
        await _apiService.createSacrament(data);
        break;
    }
  }

  Future<void> _syncBudget(String operation, Map<String, dynamic> data) async {
    switch (operation) {
      case 'create':
        // For now, skip budget sync as the API might need specific request objects
        // This can be implemented later when the API is fully integrated
        break;
      case 'update':
        // For now, skip budget sync as the API might need specific request objects
        // This can be implemented later when the API is fully integrated
        break;
    }
  }

  Future<void> _downloadRemoteChanges() async {
    final currentUser = _apiService.currentUser;
    if (currentUser == null) return;

    final lastSync = await _databaseService.getSetting('last_sync');
    final lastSyncTime = lastSync != null ? DateTime.parse(lastSync) : DateTime.fromMillisecondsSinceEpoch(0);

    try {
      await _downloadAndSyncParishes(currentUser, lastSyncTime);
      await _downloadAndSyncMembers(currentUser, lastSyncTime);
      await _downloadAndSyncFamilies(currentUser, lastSyncTime);
      await _downloadAndSyncSacraments(currentUser, lastSyncTime);
      await _downloadAndSyncTransactions(currentUser, lastSyncTime);
      await _downloadAndSyncBudgets(currentUser, lastSyncTime);

      await _databaseService.setSetting('last_sync', DateTime.now().toIso8601String());
    } catch (e) {
      _logSyncError(null, 'Download sync failed: $e');
      rethrow;
    }
  }

  Future<void> _downloadAndSyncParishes(User currentUser, DateTime lastSyncTime) async {
    try {
      final parishes = await _apiService.getParishes();
      for (final parish in parishes) {
        await _upsertRecord('parishes', parish.toJson());
      }
    } catch (e) {
      _logSyncError('parishes', 'Failed to sync parishes: $e');
    }
  }

  Future<void> _downloadAndSyncMembers(User currentUser, DateTime lastSyncTime) async {
    try {
      final parishId = currentUser.parishId;
      if (parishId == null) return;

      final members = await _apiService.getMembers(parishId: parishId);
      for (final member in members) {
        await _upsertRecord('members', member.toJson());
      }
    } catch (e) {
      _logSyncError('members', 'Failed to sync members: $e');
    }
  }

  Future<void> _downloadAndSyncFamilies(User currentUser, DateTime lastSyncTime) async {
    try {
      final parishId = currentUser.parishId;
      if (parishId == null) return;

      final families = await _apiService.getFamilies(parishId: parishId);
      for (final family in families) {
        await _upsertRecord('families', family.toJson());
      }
    } catch (e) {
      _logSyncError('families', 'Failed to sync families: $e');
    }
  }

  Future<void> _downloadAndSyncSacraments(User currentUser, DateTime lastSyncTime) async {
    try {
      final parishId = currentUser.parishId;
      if (parishId == null) return;

      final sacraments = await _apiService.getSacraments(parishId: parishId);
      for (final sacrament in sacraments) {
        await _upsertRecord('sacrament_records', sacrament.toJson());
      }
    } catch (e) {
      _logSyncError('sacraments', 'Failed to sync sacraments: $e');
    }
  }

  Future<void> _downloadAndSyncTransactions(User currentUser, DateTime lastSyncTime) async {
    try {
      final parishId = currentUser.parishId;
      if (parishId == null) return;

      final incomeTransactions = await _apiService.getIncomeTransactions(parishId);
      for (final transaction in incomeTransactions) {
        await _upsertRecord('income_transactions', transaction.toJson());
      }

      final expenseVouchers = await _apiService.getExpenseVouchers(parishId);
      for (final voucher in expenseVouchers) {
        await _upsertRecord('expense_vouchers', voucher.toJson());
      }
    } catch (e) {
      _logSyncError('transactions', 'Failed to sync transactions: $e');
    }
  }

  Future<void> _downloadAndSyncBudgets(User currentUser, DateTime lastSyncTime) async {
    try {
      final parishId = currentUser.parishId;
      if (parishId == null) return;

      final currentYear = DateTime.now().year;
      final budgets = await _apiService.getBudgets(parishId, fiscalYear: currentYear);
      for (final budget in budgets) {
        await _upsertRecord('budgets', budget.toJson());
      }
    } catch (e) {
      _logSyncError('budgets', 'Failed to sync budgets: $e');
    }
  }

  Future<void> _upsertRecord(String tableName, Map<String, dynamic> data) async {
    final existingRecords = await _databaseService.query(
      tableName,
      where: 'id = ?',
      whereArgs: [data['id']],
    );

    if (existingRecords.isNotEmpty) {
      data['sync_status'] = 'synced';
      data['last_sync'] = DateTime.now().toIso8601String();
      await _databaseService.update(
        tableName,
        data,
        where: 'id = ?',
        whereArgs: [data['id']],
      );
    } else {
      data['sync_status'] = 'synced';
      data['last_sync'] = DateTime.now().toIso8601String();
      await _databaseService.insert(tableName, data);
    }
  }

  Future<void> _logSyncError(String? tableName, String error) async {
    final db = await _databaseService.database;
    await db.insert('sync_log', {
      'operation': 'sync',
      'table_name': tableName ?? 'general',
      'record_id': null,
      'status': 'error',
      'message': error,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<SyncStats> getSyncStats() async {
    final pendingCount = (await _databaseService.getPendingSyncItems()).length;
    final lastSync = await _databaseService.getSetting('last_sync');
    
    return SyncStats(
      pendingCount: pendingCount,
      lastSyncTime: lastSync != null ? DateTime.parse(lastSync) : null,
      isOnline: await _isOnline(),
    );
  }

  Future<bool> _isOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  void dispose() {
    _syncStatusController.close();
  }
}

enum SyncStatus {
  idle,
  running,
  completed,
  error,
  noConnection,
}

class SyncStats {
  final int pendingCount;
  final DateTime? lastSyncTime;
  final bool isOnline;

  SyncStats({
    required this.pendingCount,
    this.lastSyncTime,
    required this.isOnline,
  });
}
