enum UserRole {
  SUPER_ADMIN,
  PARISH_ADMIN,
  ACCOUNTANT,
  SECRETARY,
  VIEWER,
}

extension UserRoleExtension on UserRole {
  String get name {
    return this.toString().split('.').last;
  }
}

UserRole userRoleFromString(String role) {
  return UserRole.values.firstWhere(
    (e) => e.name == role,
    orElse: () => UserRole.VIEWER,
  );
}
