class Diocese {
  final String id;
  final String dioceseCode;
  final String dioceseName;
  final String? bishopName;
  final String? establishedDate;
  final String? headquartersAddress;
  final String? contactEmail;
  final String? contactPhone;
  final String? country;
  final String? currencyCode;
  final String? logoUrl;
  final bool? isActive;
  final String? createdAt;
  final String? updatedAt;
  final String? deletedAt;

  Diocese({
    required this.id,
    required this.dioceseCode,
    required this.dioceseName,
    this.bishopName,
    this.establishedDate,
    this.headquartersAddress,
    this.contactEmail,
    this.contactPhone,
    this.country,
    this.currencyCode,
    this.logoUrl,
    this.isActive,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory Diocese.fromJson(Map<String, dynamic> json) {
    return Diocese(
      id: json['id'],
      dioceseCode: json['diocese_code'],
      dioceseName: json['diocese_name'],
      bishopName: json['bishop_name'],
      establishedDate: json['established_date'],
      headquartersAddress: json['headquarters_address'],
      contactEmail: json['contact_email'],
      contactPhone: json['contact_phone'],
      country: json['country'],
      currencyCode: json['currency_code'],
      logoUrl: json['logo_url'],
      isActive: json['is_active'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
      deletedAt: json['deleted_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'diocese_code': dioceseCode,
      'diocese_name': dioceseName,
      'bishop_name': bishopName,
      'established_date': establishedDate,
      'headquarters_address': headquartersAddress,
      'contact_email': contactEmail,
      'contact_phone': contactPhone,
      'country': country,
      'currency_code': currencyCode,
      'logo_url': logoUrl,
      'is_active': isActive,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'deleted_at': deletedAt,
    };
  }
}
