import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/parish.dart';
import '../models/member.dart';
import '../models/transaction.dart';
import '../models/sacrament.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('sanctus_offline.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // Sync Queue
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    ''');

    // Income Transactions (Offline)
    await db.execute('''
      CREATE TABLE income_transaction (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        member_id TEXT,
        transaction_number TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        transaction_time TEXT,
        description TEXT,
        reference_number TEXT,
        received_by TEXT,
        receipt_printed INTEGER DEFAULT 0,
        is_synced INTEGER DEFAULT 0,
        synced_at TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    ''');

    // Members (Offline cache)
    await db.execute('''
      CREATE TABLE member (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        member_code TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        data_json TEXT
      )
    ''');

    // Expense Vouchers
    await db.execute('''
      CREATE TABLE expense_voucher (
        id TEXT PRIMARY KEY,
        parish_id TEXT NOT NULL,
        voucher_number TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payee_name TEXT NOT NULL,
        payee_phone TEXT,
        expense_date TEXT NOT NULL,
        description TEXT NOT NULL,
        reference_number TEXT,
        approval_status TEXT,
        requested_by TEXT NOT NULL,
        approved_by TEXT,
        approved_at TEXT,
        rejection_reason TEXT,
        paid INTEGER,
        paid_at TEXT,
        is_synced INTEGER DEFAULT 0,
        synced_at TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    ''');

    // Sacraments
    await db.execute('''
      CREATE TABLE sacrament (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        sacrament_type TEXT NOT NULL,
        sacrament_date TEXT NOT NULL,
        officiating_minister TEXT,
        parish_id TEXT NOT NULL,
        church_name TEXT,
        certificate_number TEXT,
        godparent_1_name TEXT,
        godparent_2_name TEXT,
        spouse_id TEXT,
        spouse_name TEXT,
        witnesses TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    ''');
  }

  // --- Sync Queue Methods ---

  Future<int> addToSyncQueue(String tableName, String operation, String recordId, String data) async {
    final db = await instance.database;
    return await db.insert('sync_queue', {
      'table_name': tableName,
      'operation': operation,
      'record_id': recordId,
      'data': data,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getSyncQueue() async {
    final db = await instance.database;
    return await db.query('sync_queue', orderBy: 'created_at ASC');
  }

  Future<int> removeFromSyncQueue(int id) async {
    final db = await instance.database;
    return await db.delete('sync_queue', where: 'id = ?', whereArgs: [id]);
  }

  // --- Transaction Methods ---

  Future<int> insertIncomeTransaction(IncomeTransaction transaction) async {
    final db = await instance.database;
    
    // Create map for API (Sync Queue) - keeps booleans
    final apiJson = transaction.toJson();
    
    // Create map for SQLite - converts booleans to ints
    final sqliteJson = Map<String, dynamic>.from(apiJson);
    sqliteJson['receipt_printed'] = transaction.receiptPrinted == true ? 1 : 0;
    sqliteJson['is_synced'] = 0;

    // Add to sync queue
    await addToSyncQueue(
      'income_transaction',
      'insert',
      transaction.id,
      jsonEncode(apiJson),
    );

    return await db.insert('income_transaction', sqliteJson);
  }

  Future<List<IncomeTransaction>> getIncomeTransactions() async {
    final db = await instance.database;
    final result = await db.query('income_transaction', orderBy: 'created_at DESC');
    
    return result.map((json) {
      final map = Map<String, dynamic>.from(json);
      map['receipt_printed'] = json['receipt_printed'] == 1;
      map['is_synced'] = json['is_synced'] == 1;
      return IncomeTransaction.fromJson(map);
    }).toList();
  }

  // --- Expense Voucher Methods ---

  Future<int> insertExpenseVoucher(ExpenseVoucher voucher) async {
    final db = await instance.database;
    
    final apiJson = voucher.toJson();
    final sqliteJson = Map<String, dynamic>.from(apiJson);
    
    // Boolean conversions
    sqliteJson['paid'] = voucher.paid == true ? 1 : 0;
    sqliteJson['is_synced'] = 0; 

    // Add to sync queue
    await addToSyncQueue(
      'expense_voucher',
      'insert',
      voucher.id,
      jsonEncode(apiJson),
    );

    return await db.insert('expense_voucher', sqliteJson);
  }

  Future<List<ExpenseVoucher>> getExpenseVouchers() async {
    final db = await instance.database;
    final result = await db.query('expense_voucher', orderBy: 'created_at DESC');
    
    return result.map((json) {
      final map = Map<String, dynamic>.from(json);
      map['paid'] = json['paid'] == 1;
      map['is_synced'] = json['is_synced'] == 1;
      return ExpenseVoucher.fromJson(map);
    }).toList();
  }

  // --- Sacrament Methods ---

  Future<int> insertSacrament(SacramentRecord sacrament) async {
    final db = await instance.database;
    final json = sacrament.toJson();

    // Add to sync queue
    await addToSyncQueue(
      'sacrament',
      'insert',
      sacrament.id,
      jsonEncode(json),
    );

    return await db.insert('sacrament', json);
  }

  Future<List<SacramentRecord>> getSacraments(String memberId) async {
    final db = await instance.database;
    final result = await db.query(
      'sacrament',
      where: 'member_id = ?',
      whereArgs: [memberId],
      orderBy: 'sacrament_date DESC'
    );
    
    return result.map((json) => SacramentRecord.fromJson(json)).toList();
  }

  // --- Member Methods ---

  Future<int> insertMember(Member member) async {
    final db = await instance.database;
    final json = member.toJson();
    
    // Flatten for SQLite search/list optimization
    final row = {
      'id': member.id,
      'parish_id': member.parishId,
      'member_code': member.memberCode,
      'first_name': member.firstName,
      'last_name': member.lastName,
      'created_at': member.createdAt,
      'updated_at': member.updatedAt,
      'data_json': jsonEncode(json),
    };

    // Add to sync queue
    await addToSyncQueue(
      'member',
      'insert',
      member.id,
      jsonEncode(json),
    );

    return await db.insert('member', row, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Member>> getMembers(String parishId) async {
    final db = await instance.database;
    final result = await db.query(
      'member', 
      where: 'parish_id = ?', 
      whereArgs: [parishId],
      orderBy: 'last_name ASC, first_name ASC'
    );
    
    return result.map((row) {
      if (row['data_json'] != null) {
        return Member.fromJson(jsonDecode(row['data_json'] as String));
      }
      // Fallback
      return Member(
        id: row['id'] as String,
        parishId: row['parish_id'] as String,
        memberCode: row['member_code'] as String,
        firstName: row['first_name'] as String,
        lastName: row['last_name'] as String,
      );
    }).toList();
  }

  Future<int> updateMember(Member member) async {
    final db = await instance.database;
    final json = member.toJson();
    
    // Flatten for SQLite search/list optimization
    final row = {
      'id': member.id,
      'parish_id': member.parishId,
      'member_code': member.memberCode,
      'first_name': member.firstName,
      'last_name': member.lastName,
      'created_at': member.createdAt,
      'updated_at': member.updatedAt,
      'data_json': jsonEncode(json),
    };

    // Add to sync queue
    await addToSyncQueue(
      'member',
      'update',
      member.id,
      jsonEncode(json),
    );

    return await db.update('member', row, where: 'id = ?', whereArgs: [member.id]);
  }

  Future<int> deleteMember(String memberId) async {
    final db = await instance.database;

    // Add to sync queue
    await addToSyncQueue(
      'member',
      'delete',
      memberId,
      '',
    );

    return await db.delete('member', where: 'id = ?', whereArgs: [memberId]);
  }
}
