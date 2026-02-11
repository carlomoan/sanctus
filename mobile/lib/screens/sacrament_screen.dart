import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/sacrament.dart';
import '../models/enums.dart';
import '../models/member.dart';
import '../services/database_helper.dart';
import '../services/api_service.dart';

class SacramentScreen extends StatefulWidget {
  final ApiService apiService;
  const SacramentScreen({super.key, required this.apiService});

  @override
  State<SacramentScreen> createState() => _SacramentScreenState();
}

class _SacramentScreenState extends State<SacramentScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Controllers
  final _memberIdController = TextEditingController(); 
  final _dateController = TextEditingController();
  final _ministerController = TextEditingController();
  final _churchNameController = TextEditingController();
  final _notesController = TextEditingController();
  
  SacramentType _sacramentType = SacramentType.BAPTISM;
  String? _selectedMemberName;
  late final String _parishId;
  
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _parishId = widget.apiService.currentUser?.parishId ?? '';
    _dateController.text = DateTime.now().toIso8601String().split('T')[0];
  }

  // Helper to pick member
  Future<void> _pickMember() async {
    final members = await DatabaseHelper.instance.getMembers(_parishId);
    
    if (!mounted) return;

    final Member? picked = await showDialog<Member>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Select Member'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: members.length,
            itemBuilder: (context, index) {
              final m = members[index];
              return ListTile(
                title: Text('${m.firstName} ${m.lastName}'),
                subtitle: Text(m.memberCode),
                onTap: () => Navigator.pop(ctx, m),
              );
            },
          ),
        ),
      ),
    );

    if (picked != null) {
      setState(() {
        _memberIdController.text = picked.id;
        _selectedMemberName = '${picked.firstName} ${picked.lastName}';
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_memberIdController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a member')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final uuid = const Uuid();
      final now = DateTime.now().toIso8601String();
      final parishId = '550e8400-e29b-41d4-a716-446655440000'; 

      final record = SacramentRecord(
        id: uuid.v4(),
        memberId: _memberIdController.text,
        sacramentType: _sacramentType,
        sacramentDate: _dateController.text,
        officiatingMinister: _ministerController.text.isNotEmpty ? _ministerController.text : null,
        parishId: parishId,
        churchName: _churchNameController.text.isNotEmpty ? _churchNameController.text : null,
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
        createdAt: now,
        updatedAt: now,
      );

      await DatabaseHelper.instance.insertSacrament(record);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sacrament recorded successfully')),
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
      appBar: AppBar(title: const Text('Record Sacrament')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              // Member Selection
              InkWell(
                onTap: _pickMember,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Member',
                    suffixIcon: Icon(Icons.person_search),
                    border: OutlineInputBorder(),
                  ),
                  child: Text(
                    _selectedMemberName ?? 'Select Member',
                    style: TextStyle(
                      color: _selectedMemberName == null ? Colors.grey : Colors.black,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              DropdownButtonFormField<SacramentType>(
                value: _sacramentType,
                decoration: const InputDecoration(labelText: 'Sacrament Type'),
                items: SacramentType.values.map((s) {
                  return DropdownMenuItem(
                    value: s,
                    child: Text(s.toString().split('.').last),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _sacramentType = v!),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _dateController,
                decoration: const InputDecoration(labelText: 'Date (YYYY-MM-DD)'),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _ministerController,
                decoration: const InputDecoration(labelText: 'Officiating Minister'),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _churchNameController,
                decoration: const InputDecoration(labelText: 'Church Name (if different)'),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(labelText: 'Notes'),
                maxLines: 2,
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isSaving ? null : _save,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSaving 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) 
                  : const Text('Save Sacrament Record'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
