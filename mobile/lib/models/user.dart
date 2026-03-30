import 'user_role.dart';

class User {
  final String id;
  final String? parishId;
  final String username;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final UserRole role;
  final String? profilePhotoUrl;
  final bool isActive;
  final String createdAt;

  User({
    required this.id,
    this.parishId,
    required this.username,
    required this.email,
    required this.fullName,
    this.phoneNumber,
    required this.role,
    this.profilePhotoUrl,
    required this.isActive,
    required this.createdAt,
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
      profilePhotoUrl: json['profile_photo_url'],
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'],
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
      'profile_photo_url': profilePhotoUrl,
      'is_active': isActive,
      'created_at': createdAt,
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
