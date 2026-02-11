import 'user_role.dart';

class User {
  final String id;
  final String? parishId;
  final String username;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final UserRole role;
  final bool isActive;

  User({
    required this.id,
    this.parishId,
    required this.username,
    required this.email,
    required this.fullName,
    this.phoneNumber,
    required this.role,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      parishId: json['parish_id'],
      username: json['username'],
      email: json['email'],
      fullName: json['full_name'],
      phoneNumber: json['phone_number'],
      role: userRoleFromString(json['role']),
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parish_id': parishId,
      'username': username,
      'email': email,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'role': role.name,
      'is_active': isActive,
    };
  }
}

class AuthResponse {
  final String token;
  final User user;

  AuthResponse({required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'],
      user: User.fromJson(json['user']),
    );
  }
}
