enum GenderType {
  MALE,
  FEMALE,
}

enum MaritalStatus {
  SINGLE,
  MARRIED,
  WIDOWED,
  SEPARATED,
  DIVORCED,
}

enum SacramentType {
  BAPTISM,
  FIRST_COMMUNION,
  CONFIRMATION,
  MARRIAGE,
  HOLY_ORDERS,
  ANOINTING_OF_SICK,
}

enum TransactionCategory {
  TITHE,
  OFFERTORY,
  THANKSGIVING,
  DONATION,
  FUNDRAISING,
  MASS_OFFERING,
  WEDDING_FEE,
  BAPTISM_FEE,
  FUNERAL_FEE,
  CERTIFICATE_FEE,
  RENT_INCOME,
  INVESTMENT_INCOME,
  OTHER_INCOME,
  SALARY_EXPENSE,
  UTILITIES_EXPENSE,
  MAINTENANCE_EXPENSE,
  SUPPLIES_EXPENSE,
  DIOCESAN_LEVY,
  CHARITY_EXPENSE,
  CONSTRUCTION_EXPENSE,
  OTHER_EXPENSE,
}

enum PaymentMethod {
  CASH,
  CHEQUE,
  BANK_TRANSFER,
  MPESA,
  TIGO_PESA,
  AIRTEL_MONEY,
  HALOPESA,
  CREDIT_CARD,
  OTHER,
}

enum ApprovalStatus {
  PENDING,
  APPROVED,
  REJECTED,
  CANCELLED,
}

String enumToString(Object o) => o.toString().split('.').last;

T enumFromString<T>(List<T> values, String value) {
  return values.firstWhere((v) => enumToString(v!) == value,
      orElse: () => values.first);
}
