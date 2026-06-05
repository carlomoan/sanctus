import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/event.dart';
import '../models/enums.dart';
import '../services/offline_api_service.dart';
import 'event_form_screen.dart';

class EventsScreen extends StatefulWidget {
  final OfflineApiService offlineApiService;

  const EventsScreen({super.key, required this.offlineApiService});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  List<Event> _events = [];
  List<Event> _filteredEvents = [];
  bool _isLoading = true;
  bool _isCalendarView = true;
  DateTime _currentMonth = DateTime.now();
  DateTime? _selectedDate;
  
  final TextEditingController _searchController = TextEditingController();
  String _selectedScope = 'all';
  String _selectedStatus = 'all';
  String _selectedEventType = 'all';

  @override
  void initState() {
    super.initState();
    _loadEvents();
    _searchController.addListener(_filterEvents);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadEvents() async {
    setState(() => _isLoading = true);
    try {
      final events = await widget.offlineApiService.getEvents();
      setState(() {
        _events = events;
        _filteredEvents = events;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading events: $e')),
        );
      }
    }
  }

  void _filterEvents() {
    setState(() {
      _filteredEvents = _events.where((event) {
        final matchesSearch = event.title.toLowerCase().contains(_searchController.text.toLowerCase()) ||
            (event.description?.toLowerCase().contains(_searchController.text.toLowerCase()) ?? false);
        final matchesScope = _selectedScope == 'all' || event.scope.name.toLowerCase() == _selectedScope;
        final matchesStatus = _selectedStatus == 'all' || event.eventStatus.name.toLowerCase() == _selectedStatus;
        final matchesType = _selectedEventType == 'all' || event.eventType.name.toLowerCase() == _selectedEventType;
        
        return matchesSearch && matchesScope && matchesStatus && matchesType;
      }).toList();
    });
  }

  void _toggleView() {
    setState(() {
      _isCalendarView = !_isCalendarView;
    });
  }

  void _previousMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
    });
  }

  List<Event> _getEventsForDate(DateTime date) {
    return _filteredEvents.where((event) {
      return event.startDate.year == date.year &&
          event.startDate.month == date.month &&
          event.startDate.day == date.day;
    }).toList();
  }

  void _showEventDetails(Event event) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => EventDetailsSheet(event: event),
    );
  }

  void _navigateToEventForm([Event? event]) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => EventFormScreen(
          offlineApiService: widget.offlineApiService,
          event: event,
        ),
      ),
    ).then((_) => _loadEvents());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Events'),
        actions: [
          IconButton(
            icon: Icon(_isCalendarView ? Icons.list : Icons.calendar_month),
            onPressed: _toggleView,
            tooltip: _isCalendarView ? 'List View' : 'Calendar View',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadEvents,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _isCalendarView
                    ? _buildCalendarView()
                    : _buildListView(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _navigateToEventForm(),
        child: const Icon(Icons.add),
        tooltip: 'Create Event',
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: const InputDecoration(
              labelText: 'Search Events',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedScope,
                  decoration: const InputDecoration(
                    labelText: 'Scope',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('All Scopes')),
                    DropdownMenuItem(value: 'diocese', child: Text('Diocese')),
                    DropdownMenuItem(value: 'parish', child: Text('Parish')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedScope = value!;
                    });
                    _filterEvents();
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedStatus,
                  decoration: const InputDecoration(
                    labelText: 'Status',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('All Status')),
                    DropdownMenuItem(value: 'planned', child: Text('Planned')),
                    DropdownMenuItem(value: 'scheduled', child: Text('Scheduled')),
                    DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
                    DropdownMenuItem(value: 'completed', child: Text('Completed')),
                    DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                    DropdownMenuItem(value: 'postponed', child: Text('Postponed')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedStatus = value!;
                    });
                    _filterEvents();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedEventType,
            decoration: const InputDecoration(
              labelText: 'Event Type',
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: const [
              DropdownMenuItem(value: 'all', child: Text('All Types')),
              DropdownMenuItem(value: 'mass', child: Text('Mass')),
              DropdownMenuItem(value: 'meeting', child: Text('Meeting')),
              DropdownMenuItem(value: 'conference', child: Text('Conference')),
              DropdownMenuItem(value: 'retreat', child: Text('Retreat')),
              DropdownMenuItem(value: 'workshop', child: Text('Workshop')),
              DropdownMenuItem(value: 'social', child: Text('Social')),
              DropdownMenuItem(value: 'fundraising', child: Text('Fundraising')),
              DropdownMenuItem(value: 'anniversary', child: Text('Anniversary')),
              DropdownMenuItem(value: 'feast_day', child: Text('Feast Day')),
              DropdownMenuItem(value: 'other', child: Text('Other')),
            ],
            onChanged: (value) {
              setState(() {
                _selectedEventType = value!;
              });
              _filterEvents();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarView() {
    return Column(
      children: [
        _buildCalendarHeader(),
        Expanded(child: _buildCalendarGrid()),
      ],
    );
  }

  Widget _buildCalendarHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: _previousMonth,
          ),
          Text(
            DateFormat('MMMM yyyy').format(_currentMonth),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: _nextMonth,
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarGrid() {
    final firstDayOfMonth = DateTime(_currentMonth.year, _currentMonth.month, 1);
    final lastDayOfMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 0);
    final startDate = firstDayOfMonth.subtract(Duration(days: firstDayOfMonth.weekday % 7));
    final endDate = lastDayOfMonth.add(Duration(days: (7 - lastDayOfMonth.weekday) % 7));

    final days = <DateTime>[];
    for (DateTime date = startDate;
        date.isBefore(endDate.add(const Duration(days: 1)));
        date = date.add(const Duration(days: 1))) {
      days.add(date);
    }

    return Column(
      children: [
        _buildWeekdayHeaders(),
        Expanded(
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1.0,
            ),
            itemCount: days.length,
            itemBuilder: (context, index) {
              final date = days[index];
              final events = _getEventsForDate(date);
              final isCurrentMonth = date.month == _currentMonth.month;
              final isSelected = _selectedDate != null &&
                  date.year == _selectedDate!.year &&
                  date.month == _selectedDate!.month &&
                  date.day == _selectedDate!.day;
              final isToday = DateTime.now().year == date.year &&
                  DateTime.now().month == date.month &&
                  DateTime.now().day == date.day;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedDate = date;
                  });
                  if (events.isNotEmpty) {
                    _showEventDetails(events.first);
                  }
                },
                child: Container(
                  margin: const EdgeInsets.all(1.0),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Theme.of(context).primaryColor.withOpacity(0.3)
                        : isToday
                            ? Colors.blue.withOpacity(0.1)
                            : isCurrentMonth
                                ? null
                                : Colors.grey.withOpacity(0.1),
                    border: Border.all(
                      color: isSelected
                          ? Theme.of(context).primaryColor
                          : isToday
                              ? Colors.blue
                              : Colors.grey.withOpacity(0.3),
                    ),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(4.0),
                        child: Text(
                          '${date.day}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                            color: isCurrentMonth ? null : Colors.grey,
                          ),
                        ),
                      ),
                      Expanded(
                        child: ListView.builder(
                          itemCount: events.length > 2 ? 2 : events.length,
                          itemBuilder: (context, index) {
                            final event = events[index];
                            return Container(
                              margin: const EdgeInsets.symmetric(horizontal: 1, vertical: 1),
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                color: _getEventColor(event.eventStatus),
                                borderRadius: BorderRadius.circular(2),
                              ),
                              child: Text(
                                event.title,
                                style: const TextStyle(fontSize: 8, color: Colors.white),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          },
                        ),
                      ),
                      if (events.length > 2)
                        Text(
                          '+${events.length - 2}',
                          style: const TextStyle(fontSize: 8, color: Colors.grey),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildWeekdayHeaders() {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: weekdays.map((day) {
          return Expanded(
            child: Center(
              child: Text(
                day,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildListView() {
    return ListView.builder(
      itemCount: _filteredEvents.length,
      itemBuilder: (context, index) {
        final event = _filteredEvents[index];
        return EventCard(
          event: event,
          onTap: () => _showEventDetails(event),
          onEdit: () => _navigateToEventForm(event),
        );
      },
    );
  }

  Color _getEventColor(EventStatus status) {
    switch (status) {
      case EventStatus.PLANNED:
        return Colors.blue;
      case EventStatus.SCHEDULED:
        return Colors.green;
      case EventStatus.IN_PROGRESS:
        return Colors.orange;
      case EventStatus.COMPLETED:
        return Colors.grey;
      case EventStatus.CANCELLED:
        return Colors.red;
      case EventStatus.POSTPONED:
        return Colors.purple;
    }
  }
}

class EventCard extends StatelessWidget {
  final Event event;
  final VoidCallback onTap;
  final VoidCallback onEdit;

  const EventCard({
    super.key,
    required this.event,
    required this.onTap,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8.0),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      event.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getScopeColor(event.scope),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      event.scope.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              if (event.description != null) ...[
                const SizedBox(height: 4),
                Text(
                  event.description!,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    DateFormat('MMM dd, yyyy').format(event.startDate),
                    style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  ),
                  if (event.startTime != null) ...[
                    const SizedBox(width: 8),
                    Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat('HH:mm').format(event.startTime!),
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                  ],
                ],
              ),
              if (event.location != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      event.location!,
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(event.eventStatus),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      event.eventStatus.name.replaceAll('_', ' ').toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.edit, size: 16),
                    onPressed: onEdit,
                    tooltip: 'Edit Event',
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getScopeColor(EventScope scope) {
    switch (scope) {
      case EventScope.DIOCESE:
        return Colors.purple;
      case EventScope.PARISH:
        return Colors.blue;
    }
  }

  Color _getStatusColor(EventStatus status) {
    switch (status) {
      case EventStatus.PLANNED:
        return Colors.blue;
      case EventStatus.SCHEDULED:
        return Colors.green;
      case EventStatus.IN_PROGRESS:
        return Colors.orange;
      case EventStatus.COMPLETED:
        return Colors.grey;
      case EventStatus.CANCELLED:
        return Colors.red;
      case EventStatus.POSTPONED:
        return Colors.purple;
    }
  }
}

class EventDetailsSheet extends StatelessWidget {
  final Event event;

  const EventDetailsSheet({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(16.0),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      event.title,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildDetailRow('Scope', event.scope.name),
              _buildDetailRow('Status', event.eventStatus.name.replaceAll('_', ' ')),
              _buildDetailRow('Type', event.eventType.name),
              _buildDetailRow('Date', DateFormat('MMMM dd, yyyy').format(event.startDate)),
              if (event.startTime != null)
                _buildDetailRow('Time', '${DateFormat('HH:mm').format(event.startTime!)}${event.endTime != null ? ' - ${DateFormat('HH:mm').format(event.endTime!)}' : ''}'),
              if (event.location != null) _buildDetailRow('Location', event.location!),
              if (event.description != null) _buildDetailRow('Description', event.description!),
              if (event.maxParticipants != null)
                _buildDetailRow('Participants', '${event.currentParticipants ?? 0}/${event.maxParticipants}'),
              if (event.feeAmount != null)
                _buildDetailRow('Fee', '\$${event.feeAmount!.toStringAsFixed(2)}'),
              if (event.registrationRequired == true)
                _buildDetailRow('Registration', 'Required'),
              if (event.recurrencePattern != RecurrencePattern.NONE)
                _buildDetailRow('Recurrence', event.recurrencePattern.name),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}
