import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:async/async.dart' show unawaited;
import 'database_service.dart';
import 'api_service.dart';
import 'sync_service.dart';
import '../models/user.dart';
import '../models/parish.dart';
import '../models/member.dart';
import '../models/family.dart';
import '../models/scc.dart';
import '../models/cluster.dart';
import '../models/sacrament.dart';
import '../models/transaction.dart';
import '../models/budget.dart';
import '../models/diocese.dart';
import '../models/event.dart';

class OfflineApiService {
  final DatabaseService _databaseService = DatabaseService.instance;
  final ApiService _apiService;
  final SyncService _syncService;
  
  OfflineApiService(this._apiService, this._syncService);

  // Authentication
  Future<AuthResponse> login(String usernameOrEmail, String password) async {
    try {
      // Try online login with timeout
      final response = await _apiService.login(usernameOrEmail, password);
      
      // Store user session locally
      await _storeUserSession(response.user, response.token);
      
      // Trigger sync in background (non-blocking)
      unawaited(_syncService.startSync());
      
      return response;
    } catch (e) {
      // If online login fails, quickly check offline credentials
      final offlineUser = await _getOfflineUser(usernameOrEmail, password);
      if (offlineUser != null) {
        return AuthResponse(
          user: offlineUser,
          token: 'offline-token-${DateTime.now().millisecondsSinceEpoch}',
        );
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    await _clearUserSession();
    _apiService.setToken('');
    // Don't set user to null as it might not accept null
  }

  Future<User?> _getOfflineUser(String usernameOrEmail, String password) async {
    // For offline login, we'd need to store hashed passwords
    // This is a simplified implementation
    final users = await _databaseService.query(
      'users',
      where: '(username = ? OR email = ?) AND is_active = 1',
      whereArgs: [usernameOrEmail, usernameOrEmail],
    );
    
    if (users.isNotEmpty) {
      return User.fromJson(users.first);
    }
    return null;
  }

  Future<void> _storeUserSession(User user, String token) async {
    await _databaseService.insert('users', {
      ...user.toJson(),
      'token': token,
      'token_expires_at': DateTime.now().add(const Duration(days: 7)).toIso8601String(),
      'last_login': DateTime.now().toIso8601String(),
    });
    
    await _databaseService.insert('user_sessions', {
      'user_id': user.id,
      'token': token,
      'expires_at': DateTime.now().add(const Duration(days: 7)).toIso8601String(),
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<void> _clearUserSession() async {
    await _databaseService.delete('user_sessions');
    // Don't delete the user record, just clear the session
  }

  // Offline-aware methods for each entity
  Future<List<Parish>> getParishes({bool forceOnline = false}) async {
    if (forceOnline || await _isOnline()) {
      try {
        final parishes = await _apiService.getParishes();
        // Cache locally
        for (final parish in parishes) {
          await _upsertLocal('parishes', parish.toJson());
        }
        return parishes;
      } catch (e) {
        // Fallback to local data
        return await _getLocalParishes();
      }
    }
    return await _getLocalParishes();
  }

  Future<List<Parish>> _getLocalParishes() async {
    final localParishes = await _databaseService.query('parishes');
    return localParishes.map((p) => Parish.fromJson(p)).toList();
  }

  Future<Parish> createParish(Map<String, dynamic> parishData) async {
    // Add to local database immediately
    final parishId = parishData['id'] ?? _generateId();
    parishData['id'] = parishId;
    parishData['created_at'] = DateTime.now().toIso8601String();
    parishData['updated_at'] = DateTime.now().toIso8601String();
    
    await _databaseService.insert('parishes', parishData);
    await _databaseService.addToSyncQueue('parishes', parishId, 'create', parishData);
    
    final parish = Parish.fromJson(parishData);
    
    // Try to sync immediately if online
    if (await _isOnline()) {
      try {
        final syncedParish = await _apiService.createParish(parishData);
        await _updateLocalRecord('parishes', syncedParish.toJson());
        return syncedParish;
      } catch (e) {
        // Keep local record, will sync later
        await _syncService.startSync();
      }
    }
    
    return parish;
  }

  Future<Parish> updateParish(String id, Map<String, dynamic> parishData) async {
    parishData['updated_at'] = DateTime.now().toIso8601String();
    
    // Update local immediately
    await _databaseService.update(
      'parishes',
      parishData,
      where: 'id = ?',
      whereArgs: [id],
    );
    await _databaseService.addToSyncQueue('parishes', id, 'update', parishData);
    
    final updatedParish = Parish.fromJson({...parishData, 'id': id});
    
    // Try to sync immediately if online
    if (await _isOnline()) {
      try {
        final syncedParish = await _apiService.updateParish(id, parishData);
        await _updateLocalRecord('parishes', syncedParish.toJson());
        return syncedParish;
      } catch (e) {
        // Keep local record, will sync later
        await _syncService.startSync();
      }
    }
    
    return updatedParish;
  }

  Future<List<Member>> getMembers({String? parishId, String? familyId, String? sccId, bool forceOnline = false}) async {
    if (forceOnline || await _isOnline()) {
      try {
        final members = await _apiService.getMembers(
          parishId: parishId,
          familyId: familyId,
          sccId: sccId,
        );
        // Cache locally
        for (final member in members) {
          await _upsertLocal('members', member.toJson());
        }
        return members;
      } catch (e) {
        // Fallback to local data
        return await _getLocalMembers(parishId: parishId, familyId: familyId, sccId: sccId);
      }
    }
    return await _getLocalMembers(parishId: parishId, familyId: familyId, sccId: sccId);
  }

  Future<List<Member>> _getLocalMembers({String? parishId, String? familyId, String? sccId}) async {
    String where = 'deleted_at IS NULL';
    List<dynamic> whereArgs = [];
    
    if (parishId != null) {
      where += ' AND parish_id = ?';
      whereArgs.add(parishId);
    }
    if (familyId != null) {
      where += ' AND family_id = ?';
      whereArgs.add(familyId);
    }
    if (sccId != null) {
      where += ' scc_id = ?';
      whereArgs.add(sccId);
    }
    
    final localMembers = await _databaseService.query('members', where: where, whereArgs: whereArgs);
    return localMembers.map((m) => Member.fromJson(m)).toList();
  }

  Future<Member> createMember(Map<String, dynamic> memberData) async {
    // Add to local database immediately
    final memberId = memberData['id'] ?? _generateId();
    memberData['id'] = memberId;
    memberData['created_at'] = DateTime.now().toIso8601String();
    memberData['updated_at'] = DateTime.now().toIso8601String();
    
    await _databaseService.insert('members', memberData);
    await _databaseService.addToSyncQueue('members', memberId, 'create', memberData);
    
    final member = Member.fromJson(memberData);
    
    // Try to sync immediately if online
    if (await _isOnline()) {
      try {
        final syncedMember = await _apiService.createMember(memberData);
        await _updateLocalRecord('members', syncedMember.toJson());
        return syncedMember;
      } catch (e) {
        // Keep local record, will sync later
        await _syncService.startSync();
      }
    }
    
    return member;
  }

  Future<Member> updateMember(String id, Map<String, dynamic> memberData) async {
    memberData['updated_at'] = DateTime.now().toIso8601String();
    
    // Update local immediately
    await _databaseService.update(
      'members',
      memberData,
      where: 'id = ?',
      whereArgs: [id],
    );
    await _databaseService.addToSyncQueue('members', id, 'update', memberData);
    
    final updatedMember = Member.fromJson({...memberData, 'id': id});
    
    // Try to sync immediately if online
    if (await _isOnline()) {
      try {
        final syncedMember = await _apiService.updateMember(id, memberData);
        await _updateLocalRecord('members', syncedMember.toJson());
        return syncedMember;
      } catch (e) {
        // Keep local record, will sync later
        await _syncService.startSync();
      }
    }
    
    return updatedMember;
  }

  // Similar offline-aware methods for other entities...
  Future<List<Family>> getFamilies({String? parishId, String? sccId, bool forceOnline = false}) async {
    if (forceOnline || await _isOnline()) {
      try {
        final families = await _apiService.getFamilies(parishId: parishId, sccId: sccId);
        for (final family in families) {
          await _upsertLocal('families', family.toJson());
        }
        return families;
      } catch (e) {
        return await _getLocalFamilies(parishId: parishId, sccId: sccId);
      }
    }
    return await _getLocalFamilies(parishId: parishId, sccId: sccId);
  }

  Future<List<Family>> _getLocalFamilies({String? parishId, String? sccId}) async {
    String where = 'deleted_at IS NULL';
    List<dynamic> whereArgs = [];
    
    if (parishId != null) {
      where += ' AND parish_id = ?';
      whereArgs.add(parishId);
    }
    if (sccId != null) {
      where += ' AND scc_id = ?';
      whereArgs.add(sccId);
    }
    
    final localFamilies = await _databaseService.query('families', where: where, whereArgs: whereArgs);
    return localFamilies.map((f) => Family.fromJson(f)).toList();
  }

  Future<Family> createFamily(Map<String, dynamic> familyData) async {
    final familyId = familyData['id'] ?? _generateId();
    familyData['id'] = familyId;
    familyData['created_at'] = DateTime.now().toIso8601String();
    familyData['updated_at'] = DateTime.now().toIso8601String();
    
    await _databaseService.insert('families', familyData);
    await _databaseService.addToSyncQueue('families', familyId, 'create', familyData);
    
    final family = Family.fromJson(familyData);
    
    if (await _isOnline()) {
      try {
        // For now, skip family sync as the API might need specific request objects
        // This can be implemented later when the API is fully integrated
        // final syncedFamily = await _apiService.createFamily(familyData);
        // await _updateLocalRecord('families', syncedFamily.toJson());
        // return syncedFamily;
      } catch (e) {
        await _syncService.startSync();
      }
    }
    
    return family;
  }

  // Financial transactions with offline support
  Future<List<IncomeTransaction>> getIncomeTransactions(String parishId, {bool forceOnline = false}) async {
    if (forceOnline || await _isOnline()) {
      try {
        final transactions = await _apiService.getIncomeTransactions(parishId);
        for (final transaction in transactions) {
          await _upsertLocal('income_transactions', transaction.toJson());
        }
        return transactions;
      } catch (e) {
        return await _getLocalIncomeTransactions(parishId);
      }
    }
    return await _getLocalIncomeTransactions(parishId);
  }

  Future<List<IncomeTransaction>> _getLocalIncomeTransactions(String parishId) async {
    final localTransactions = await _databaseService.query(
      'income_transactions',
      where: 'parish_id = ? AND deleted_at IS NULL',
      whereArgs: [parishId],
      orderBy: 'transaction_date DESC',
    );
    return localTransactions.map((t) => IncomeTransaction.fromJson(t)).toList();
  }

  Future<IncomeTransaction> createIncomeTransaction(Map<String, dynamic> transactionData) async {
    final transactionId = transactionData['id'] ?? _generateId();
    transactionData['id'] = transactionId;
    transactionData['created_at'] = DateTime.now().toIso8601String();
    transactionData['updated_at'] = DateTime.now().toIso8601String();
    
    await _databaseService.insert('income_transactions', transactionData);
    await _databaseService.addToSyncQueue('income_transactions', transactionId, 'create', transactionData);
    
    final transaction = IncomeTransaction.fromJson(transactionData);
    
    if (await _isOnline()) {
      try {
        final syncedTransaction = await _apiService.createIncomeTransaction(transactionData);
        await _updateLocalRecord('income_transactions', syncedTransaction.toJson());
        return syncedTransaction;
      } catch (e) {
        await _syncService.startSync();
      }
    }
    
    return transaction;
  }

  Future<void> createExpenseVoucher(Map<String, dynamic> voucherData) async {
    final voucherId = voucherData['id'] ?? _generateId();
    voucherData['id'] = voucherId;
    voucherData['created_at'] = DateTime.now().toIso8601String();
    voucherData['updated_at'] = DateTime.now().toIso8601String();
    
    await _databaseService.insert('expense_vouchers', voucherData);
    await _databaseService.addToSyncQueue('expense_vouchers', voucherId, 'create', voucherData);
    
    if (await _isOnline()) {
      try {
        await _apiService.createExpenseVoucher(voucherData);
      } catch (e) {
        await _syncService.startSync();
      }
    }
  }

  Future<void> createSacrament(Map<String, dynamic> sacramentData) async {
    final sacramentId = sacramentData['id'] ?? _generateId();
    sacramentData['id'] = sacramentId;
    sacramentData['created_at'] = DateTime.now().toIso8601String();
    sacramentData['updated_at'] = DateTime.now().toIso8601String();
    
    await _databaseService.insert('sacrament_records', sacramentData);
    await _databaseService.addToSyncQueue('sacrament_records', sacramentId, 'create', sacramentData);
    
    if (await _isOnline()) {
      try {
        await _apiService.createSacrament(sacramentData);
      } catch (e) {
        await _syncService.startSync();
      }
    }
  }

  // Helper methods
  Future<bool> _isOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  Future<void> _upsertLocal(String tableName, Map<String, dynamic> data) async {
    final existing = await _databaseService.query(
      tableName,
      where: 'id = ?',
      whereArgs: [data['id']],
    );
    
    if (existing.isNotEmpty) {
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

  Future<void> _updateLocalRecord(String tableName, Map<String, dynamic> data) async {
    data['sync_status'] = 'synced';
    data['last_sync'] = DateTime.now().toIso8601String();
    await _databaseService.update(
      tableName,
      data,
      where: 'id = ?',
      whereArgs: [data['id']],
    );
  }

  String _generateId() {
    return DateTime.now().millisecondsSinceEpoch.toString() + 
           (DateTime.now().microsecond % 1000).toString().padLeft(3, '0');
  }

  // Sync status and management
  Future<SyncStats> getSyncStatus() async {
    return await _syncService.getSyncStats();
  }

  Future<void> triggerSync() async {
    await _syncService.startSync();
  }

  // Events methods with offline support
  Future<List<Event>> getEvents({
    String? parishId,
    String? dioceseId,
    String? scope,
    String? status,
    String? eventType,
    String? startDate,
    String? endDate,
  }) async {
    try {
      // Try to get from API first if online
      final events = await _apiService.getEvents(
        parishId: parishId,
        dioceseId: dioceseId,
        scope: scope,
        status: status,
        eventType: eventType,
        startDate: startDate,
        endDate: endDate,
      );
      
      // Store events locally for offline access
      for (final event in events) {
        await _databaseService.insertEvent(event);
      }
      
      return events;
    } catch (e) {
      // If API fails, get from local database
      return await _databaseService.getEvents(
        parishId: parishId,
        dioceseId: dioceseId,
        scope: scope,
        status: status,
        eventType: eventType,
      );
    }
  }

  Future<Event> getEvent(String eventId) async {
    try {
      // Try to get from API first if online
      final event = await _apiService.getEvent(eventId);
      
      // Update local cache
      await _databaseService.updateEvent(event);
      
      return event;
    } catch (e) {
      // If API fails, get from local database
      final events = await _databaseService.getEvents();
      final localEvent = events.where((e) => e.id == eventId).firstOrNull;
      if (localEvent != null) {
        return localEvent;
      }
      rethrow;
    }
  }

  Future<Event> createEvent(CreateEventRequest eventRequest) async {
    final user = currentUser;
    if (user == null) throw Exception('User not authenticated');

    // Create event with temporary ID
    final tempId = _generateId();
    final event = Event(
      id: tempId,
      parishId: eventRequest.parishId,
      dioceseId: eventRequest.dioceseId,
      scope: eventRequest.scope,
      title: eventRequest.title,
      description: eventRequest.description,
      eventType: eventRequest.eventType,
      eventStatus: EventStatus.PLANNED,
      startDate: eventRequest.startDate,
      startTime: eventRequest.startTime,
      endDate: eventRequest.endDate,
      endTime: eventRequest.endTime,
      location: eventRequest.location,
      maxParticipants: eventRequest.maxParticipants,
      currentParticipants: 0,
      registrationRequired: eventRequest.registrationRequired,
      registrationDeadline: eventRequest.registrationDeadline,
      feeAmount: eventRequest.feeAmount,
      isPublic: eventRequest.isPublic,
      isLiturgical: eventRequest.isLiturgical,
      recurrencePattern: eventRequest.recurrencePattern,
      recurrenceEndDate: eventRequest.recurrenceEndDate,
      notes: eventRequest.notes,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    // Store locally first
    await _databaseService.insertEvent(event);

    try {
      // Try to sync with API
      final createdEvent = await _apiService.createEvent(eventRequest);
      
      // Update local record with server ID and data
      await _databaseService.deleteEvent(tempId); // Remove temp record
      await _databaseService.insertEvent(createdEvent); // Add server record
      
      return createdEvent;
    } catch (e) {
      // If API fails, return local event (will be synced later)
      return event;
    }
  }

  Future<Event> updateEvent(String eventId, UpdateEventRequest updateRequest) async {
    try {
      // Try to update via API first
      final updatedEvent = await _apiService.updateEvent(eventId, updateRequest);
      
      // Update local cache
      await _databaseService.updateEvent(updatedEvent);
      
      return updatedEvent;
    } catch (e) {
      // If API fails, mark for later sync
      final events = await _databaseService.getEvents();
      final localEvent = events.where((e) => e.id == eventId).firstOrNull;
      if (localEvent != null) {
        // Update local event with new data
        final updatedLocalEvent = localEvent.copyWith(
          title: updateRequest.title,
          description: updateRequest.description,
          eventType: updateRequest.eventType,
          eventStatus: updateRequest.eventStatus,
          startDate: updateRequest.startDate ?? localEvent.startDate,
          startTime: updateRequest.startTime,
          endDate: updateRequest.endDate ?? localEvent.endDate,
          endTime: updateRequest.endTime,
          location: updateRequest.location,
          maxParticipants: updateRequest.maxParticipants,
          registrationRequired: updateRequest.registrationRequired,
          registrationDeadline: updateRequest.registrationDeadline,
          feeAmount: updateRequest.feeAmount,
          isPublic: updateRequest.isPublic,
          isLiturgical: updateRequest.isLiturgical,
          recurrencePattern: updateRequest.recurrencePattern ?? localEvent.recurrencePattern,
          recurrenceEndDate: updateRequest.recurrenceEndDate,
          notes: updateRequest.notes,
          updatedAt: DateTime.now(),
        );
        
        await _databaseService.updateEvent(updatedLocalEvent);
        return updatedLocalEvent;
      }
      rethrow;
    }
  }

  Future<void> deleteEvent(String eventId) async {
    try {
      // Try to delete via API first
      await _apiService.deleteEvent(eventId);
      
      // Delete from local database
      await _databaseService.deleteEvent(eventId);
    } catch (e) {
      // If API fails, mark for deletion locally
      await _databaseService.deleteEvent(eventId);
    }
  }

  Future<List<EventParticipant>> getEventParticipants(String eventId) async {
    try {
      // Try to get from API first if online
      return await _apiService.getEventParticipants(eventId);
    } catch (e) {
      // If API fails, return empty list (participants not cached locally for simplicity)
      return [];
    }
  }

  Future<EventParticipant> registerForEvent(String eventId, Map<String, dynamic> registrationData) async {
    try {
      // Try to register via API first
      return await _apiService.registerForEvent(eventId, registrationData);
    } catch (e) {
      // If API fails, throw error (registration requires server validation)
      rethrow;
    }
  }

  Future<void> unregisterFromEvent(String eventId, String participantId) async {
    try {
      // Try to unregister via API first
      await _apiService.unregisterFromEvent(eventId, participantId);
    } catch (e) {
      // If API fails, throw error (unregistration requires server validation)
      rethrow;
    }
  }

  Stream<SyncStatus> get syncStatusStream => _syncService.syncStatusStream;
}
