import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/parish.dart';
import '../models/member.dart';
import '../models/sacrament.dart';
import '../models/transaction.dart';
import '../models/user.dart';
import '../models/diocese.dart';
import '../models/cluster.dart';
import '../models/scc.dart';
import '../models/family.dart';
import '../models/budget.dart';
import '../models/event.dart';

class ApiService {
  final String baseUrl;
  String? _token;
  User? _currentUser;

  User? get currentUser => _currentUser;
  String? getToken() => _token;

  ApiService({required this.baseUrl});

  void setToken(String token) {
    _token = token;
  }

  void setUser(User user) {
    _currentUser = user;
  }

  Map<String, String> _getHeaders() {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<AuthResponse> login(String usernameOrEmail, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username_or_email': usernameOrEmail,
        'password': password,
      }),
    ).timeout(
      const Duration(seconds: 30), // 30 second timeout
      onTimeout: () {
        throw http.ClientException('Connection timeout after 30 seconds');
      },
    );

    if (response.statusCode == 200) {
      final authResponse = AuthResponse.fromJson(jsonDecode(response.body));
      _token = authResponse.token;
      _currentUser = authResponse.user;
      return authResponse;
    } else {
      throw Exception('Login failed: ${response.body}');
    }
  }

  // Diocese endpoints
  Future<List<Diocese>> getDioceses() async {
    final response = await http.get(
      Uri.parse('$baseUrl/dioceses'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Diocese.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load dioceses');
    }
  }

  // Parish endpoints
  Future<List<Parish>> getParishes() async {
    final response = await http.get(
      Uri.parse('$baseUrl/parishes'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Parish.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load parishes');
    }
  }

  Future<Parish> createParish(Map<String, dynamic> parishData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/parishes'),
      headers: _getHeaders(),
      body: jsonEncode(parishData),
    );
    if (response.statusCode == 201) {
      return Parish.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create parish: ${response.body}');
    }
  }

  Future<Parish> updateParish(String id, Map<String, dynamic> parishData) async {
    final response = await http.put(
      Uri.parse('$baseUrl/parishes/$id'),
      headers: _getHeaders(),
      body: jsonEncode(parishData),
    );
    if (response.statusCode == 200) {
      return Parish.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update parish: ${response.body}');
    }
  }

  // Cluster endpoints
  Future<List<Cluster>> getClusters(String parishId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/clusters?parish_id=$parishId'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Cluster.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load clusters');
    }
  }

  Future<Cluster> createCluster(CreateClusterRequest request) async {
    final response = await http.post(
      Uri.parse('$baseUrl/clusters'),
      headers: _getHeaders(),
      body: jsonEncode(request.toJson()),
    );
    if (response.statusCode == 201) {
      return Cluster.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create cluster: ${response.body}');
    }
  }

  // SCC endpoints
  Future<List<Scc>> getSccs({String? parishId, String? clusterId}) async {
    String query = '';
    if (parishId != null) query = 'parish_id=$parishId';
    if (clusterId != null) query += (query.isNotEmpty ? '&' : '') + 'cluster_id=$clusterId';

    final response = await http.get(
      Uri.parse('$baseUrl/sccs?$query'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Scc.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load SCCs');
    }
  }

  Future<Scc> createScc(CreateSccRequest request) async {
    final response = await http.post(
      Uri.parse('$baseUrl/sccs'),
      headers: _getHeaders(),
      body: jsonEncode(request.toJson()),
    );
    if (response.statusCode == 201) {
      return Scc.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create SCC: ${response.body}');
    }
  }

  // Family endpoints
  Future<List<Family>> getFamilies({String? parishId, String? sccId}) async {
    String query = '';
    if (parishId != null) query = 'parish_id=$parishId';
    if (sccId != null) query += (query.isNotEmpty ? '&' : '') + 'scc_id=$sccId';

    final response = await http.get(
      Uri.parse('$baseUrl/families?$query'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Family.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load families');
    }
  }

  Future<Family> createFamily(CreateFamilyRequest request) async {
    final response = await http.post(
      Uri.parse('$baseUrl/families'),
      headers: _getHeaders(),
      body: jsonEncode(request.toJson()),
    );
    if (response.statusCode == 201) {
      return Family.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create family: ${response.body}');
    }
  }

  // Member endpoints
  Future<List<Member>> getMembers({String? parishId, String? familyId, String? sccId}) async {
    String query = '';
    if (parishId != null) query = 'parish_id=$parishId';
    if (familyId != null) query += (query.isNotEmpty ? '&' : '') + 'family_id=$familyId';
    if (sccId != null) query += (query.isNotEmpty ? '&' : '') + 'scc_id=$sccId';

    final response = await http.get(
      Uri.parse('$baseUrl/members?$query'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Member.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load members');
    }
  }

  Future<Member> createMember(Map<String, dynamic> memberData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/members'),
      headers: _getHeaders(),
      body: jsonEncode(memberData),
    );
    if (response.statusCode == 201) {
      return Member.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create member: ${response.body}');
    }
  }

  Future<Member> updateMember(String id, Map<String, dynamic> memberData) async {
    final response = await http.put(
      Uri.parse('$baseUrl/members/$id'),
      headers: _getHeaders(),
      body: jsonEncode(memberData),
    );
    if (response.statusCode == 200) {
      return Member.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update member: ${response.body}');
    }
  }

  // Sacrament endpoints
  Future<List<SacramentRecord>> getSacraments({String? memberId, String? parishId}) async {
    String query = '';
    if (memberId != null) query = 'member_id=$memberId';
    else if (parishId != null) query = 'parish_id=$parishId';

    final response = await http.get(
      Uri.parse('$baseUrl/sacraments?$query'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => SacramentRecord.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load sacraments');
    }
  }

  Future<SacramentRecord> createSacrament(Map<String, dynamic> sacramentData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/sacraments'),
      headers: _getHeaders(),
      body: jsonEncode(sacramentData),
    );
    if (response.statusCode == 201) {
      return SacramentRecord.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create sacrament: ${response.body}');
    }
  }

  // Transaction endpoints
  Future<List<IncomeTransaction>> getIncomeTransactions(String parishId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/transactions/income?parish_id=$parishId'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => IncomeTransaction.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load income transactions');
    }
  }

  Future<IncomeTransaction> createIncomeTransaction(Map<String, dynamic> transactionData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/transactions/income'),
      headers: _getHeaders(),
      body: jsonEncode(transactionData),
    );
    if (response.statusCode == 201) {
      return IncomeTransaction.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create income transaction: ${response.body}');
    }
  }

  Future<List<ExpenseVoucher>> getExpenseVouchers(String parishId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/transactions/expense?parish_id=$parishId'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => ExpenseVoucher.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load expense vouchers');
    }
  }

  Future<ExpenseVoucher> createExpenseVoucher(Map<String, dynamic> voucherData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/transactions/expense'),
      headers: _getHeaders(),
      body: jsonEncode(voucherData),
    );
    if (response.statusCode == 201) {
      return ExpenseVoucher.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create expense voucher: ${response.body}');
    }
  }

  // Budget endpoints
  Future<List<Budget>> getBudgets(String parishId, {int? fiscalYear}) async {
    String query = 'parish_id=$parishId';
    if (fiscalYear != null) query += '&fiscal_year=$fiscalYear';

    final response = await http.get(
      Uri.parse('$baseUrl/budgets?$query'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Budget.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load budgets');
    }
  }

  Future<Budget> createBudget(CreateBudgetRequest request) async {
    final response = await http.post(
      Uri.parse('$baseUrl/budgets'),
      headers: _getHeaders(),
      body: jsonEncode(request.toJson()),
    );
    if (response.statusCode == 201) {
      return Budget.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create budget: ${response.body}');
    }
  }

  Future<Budget> updateBudget(String id, UpdateBudgetRequest request) async {
    final response = await http.put(
      Uri.parse('$baseUrl/budgets/$id'),
      headers: _getHeaders(),
      body: jsonEncode(request.toJson()),
    );
    if (response.statusCode == 200) {
      return Budget.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update budget: ${response.body}');
    }
  }

  // Settings endpoints
  Future<Map<String, dynamic>> getSettings({String? parishId}) async {
    String query = '';
    if (parishId != null) query = 'parish_id=$parishId';

    final response = await http.get(
      Uri.parse('$baseUrl/settings?$query'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load settings');
    }
  }

  Future<Map<String, dynamic>> updateSettings(Map<String, dynamic> settingsData) async {
    final response = await http.put(
      Uri.parse('$baseUrl/settings'),
      headers: _getHeaders(),
      body: jsonEncode(settingsData),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update settings: ${response.body}');
    }
  }

  // Reports endpoints
  Future<Map<String, dynamic>> getFinancialReport(String parishId, String reportType, {String? startDate, String? endDate}) async {
    String query = 'parish_id=$parishId&report_type=$reportType';
    if (startDate != null) query += '&start_date=$startDate';
    if (endDate != null) query += '&end_date=$endDate';

    final response = await http.get(
      Uri.parse('$baseUrl/reports/financial?$query'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load financial report');
    }
  }

  // Sync endpoints
  Future<Map<String, dynamic>> syncData(String parishId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/sync'),
      headers: _getHeaders(),
      body: jsonEncode({'parish_id': parishId}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to sync data: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getSyncStatus(String parishId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/sync/status?parish_id=$parishId'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to get sync status: ${response.body}');
    }
  }

  // Events endpoints
  Future<List<Event>> getEvents({
    String? parishId,
    String? dioceseId,
    String? scope,
    String? status,
    String? eventType,
    String? startDate,
    String? endDate,
  }) async {
    String query = '';
    if (parishId != null) query += 'parish_id=$parishId&';
    if (dioceseId != null) query += 'diocese_id=$dioceseId&';
    if (scope != null) query += 'scope=$scope&';
    if (status != null) query += 'status=$status&';
    if (eventType != null) query += 'event_type=$eventType&';
    if (startDate != null) query += 'start_date=$startDate&';
    if (endDate != null) query += 'end_date=$endDate&';

    final response = await http.get(
      Uri.parse('$baseUrl/events${query.isNotEmpty ? '?$query' : ''}'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Event.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load events: ${response.body}');
    }
  }

  Future<Event> getEvent(String eventId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/events/$eventId'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      return Event.fromJson(jsonDecode(response.body));
    } else if (response.statusCode == 404) {
      throw Exception('Event not found');
    } else {
      throw Exception('Failed to load event: ${response.body}');
    }
  }

  Future<Event> createEvent(CreateEventRequest event) async {
    final response = await http.post(
      Uri.parse('$baseUrl/events'),
      headers: _getHeaders(),
      body: jsonEncode(event.toJson()),
    );
    if (response.statusCode == 201) {
      return Event.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create event: ${response.body}');
    }
  }

  Future<Event> updateEvent(String eventId, UpdateEventRequest event) async {
    final response = await http.put(
      Uri.parse('$baseUrl/events/$eventId'),
      headers: _getHeaders(),
      body: jsonEncode(event.toJson()),
    );
    if (response.statusCode == 200) {
      return Event.fromJson(jsonDecode(response.body));
    } else if (response.statusCode == 404) {
      throw Exception('Event not found');
    } else {
      throw Exception('Failed to update event: ${response.body}');
    }
  }

  Future<void> deleteEvent(String eventId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/events/$eventId'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 204) {
      return;
    } else if (response.statusCode == 404) {
      throw Exception('Event not found');
    } else {
      throw Exception('Failed to delete event: ${response.body}');
    }
  }

  Future<List<EventParticipant>> getEventParticipants(String eventId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/events/$eventId/participants'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => EventParticipant.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load event participants: ${response.body}');
    }
  }

  Future<EventParticipant> registerForEvent(String eventId, Map<String, dynamic> registrationData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/events/$eventId/participants'),
      headers: _getHeaders(),
      body: jsonEncode(registrationData),
    );
    if (response.statusCode == 201) {
      return EventParticipant.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to register for event: ${response.body}');
    }
  }

  Future<void> unregisterFromEvent(String eventId, String participantId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/events/$eventId/participants/$participantId'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 204) {
      return;
    } else if (response.statusCode == 404) {
      throw Exception('Registration not found');
    } else {
      throw Exception('Failed to unregister from event: ${response.body}');
    }
  }
}
