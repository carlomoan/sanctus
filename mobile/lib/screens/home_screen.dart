import 'package:flutter/material.dart';
import 'collection_screen.dart';
import 'sync_screen.dart';
import 'member_list_screen.dart';
import 'expense_screen.dart';
import 'sacrament_screen.dart';
import 'events_screen.dart';
import '../services/offline_api_service.dart';
import '../services/sync_service.dart';
import '../models/user.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  final OfflineApiService offlineApiService;
  final User user;
  final bool isOffline;

  const HomeScreen({
    super.key, 
    required this.offlineApiService,
    required this.user,
    this.isOffline = false,
  });

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late bool _isOffline;
  Stream<SyncStatus>? _syncStatusStream;

  @override
  void initState() {
    super.initState();
    _isOffline = widget.isOffline;
    _syncStatusStream = widget.offlineApiService.syncStatusStream;
    _syncStatusStream?.listen((status) {
      if (mounted) {
        setState(() {
          _isOffline = status == SyncStatus.noConnection;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Sanctus'),
            if (_isOffline) ...[
              const SizedBox(width: 8),
              Icon(
                Icons.cloud_off,
                size: 20,
                color: Colors.orange,
              ),
            ],
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: () async {
              await widget.offlineApiService.triggerSync();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Sync started')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await widget.offlineApiService.logout();
              if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (context) => LoginScreen(
                      offlineApiService: widget.offlineApiService,
                    ),
                  ),
                );
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User welcome section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Colors.blue,
                      child: Text(
                        widget.user.fullName.isNotEmpty 
                            ? widget.user.fullName[0].toUpperCase()
                            : 'U',
                        style: const TextStyle(color: Colors.white, fontSize: 20),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Welcome, ${widget.user.fullName}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            widget.user.email,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                          Text(
                            widget.user.role.toString(),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blue[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_isOffline)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.orange[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.cloud_off, size: 14, color: Colors.orange[700]),
                            const SizedBox(width: 4),
                            Text(
                              'Offline',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange[700],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Quick actions grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.2,
              children: [
                _buildActionCard(
                  context,
                  'Members',
                  Icons.people,
                  Colors.blue,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MemberListScreen(
                        offlineApiService: widget.offlineApiService,
                      ),
                    ),
                  ),
                ),
                _buildActionCard(
                  context,
                  'Events',
                  Icons.event,
                  Colors.orange,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => EventsScreen(
                        offlineApiService: widget.offlineApiService,
                      ),
                    ),
                  ),
                ),
                _buildActionCard(
                  context,
                  'Collections',
                  Icons.attach_money,
                  Colors.green,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CollectionScreen(
                        offlineApiService: widget.offlineApiService,
                      ),
                    ),
                  ),
                ),
                _buildActionCard(
                  context,
                  'Expenses',
                  Icons.money_off,
                  Colors.red,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ExpenseScreen(
                        offlineApiService: widget.offlineApiService,
                      ),
                    ),
                  ),
                ),
                _buildActionCard(
                  context,
                  'Sacraments',
                  Icons.book,
                  Colors.purple,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => SacramentScreen(
                        offlineApiService: widget.offlineApiService,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Sync status card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.sync, color: Colors.blue),
                        const SizedBox(width: 8),
                        const Text(
                          'Sync Status',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => SyncScreen(
                                offlineApiService: widget.offlineApiService,
                              ),
                            ),
                          ),
                          child: const Text('Details'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    FutureBuilder<SyncStats>(
                      future: widget.offlineApiService.getSyncStatus(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const CircularProgressIndicator();
                        }
                        
                        final stats = snapshot.data;
                        if (stats == null) {
                          return const Text('Unable to get sync status');
                        }
                        
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  stats.isOnline ? Icons.cloud_done : Icons.cloud_off,
                                  size: 16,
                                  color: stats.isOnline ? Colors.green : Colors.orange,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  stats.isOnline ? 'Online' : 'Offline',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: stats.isOnline ? Colors.green : Colors.orange,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Pending changes: ${stats.pendingCount}',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                            if (stats.lastSyncTime != null)
                              Text(
                                'Last sync: ${_formatDateTime(stats.lastSyncTime!)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: color,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes} minutes ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours} hours ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}
