import 'enums.dart';

class Parish {
  final String id;
  final String dioceseId;
  final String parishCode;
  final String parishName;
  final String? patronSaint;
  final String? priestName;
  final String? establishedDate;
  final String? physicalAddress;
  final String? postalAddress;
  final String? contactEmail;
  final String? contactPhone;
  final String? bankAccountName;
  final String? bankAccountNumber;
  final String? bankName;
  final String? bankBranch;
  final String? mobileMoneyName;
  final String? mobileMoneyNumber;
  final String? mobileMoneyAccountName;
  final double? latitude;
  final double? longitude;
  final String? timezone;
  final bool? isActive;
  final String? createdAt;
  final String? updatedAt;

  Parish({
    required this.id,
    required this.dioceseId,
    required this.parishCode,
    required this.parishName,
    this.patronSaint,
    this.priestName,
    this.establishedDate,
    this.physicalAddress,
    this.postalAddress,
    this.contactEmail,
    this.contactPhone,
    this.bankAccountName,
    this.bankAccountNumber,
    this.bankName,
    this.bankBranch,
    this.mobileMoneyName,
    this.mobileMoneyNumber,
    this.mobileMoneyAccountName,
    this.latitude,
    this.longitude,
    this.timezone,
    this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory Parish.fromJson(Map<String, dynamic> json) {
    return Parish(
      id: json['id'],
      dioceseId: json['diocese_id'],
      parishCode: json['parish_code'],
      parishName: json['parish_name'],
      patronSaint: json['patron_saint'],
      priestName: json['priest_name'],
      establishedDate: json['established_date'],
      physicalAddress: json['physical_address'],
      postalAddress: json['postal_address'],
      contactEmail: json['contact_email'],
      contactPhone: json['contact_phone'],
      bankAccountName: json['bank_account_name'],
      bankAccountNumber: json['bank_account_number'],
      bankName: json['bank_name'],
      bankBranch: json['bank_branch'],
      mobileMoneyName: json['mobile_money_name'],
      mobileMoneyNumber: json['mobile_money_number'],
      mobileMoneyAccountName: json['mobile_money_account_name'],
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      timezone: json['timezone'],
      isActive: json['is_active'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'diocese_id': dioceseId,
      'parish_code': parishCode,
      'parish_name': parishName,
      'patron_saint': patronSaint,
      'priest_name': priestName,
      'established_date': establishedDate,
      'physical_address': physicalAddress,
      'postal_address': postalAddress,
      'contact_email': contactEmail,
      'contact_phone': contactPhone,
      'bank_account_name': bankAccountName,
      'bank_account_number': bankAccountNumber,
      'bank_name': bankName,
      'bank_branch': bankBranch,
      'mobile_money_name': mobileMoneyName,
      'mobile_money_number': mobileMoneyNumber,
      'mobile_money_account_name': mobileMoneyAccountName,
      'latitude': latitude,
      'longitude': longitude,
      'timezone': timezone,
      'is_active': isActive,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}
