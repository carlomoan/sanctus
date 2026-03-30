import 'enums.dart';

class Family {
  final String id;
  final String parishId;
  final String? sccId;
  final String familyCode;
  final String familyName;
  final String? headOfFamilyId;
  final String? physicalAddress;
  final String? postalAddress;
  final String? primaryPhone;
  final String? secondaryPhone;
  final String? email;
  final String? notes;
  final bool? isActive;
  final String? createdAt;
  final String? updatedAt;
  final String? deletedAt;

  Family({
    required this.id,
    required this.parishId,
    this.sccId,
    required this.familyCode,
    required this.familyName,
    this.headOfFamilyId,
    this.physicalAddress,
    this.postalAddress,
    this.primaryPhone,
    this.secondaryPhone,
    this.email,
    this.notes,
    this.isActive,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory Family.fromJson(Map<String, dynamic> json) {
    return Family(
      id: json['id'],
      parishId: json['parish_id'],
      sccId: json['scc_id'],
      familyCode: json['family_code'],
      familyName: json['family_name'],
      headOfFamilyId: json['head_of_family_id'],
      physicalAddress: json['physical_address'],
      postalAddress: json['postal_address'],
      primaryPhone: json['primary_phone'],
      secondaryPhone: json['secondary_phone'],
      email: json['email'],
      notes: json['notes'],
      isActive: json['is_active'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
      deletedAt: json['deleted_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parish_id': parishId,
      'scc_id': sccId,
      'family_code': familyCode,
      'family_name': familyName,
      'head_of_family_id': headOfFamilyId,
      'physical_address': physicalAddress,
      'postal_address': postalAddress,
      'primary_phone': primaryPhone,
      'secondary_phone': secondaryPhone,
      'email': email,
      'notes': notes,
      'is_active': isActive,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'deleted_at': deletedAt,
    };
  }
}

class CreateFamilyRequest {
  final String parishId;
  final String? sccId;
  final String familyCode;
  final String familyName;
  final String? headOfFamilyId;
  final String? physicalAddress;
  final String? postalAddress;
  final String? primaryPhone;
  final String? secondaryPhone;
  final String? email;
  final String? notes;

  CreateFamilyRequest({
    required this.parishId,
    this.sccId,
    required this.familyCode,
    required this.familyName,
    this.headOfFamilyId,
    this.physicalAddress,
    this.postalAddress,
    this.primaryPhone,
    this.secondaryPhone,
    this.email,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'parish_id': parishId,
      'scc_id': sccId,
      'family_code': familyCode,
      'family_name': familyName,
      'head_of_family_id': headOfFamilyId,
      'physical_address': physicalAddress,
      'postal_address': postalAddress,
      'primary_phone': primaryPhone,
      'secondary_phone': secondaryPhone,
      'email': email,
      'notes': notes,
    };
  }
}
