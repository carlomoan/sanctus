import 'enums.dart';

class SacramentRecord {
  final String id;
  final String memberId;
  final SacramentType sacramentType;
  final String sacramentDate;
  final String? officiatingMinister;
  final String parishId;
  final String? churchName;
  final String? certificateNumber;
  final String? godparent1Name;
  final String? godparent2Name;
  final String? spouseId;
  final String? spouseName;
  final String? witnesses;
  final String? notes;
  final String? createdAt;
  final String? updatedAt;

  SacramentRecord({
    required this.id,
    required this.memberId,
    required this.sacramentType,
    required this.sacramentDate,
    this.officiatingMinister,
    required this.parishId,
    this.churchName,
    this.certificateNumber,
    this.godparent1Name,
    this.godparent2Name,
    this.spouseId,
    this.spouseName,
    this.witnesses,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  factory SacramentRecord.fromJson(Map<String, dynamic> json) {
    return SacramentRecord(
      id: json['id'],
      memberId: json['member_id'],
      sacramentType: enumFromString(SacramentType.values, json['sacrament_type']),
      sacramentDate: json['sacrament_date'],
      officiatingMinister: json['officiating_minister'],
      parishId: json['parish_id'],
      churchName: json['church_name'],
      certificateNumber: json['certificate_number'],
      godparent1Name: json['godparent_1_name'],
      godparent2Name: json['godparent_2_name'],
      spouseId: json['spouse_id'],
      spouseName: json['spouse_name'],
      witnesses: json['witnesses'],
      notes: json['notes'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'member_id': memberId,
      'sacrament_type': enumToString(sacramentType),
      'sacrament_date': sacramentDate,
      'officiating_minister': officiatingMinister,
      'parish_id': parishId,
      'church_name': churchName,
      'certificate_number': certificateNumber,
      'godparent_1_name': godparent1Name,
      'godparent_2_name': godparent2Name,
      'spouse_id': spouseId,
      'spouse_name': spouseName,
      'witnesses': witnesses,
      'notes': notes,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}
