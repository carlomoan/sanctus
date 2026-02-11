import 'enums.dart';

class Member {
  final String id;
  final String parishId;
  final String? familyId;
  final String? sccId;
  final String memberCode;
  final String firstName;
  final String? middleName;
  final String lastName;
  final String? dateOfBirth;
  final GenderType? gender;
  final MaritalStatus? maritalStatus;
  final String? nationalId;
  final String? occupation;
  final String? email;
  final String? phoneNumber;
  final String? physicalAddress;
  final String? photoUrl;
  final bool? isHeadOfFamily;
  final String? notes;
  final bool? isActive;
  final String? createdAt;
  final String? updatedAt;

  Member({
    required this.id,
    required this.parishId,
    this.familyId,
    this.sccId,
    required this.memberCode,
    required this.firstName,
    this.middleName,
    required this.lastName,
    this.dateOfBirth,
    this.gender,
    this.maritalStatus,
    this.nationalId,
    this.occupation,
    this.email,
    this.phoneNumber,
    this.physicalAddress,
    this.photoUrl,
    this.isHeadOfFamily,
    this.notes,
    this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      id: json['id'],
      parishId: json['parish_id'],
      familyId: json['family_id'],
      sccId: json['scc_id'],
      memberCode: json['member_code'],
      firstName: json['first_name'],
      middleName: json['middle_name'],
      lastName: json['last_name'],
      dateOfBirth: json['date_of_birth'],
      gender: json['gender'] != null
          ? enumFromString(GenderType.values, json['gender'])
          : null,
      maritalStatus: json['marital_status'] != null
          ? enumFromString(MaritalStatus.values, json['marital_status'])
          : null,
      nationalId: json['national_id'],
      occupation: json['occupation'],
      email: json['email'],
      phoneNumber: json['phone_number'],
      physicalAddress: json['physical_address'],
      photoUrl: json['photo_url'],
      isHeadOfFamily: json['is_head_of_family'],
      notes: json['notes'],
      isActive: json['is_active'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parish_id': parishId,
      'family_id': familyId,
      'scc_id': sccId,
      'member_code': memberCode,
      'first_name': firstName,
      'middle_name': middleName,
      'last_name': lastName,
      'date_of_birth': dateOfBirth,
      'gender': gender != null ? enumToString(gender!) : null,
      'marital_status': maritalStatus != null ? enumToString(maritalStatus!) : null,
      'national_id': nationalId,
      'occupation': occupation,
      'email': email,
      'phone_number': phoneNumber,
      'physical_address': physicalAddress,
      'photo_url': photoUrl,
      'is_head_of_family': isHeadOfFamily,
      'notes': notes,
      'is_active': isActive,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}
