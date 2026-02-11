import 'package:flutter/material.dart';
import '../models/member.dart';
import '../services/database_helper.dart';
import '../services/api_service.dart';
import 'member_form_screen.dart';

class MemberListScreen extends StatefulWidget {
  final ApiService apiService;
  const MemberListScreen({super.key, required this.apiService});

  @override
  State<MemberListScreen> createState() => _MemberListScreenState();
}

class _MemberListScreenState extends State<MemberListScreen> {
  List<Member> _members = [];
  bool _isLoading = true;
  late final String _parishId;

  @override
  void initState() {
    super.initState();
    _parishId = widget.apiService.currentUser?.parishId ?? '';
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    setState(() => _isLoading = true);
    try {
      final members = await DatabaseHelper.instance.getMembers(_parishId);
      setState(() {
        _members = members;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading members: $e');
      setState(() => _isLoading = false);
    }
  }

  void _navigateToAdd() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MemberFormScreen(parishId: _parishId),
      ),
    ).then((_) => _loadMembers());
  }

  void _navigateToEdit(Member member) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MemberFormScreen(parishId: _parishId, member: member),
      ),
    ).then((_) => _loadMembers());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Members'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMembers,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToAdd,
        child: const Icon(Icons.add),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _members.isEmpty
              ? const Center(child: Text('No members found'))
              : ListView.builder(
                  itemCount: _members.length,
                  itemBuilder: (context, index) {
                    final member = _members[index];
                    return ListTile(
                      leading: CircleAvatar(
                        child: Text(member.firstName[0] + member.lastName[0]),
                      ),
                      title: Text('${member.firstName} ${member.lastName}'),
                      subtitle: Text(member.memberCode),
                      onTap: () => _navigateToEdit(member),
                    );
                  },
                ),
    );
  }
}
