import 'enums.dart';

class IncomeTransaction {
  final String id;
  final String parishId;
  final String? memberId;
  final String transactionNumber;
  final TransactionCategory category;
  final double amount;
  final PaymentMethod paymentMethod;
  final String transactionDate;
  final String? transactionTime;
  final String? description;
  final String? referenceNumber;
  final String? receivedBy;
  final bool? receiptPrinted;
  final bool? isSynced;
  final String? syncedAt;
  final String? createdAt;
  final String? updatedAt;

  IncomeTransaction({
    required this.id,
    required this.parishId,
    this.memberId,
    required this.transactionNumber,
    required this.category,
    required this.amount,
    required this.paymentMethod,
    required this.transactionDate,
    this.transactionTime,
    this.description,
    this.referenceNumber,
    this.receivedBy,
    this.receiptPrinted,
    this.isSynced,
    this.syncedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory IncomeTransaction.fromJson(Map<String, dynamic> json) {
    return IncomeTransaction(
      id: json['id'],
      parishId: json['parish_id'],
      memberId: json['member_id'],
      transactionNumber: json['transaction_number'],
      category: enumFromString(TransactionCategory.values, json['category']),
      amount: double.parse(json['amount'].toString()),
      paymentMethod: enumFromString(PaymentMethod.values, json['payment_method']),
      transactionDate: json['transaction_date'],
      transactionTime: json['transaction_time'],
      description: json['description'],
      referenceNumber: json['reference_number'],
      receivedBy: json['received_by'],
      receiptPrinted: json['receipt_printed'],
      isSynced: json['is_synced'],
      syncedAt: json['synced_at'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parish_id': parishId,
      'member_id': memberId,
      'transaction_number': transactionNumber,
      'category': enumToString(category),
      'amount': amount,
      'payment_method': enumToString(paymentMethod),
      'transaction_date': transactionDate,
      'transaction_time': transactionTime,
      'description': description,
      'reference_number': referenceNumber,
      'received_by': receivedBy,
      'receipt_printed': receiptPrinted,
      'is_synced': isSynced,
      'synced_at': syncedAt,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}

class ExpenseVoucher {
  final String id;
  final String parishId;
  final String voucherNumber;
  final TransactionCategory category;
  final double amount;
  final PaymentMethod paymentMethod;
  final String payeeName;
  final String? payeePhone;
  final String expenseDate;
  final String description;
  final String? referenceNumber;
  final ApprovalStatus? approvalStatus;
  final String requestedBy;
  final String? approvedBy;
  final String? approvedAt;
  final String? rejectionReason;
  final bool? paid;
  final String? paidAt;
  final bool? isSynced;
  final String? syncedAt;
  final String? createdAt;
  final String? updatedAt;

  ExpenseVoucher({
    required this.id,
    required this.parishId,
    required this.voucherNumber,
    required this.category,
    required this.amount,
    required this.paymentMethod,
    required this.payeeName,
    this.payeePhone,
    required this.expenseDate,
    required this.description,
    this.referenceNumber,
    this.approvalStatus,
    required this.requestedBy,
    this.approvedBy,
    this.approvedAt,
    this.rejectionReason,
    this.paid,
    this.paidAt,
    this.isSynced,
    this.syncedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory ExpenseVoucher.fromJson(Map<String, dynamic> json) {
    return ExpenseVoucher(
      id: json['id'],
      parishId: json['parish_id'],
      voucherNumber: json['voucher_number'],
      category: enumFromString(TransactionCategory.values, json['category']),
      amount: double.parse(json['amount'].toString()),
      paymentMethod: enumFromString(PaymentMethod.values, json['payment_method']),
      payeeName: json['payee_name'],
      payeePhone: json['payee_phone'],
      expenseDate: json['expense_date'],
      description: json['description'],
      referenceNumber: json['reference_number'],
      approvalStatus: json['approval_status'] != null
          ? enumFromString(ApprovalStatus.values, json['approval_status'])
          : null,
      requestedBy: json['requested_by'],
      approvedBy: json['approved_by'],
      approvedAt: json['approved_at'],
      rejectionReason: json['rejection_reason'],
      paid: json['paid'],
      paidAt: json['paid_at'],
      isSynced: json['is_synced'],
      syncedAt: json['synced_at'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parish_id': parishId,
      'voucher_number': voucherNumber,
      'category': enumToString(category),
      'amount': amount,
      'payment_method': enumToString(paymentMethod),
      'payee_name': payeeName,
      'payee_phone': payeePhone,
      'expense_date': expenseDate,
      'description': description,
      'reference_number': referenceNumber,
      'approval_status': approvalStatus != null ? enumToString(approvalStatus!) : null,
      'requested_by': requestedBy,
      'approved_by': approvedBy,
      'approved_at': approvedAt,
      'rejection_reason': rejectionReason,
      'paid': paid,
      'paid_at': paidAt,
      'is_synced': isSynced,
      'synced_at': syncedAt,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}
