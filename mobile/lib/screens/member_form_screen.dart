import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/member.dart';
import '../models/enums.dart';
import '../services/database_helper.dart';

class MemberFormScreen extends StatefulWidget {
  final String parishId;
  final Member? member;

  const MemberFormScreen({super.key, required this.parishId, this.member});

  @override
  State<MemberFormScreen> createState() => _MemberFormScreenState();
}

class _MemberFormScreenState extends State<MemberFormScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _memberCodeController;
  late TextEditingController _phoneController;
  
  GenderType _gender = GenderType.MALE;
  MaritalStatus _maritalStatus = MaritalStatus.SINGLE;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.member?.firstName ?? '');
    _lastNameController = TextEditingController(text: widget.member?.lastName ?? '');
    _memberCodeController = TextEditingController(text: widget.member?.memberCode ?? '');
    _phoneController = TextEditingController(text: widget.member?.phoneNumber ?? '');
    
    if (widget.member != null) {
      if (widget.member!.gender != null) _gender = widget.member!.gender!;
      if (widget.member!.maritalStatus != null) _maritalStatus = widget.member!.maritalStatus!;
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final now = DateTime.now().toIso8601String();
      final isEdit = widget.member != null;
      
      final member = Member(
        id: isEdit ? widget.member!.id : const Uuid().v4(),
        parishId: widget.parishId,
        memberCode: _memberCodeController.text,
        firstName: _firstNameController.text,
        lastName: _lastNameController.text,
        gender: _gender,
        maritalStatus: _maritalStatus,
        phoneNumber: _phoneController.text.isEmpty ? null : _phoneController.text,
        isActive: true,
        createdAt: isEdit ? widget.member!.createdAt : now,
        updatedAt: now,
      );

      if (isEdit) {
        await DatabaseHelper.instance.updateMember(member);
      } else {
        await DatabaseHelper.instance.insertMember(member);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Member saved successfully')),
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
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.member == null ? 'Add Member' : 'Edit Member')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _memberCodeController,
                decoration: const InputDecoration(labelText: 'Member Code'),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _firstNameController,
                      decoration: const InputDecoration(labelText: 'First Name'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _lastNameController,
                      decoration: const InputDecoration(labelText: 'Last Name'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<GenderType>(
                value: _gender,
                decoration: const InputDecoration(labelText: 'Gender'),
                items: GenderType.values.map((g) {
                  return DropdownMenuItem(value: g, child: Text(g.toString().split('.').last));
                }).toList(),
                onChanged: (v) => setState(() => _gender = v!),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<MaritalStatus>(
                value: _maritalStatus,
                decoration: const InputDecoration(labelText: 'Marital Status'),
                items: MaritalStatus.values.map((s) {
                  return DropdownMenuItem(value: s, child: Text(s.toString().split('.').last));
                }).toList(),
                onChanged: (v) => setState(() => _maritalStatus = v!),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone Number'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isSaving ? null : _save,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _isSaving 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) 
                  : const Text('Save Member'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
