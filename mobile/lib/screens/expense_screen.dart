import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/transaction.dart';
import '../models/enums.dart';
import '../services/database_helper.dart';
import '../services/api_service.dart';

class ExpenseScreen extends StatefulWidget {
  final ApiService apiService;
  const ExpenseScreen({super.key, required this.apiService});

  @override
  State<ExpenseScreen> createState() => _ExpenseScreenState();
}

class _ExpenseScreenState extends State<ExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _payeeNameController = TextEditingController();
  final _payeePhoneController = TextEditingController();
  
  TransactionCategory _category = TransactionCategory.UTILITIES;
  PaymentMethod _paymentMethod = PaymentMethod.CASH;
  
  bool _isSaving = false;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final amount = double.parse(_amountController.text);
      final uuid = const Uuid();
      final now = DateTime.now().toIso8601String();
      final today = now.split('T')[0];

      final parishId = widget.apiService.currentUser?.parishId ?? ''; 
      final userId = widget.apiService.currentUser?.id ?? '';
      
      final voucher = ExpenseVoucher(
        id: uuid.v4(),
        parishId: parishId,
        voucherNumber: 'EXP-${DateTime.now().millisecondsSinceEpoch}',
        category: _category,
        amount: amount,
        paymentMethod: _paymentMethod,
        payeeName: _payeeNameController.text,
        payeePhone: _payeePhoneController.text.isEmpty ? null : _payeePhoneController.text,
        expenseDate: today,
        description: _descriptionController.text,
        requestedBy: userId,
        approvalStatus: ApprovalStatus.PENDING,
        paid: false,
        isSynced: false,
        createdAt: now,
        updatedAt: now,
      );

      await DatabaseHelper.instance.insertExpenseVoucher(voucher);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Expense voucher recorded successfully')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Record Expense')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              DropdownButtonFormField<TransactionCategory>(
                value: _category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: TransactionCategory.values.map((c) {
                  return DropdownMenuItem(
                    value: c,
                    child: Text(c.toString().split('.').last),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _category = v!),
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(labelText: 'Amount'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  if (double.tryParse(v) == null) return 'Invalid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _payeeNameController,
                decoration: const InputDecoration(labelText: 'Payee Name'),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _payeePhoneController,
                decoration: const InputDecoration(labelText: 'Payee Phone (Optional)'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              
              DropdownButtonFormField<PaymentMethod>(
                value: _paymentMethod,
                decoration: const InputDecoration(labelText: 'Payment Method'),
                items: PaymentMethod.values.map((m) {
                  return DropdownMenuItem(
                    value: m,
                    child: Text(m.toString().split('.').last),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _paymentMethod = v!),
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 2,
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 24),
              
              ElevatedButton(
                onPressed: _isSaving ? null : _save,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSaving 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) 
                  : const Text('Save Expense Voucher'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
