import 'dart:convert';
import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
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

class DatabaseService {
  static Database? _database;
  static const String _dbName = 'sanctus_mobile.db';
  static const int _dbVersion = 1;

  // Singleton pattern
  DatabaseService._privateConstructor();
  static final DatabaseService instance = DatabaseService._privateConstructor();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), _dbName);
    return await openDatabase(
      path,
      version: _dbVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    // Create all tables
    await _createUserTables(db);
    await _createParishTables(db);
    await _createMemberTables(db);
    await _createFinancialTables(db);
    await _createSacramentTables(db);
    await _createSyncTables(db);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Handle database upgrades in future versions
  }

  // User Tables
  Future<void> _createUserTables(Database db) async {
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        phone_number TEXT,
        role TEXT NOT NULL,
        parish_id TEXT,
        profile_photo_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        last_login TEXT,
        token TEXT,
        token_expires_at TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    ''');
  }

  // Parish Tables
  Future<void> _createParishTables(Database db) async {
    await db.execute('''
      CREATE TABLE dioceses (
        id TEXT PRIMARY KEY,
        diocese_name TEXT NOT NULL,
        bishop_name TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE parishes (
        id TEXT PRIMARY KEY,
        diocese_id TEXT NOT NULL,
        parish_name TEXT NOT NULL,
        parish_priest TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        established_date TEXT,
        registration_number TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (diocese_id) REFERENCES dioceses (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE clusters (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        cluster_name TEXT NOT NULL,
        leader_name TEXT,
        leader_phone TEXT,
        meeting_day TEXT,
        meeting_time TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (parish_id) REFERENCES parishes (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE sccs (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        cluster_id TEXT,
        scc_name TEXT NOT NULL,
        leader_name TEXT,
        leader_phone TEXT,
        meeting_day TEXT,
        meeting_time TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (parish_id) REFERENCES parishes (id),
        FOREIGN KEY (cluster_id) REFERENCES clusters (id)
      )
    ''');
  }

  // Member Tables
  Future<void> _createMemberTables(Database db) async {
    await db.execute('''
      CREATE TABLE families (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        scc_id TEXT,
        family_name TEXT NOT NULL,
        family_head_name TEXT,
        family_head_phone TEXT,
        address TEXT,
        registration_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (parish_id) REFERENCES parishes (id),
        FOREIGN KEY (scc_id) REFERENCES sccs (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE members (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        family_id TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        date_of_birth TEXT,
        place_of_birth TEXT,
        gender TEXT NOT NULL,
        phone_number TEXT,
        email TEXT,
        address TEXT,
        baptism_date TEXT,
        baptism_place TEXT,
        confirmation_date TEXT,
        confirmation_place TEXT,
        marriage_date TEXT,
        marriage_place TEXT,
        occupation TEXT,
        education TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        member_id TEXT UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (parish_id) REFERENCES parishes (id),
        FOREIGN KEY (family_id) REFERENCES families (id)
      )
    ''');
  }

  // Financial Tables
  Future<void> _createFinancialTables(Database db) async {
    await db.execute('''
      CREATE TABLE income_transactions (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        member_id TEXT,
        transaction_date TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        payment_method TEXT,
        receipt_number TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (parish_id) REFERENCES parishes (id),
        FOREIGN KEY (member_id) REFERENCES members (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE expense_vouchers (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        voucher_date TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        payee_name TEXT,
        payee_phone TEXT,
        approved_by TEXT,
        created_by TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (parish_id) REFERENCES parishes (id)
      )
    ''');

    await db.execute('''
      CREATE TABLE budgets (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        fiscal_year INTEGER NOT NULL,
        category TEXT NOT NULL,
        budgeted_amount REAL NOT NULL,
        actual_amount REAL DEFAULT 0,
        description TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (parish_id) REFERENCES parishes (id)
      )
    ''');
  }

  // Sacrament Tables
  Future<void> _createSacramentTables(Database db) async {
    await db.execute('''
      CREATE TABLE sacrament_records (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        sacrament_type TEXT NOT NULL,
        sacrament_date TEXT NOT NULL,
        celebrant TEXT,
        place TEXT,
        parents_names TEXT,
        godparents_names TEXT,
        spouse_name TEXT,
        witness_names TEXT,
        registration_number TEXT,
        notes TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'synced',
        last_sync TEXT,
        FOREIGN KEY (parish_id) REFERENCES parishes (id),
        FOREIGN KEY (member_id) REFERENCES members (id)
      )
    ''');
  }

  // Sync Tables
  Future<void> _createSyncTables(Database db) async {
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_attempt TEXT,
        status TEXT DEFAULT 'pending'
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT,
        status TEXT NOT NULL,
        message TEXT,
        created_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  // Generic CRUD operations
  Future<int> insert(String table, Map<String, dynamic> data) async {
    final db = await database;
    data['sync_status'] = 'pending';
    data['last_sync'] = null;
    return await db.insert(table, data);
  }

  Future<List<Map<String, dynamic>>> query(String table, {
    bool? distinct,
    List<String>? columns,
    String? where,
    List<dynamic>? whereArgs,
    String? groupBy,
    String? having,
    String? orderBy,
    int? limit,
    int? offset,
  }) async {
    final db = await database;
    return await db.query(
      table,
      distinct: distinct,
      columns: columns,
      where: where,
      whereArgs: whereArgs,
      groupBy: groupBy,
      having: having,
      orderBy: orderBy,
      limit: limit,
      offset: offset,
    );
  }

  Future<int> update(String table, Map<String, dynamic> values, {
    String? where,
    List<dynamic>? whereArgs,
  }) async {
    final db = await database;
    values['sync_status'] = 'pending';
    values['last_sync'] = null;
    return await db.update(table, values, where: where, whereArgs: whereArgs);
  }

  Future<int> delete(String table, {
    String? where,
    List<dynamic>? whereArgs,
  }) async {
    final db = await database;
    return await db.delete(table, where: where, whereArgs: whereArgs);
  }

  // Sync queue operations
  Future<void> addToSyncQueue(String tableName, String recordId, String operation, Map<String, dynamic> data) async {
    final db = await database;
    await db.insert('sync_queue', {
      'table_name': tableName,
      'record_id': recordId,
      'operation': operation,
      'data': jsonEncode(data),
      'created_at': DateTime.now().toIso8601String(),
      'status': 'pending',
    });
  }

  Future<List<Map<String, dynamic>>> getPendingSyncItems() async {
    final db = await database;
    return await db.query(
      'sync_queue',
      where: 'status = ?',
      whereArgs: ['pending'],
      orderBy: 'created_at ASC',
    );
  }

  Future<void> markSyncItemCompleted(int queueId) async {
    final db = await database;
    await db.update(
      'sync_queue',
      {'status': 'completed'},
      where: 'id = ?',
      whereArgs: [queueId],
    );
  }

  Future<void> markSyncItemFailed(int queueId, String error) async {
    final db = await database;
    await db.update(
      'sync_queue',
      {
        'status': 'failed',
        'last_attempt': DateTime.now().toIso8601String(),
        'retry_count': 'retry_count + 1',
      },
      where: 'id = ?',
      whereArgs: [queueId],
    );
  }

  // Settings operations
  Future<void> setSetting(String key, String value) async {
    final db = await database;
    await db.insert(
      'app_settings',
      {
        'key': key,
        'value': value,
        'updated_at': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<String?> getSetting(String key) async {
    final db = await database;
    final result = await db.query(
      'app_settings',
      where: 'key = ?',
      whereArgs: [key],
    );
    return result.isNotEmpty ? result.first['value'] as String : null;
  }

  // Cleanup operations
  Future<void> clearAllData() async {
    final db = await database;
    final tables = [
      'sync_queue', 'sync_log', 'app_settings',
      'sacrament_records', 'expense_vouchers', 'income_transactions', 'budgets',
      'members', 'families', 'sccs', 'clusters', 'parishes', 'dioceses',
      'user_sessions', 'users',
    ];
    
    for (final table in tables) {
      await db.delete(table);
    }
  }

  Future<void> close() async {
    if (_database != null) {
      await _database!.close();
      _database = null;
    }
  }
}
