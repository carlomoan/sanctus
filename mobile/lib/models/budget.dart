import 'enums.dart';

class Budget {
  final String id;
  final String parishId;
  final TransactionCategory category;
  final double amount;
  final int fiscalYear;
  final int? fiscalMonth;
  final String? description;
  final String createdAt;
  final String? updatedAt;

  Budget({
    required this.id,
    required this.parishId,
    required this.category,
    required this.amount,
    required this.fiscalYear,
    this.fiscalMonth,
    this.description,
    required this.createdAt,
    this.updatedAt,
  });

  factory Budget.fromJson(Map<String, dynamic> json) {
    return Budget(
      id: json['id'],
      parishId: json['parish_id'],
      category: enumFromString(TransactionCategory.values, json['category']),
      amount: double.parse(json['amount'].toString()),
      fiscalYear: json['fiscal_year'],
      fiscalMonth: json['fiscal_month'],
      description: json['description'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parish_id': parishId,
      'category': enumToString(category),
      'amount': amount,
      'fiscal_year': fiscalYear,
      'fiscal_month': fiscalMonth,
      'description': description,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}

class CreateBudgetRequest {
  final String parishId;
  final TransactionCategory category;
  final double amount;
  final int fiscalYear;
  final int? fiscalMonth;
  final String? description;

  CreateBudgetRequest({
    required this.parishId,
    required this.category,
    required this.amount,
    required this.fiscalYear,
    this.fiscalMonth,
    this.description,
  });

  Map<String, dynamic> toJson() {
    return {
      'parish_id': parishId,
      'category': enumToString(category),
      'amount': amount,
      'fiscal_year': fiscalYear,
      'fiscal_month': fiscalMonth,
      'description': description,
    };
  }
}

class UpdateBudgetRequest {
  final double? amount;
  final String? description;

  UpdateBudgetRequest({
    this.amount,
    this.description,
  });

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'description': description,
    };
  }
}
