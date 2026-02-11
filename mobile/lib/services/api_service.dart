import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/parish.dart';
import '../models/member.dart';
import '../models/sacrament.dart';
import '../models/transaction.dart';
import '../models/user.dart';

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

  Future<List<Member>> getMembers(String parishId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/members?parish_id=$parishId'),
      headers: _getHeaders(),
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Member.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load members');
    }
  }

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
}
