import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/event.dart';
import '../models/enums.dart';
import '../services/offline_api_service.dart';

class EventFormScreen extends StatefulWidget {
  final OfflineApiService offlineApiService;
  final Event? event;

  const EventFormScreen({
    super.key,
    required this.offlineApiService,
    this.event,
  });

  @override
  State<EventFormScreen> createState() => _EventFormScreenState();
}

class _EventFormScreenState extends State<EventFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _maxParticipantsController = TextEditingController();
  final _feeAmountController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  DateTime? _registrationDeadline;

  EventScope _scope = EventScope.PARISH;
  EventType _eventType = EventType.MASS;
  EventStatus _eventStatus = EventStatus.PLANNED;
  RecurrencePattern _recurrencePattern = RecurrencePattern.NONE;
  DateTime? _recurrenceEndDate;

  bool _registrationRequired = false;
  bool _isPublic = true;
  bool _isLiturgical = false;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.event != null) {
      _populateFields();
    }
  }

  void _populateFields() {
    final event = widget.event!;
    _titleController.text = event.title;
    _descriptionController.text = event.description ?? '';
    _locationController.text = event.location ?? '';
    _maxParticipantsController.text = event.maxParticipants?.toString() ?? '';
    _feeAmountController.text = event.feeAmount?.toString() ?? '';
    _notesController.text = event.notes ?? '';

    _startDate = event.startDate;
    _endDate = event.endDate;
    _startTime = event.startTime != null
        ? TimeOfDay.fromDateTime(event.startTime!)
        : null;
    _endTime = event.endTime != null
        ? TimeOfDay.fromDateTime(event.endTime!)
        : null;
    _registrationDeadline = event.registrationDeadline;

    _scope = event.scope;
    _eventType = event.eventType;
    _eventStatus = event.eventStatus;
    _recurrencePattern = event.recurrencePattern;
    _recurrenceEndDate = event.recurrenceEndDate;

    _registrationRequired = event.registrationRequired ?? false;
    _isPublic = event.isPublic ?? true;
    _isLiturgical = event.isLiturgical ?? false;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _maxParticipantsController.dispose();
    _feeAmountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _saveEvent() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final user = widget.offlineApiService.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      if (widget.event == null) {
        // Create new event
        final createRequest = CreateEventRequest(
          parishId: _scope == EventScope.PARISH ? user.parishId : null,
          dioceseId: _scope == EventScope.DIOCESE ? user.dioceseId : null,
          scope: _scope,
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty
              ? null
              : _descriptionController.text.trim(),
          eventType: _eventType,
          startDate: _startDate,
          startTime: _startTime != null
              ? DateTime(
                  _startDate.year,
                  _startDate.month,
                  _startDate.day,
                  _startTime!.hour,
                  _startTime!.minute,
                )
              : null,
          endDate: _endDate,
          endTime: _endTime != null
              ? DateTime(
                  _endDate.year,
                  _endDate.month,
                  _endDate.day,
                  _endTime!.hour,
                  _endTime!.minute,
                )
              : null,
          location: _locationController.text.trim().isEmpty
              ? null
              : _locationController.text.trim(),
          maxParticipants: _maxParticipantsController.text.trim().isEmpty
              ? null
              : int.tryParse(_maxParticipantsController.text.trim()),
          registrationRequired: _registrationRequired,
          registrationDeadline: _registrationDeadline,
          feeAmount: _feeAmountController.text.trim().isEmpty
              ? null
              : double.tryParse(_feeAmountController.text.trim()),
          isPublic: _isPublic,
          isLiturgical: _isLiturgical,
          recurrencePattern: _recurrencePattern,
          recurrenceEndDate: _recurrenceEndDate,
          notes: _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
        );

        await widget.offlineApiService.createEvent(createRequest);
      } else {
        // Update existing event
        final updateRequest = UpdateEventRequest(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty
              ? null
              : _descriptionController.text.trim(),
          eventType: _eventType,
          eventStatus: _eventStatus,
          startDate: _startDate,
          startTime: _startTime != null
              ? DateTime(
                  _startDate.year,
                  _startDate.month,
                  _startDate.day,
                  _startTime!.hour,
                  _startTime!.minute,
                )
              : null,
          endDate: _endDate,
          endTime: _endTime != null
              ? DateTime(
                  _endDate.year,
                  _endDate.month,
                  _endDate.day,
                  _endTime!.hour,
                  _endTime!.minute,
                )
              : null,
          location: _locationController.text.trim().isEmpty
              ? null
              : _locationController.text.trim(),
          maxParticipants: _maxParticipantsController.text.trim().isEmpty
              ? null
              : int.tryParse(_maxParticipantsController.text.trim()),
          registrationRequired: _registrationRequired,
          registrationDeadline: _registrationDeadline,
          feeAmount: _feeAmountController.text.trim().isEmpty
              ? null
              : double.tryParse(_feeAmountController.text.trim()),
          isPublic: _isPublic,
          isLiturgical: _isLiturgical,
          recurrencePattern: _recurrencePattern,
          recurrenceEndDate: _recurrenceEndDate,
          notes: _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
        );

        await widget.offlineApiService.updateEvent(widget.event!.id, updateRequest);
      }

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.event == null ? 'Event created' : 'Event updated'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _selectDate(BuildContext context, bool isStartDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStartDate ? _startDate : _endDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        if (isStartDate) {
          _startDate = picked;
          if (_endDate.isBefore(_startDate)) {
            _endDate = _startDate;
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _selectTime(BuildContext context, bool isStartTime) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: isStartTime ? (_startTime ?? TimeOfDay.now()) : (_endTime ?? TimeOfDay.now()),
    );
    if (picked != null) {
      setState(() {
        if (isStartTime) {
          _startTime = picked;
        } else {
          _endTime = picked;
        }
      });
    }
  }

  Future<void> _selectRegistrationDeadline(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _registrationDeadline ?? _startDate,
      firstDate: DateTime.now(),
      lastDate: _startDate,
    );
    if (picked != null) {
      setState(() {
        _registrationDeadline = picked;
      });
    }
  }

  Future<void> _selectRecurrenceEndDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _recurrenceEndDate ?? _startDate,
      firstDate: _startDate,
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        _recurrenceEndDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.event == null ? 'Create Event' : 'Edit Event'),
        actions: [
          if (widget.event != null)
            IconButton(
              icon: const Icon(Icons.delete),
              onPressed: _deleteEvent,
              tooltip: 'Delete Event',
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Event Title *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter an event title';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<EventScope>(
                value: _scope,
                decoration: const InputDecoration(
                  labelText: 'Event Scope *',
                  border: OutlineInputBorder(),
                ),
                items: EventScope.values.map((scope) {
                  return DropdownMenuItem(
                    value: scope,
                    child: Text(scope.name),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _scope = value!;
                  });
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<EventType>(
                value: _eventType,
                decoration: const InputDecoration(
                  labelText: 'Event Type *',
                  border: OutlineInputBorder(),
                ),
                items: EventType.values.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type.name),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _eventType = value!;
                  });
                },
              ),
              if (widget.event != null) ...[
                const SizedBox(height: 16),
                DropdownButtonFormField<EventStatus>(
                  value: _eventStatus,
                  decoration: const InputDecoration(
                    labelText: 'Event Status',
                    border: OutlineInputBorder(),
                  ),
                  items: EventStatus.values.map((status) {
                    return DropdownMenuItem(
                      value: status,
                      child: Text(status.name.replaceAll('_', ' ')),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _eventStatus = value!;
                    });
                  },
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectDate(context, true),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Start Date *',
                          border: OutlineInputBorder(),
                        ),
                        child: Text(DateFormat('MMM dd, yyyy').format(_startDate)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectTime(context, true),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Start Time',
                          border: OutlineInputBorder(),
                          suffixIcon: Icon(Icons.access_time),
                        ),
                        child: Text(_startTime?.format(context) ?? 'Not set'),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectDate(context, false),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'End Date *',
                          border: OutlineInputBorder(),
                        ),
                        child: Text(DateFormat('MMM dd, yyyy').format(_endDate)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: InkWell(
                      onTap: () => _selectTime(context, false),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'End Time',
                          border: OutlineInputBorder(),
                          suffixIcon: Icon(Icons.access_time),
                        ),
                        child: Text(_endTime?.format(context) ?? 'Not set'),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _locationController,
                decoration: const InputDecoration(
                  labelText: 'Location',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.location_on),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _maxParticipantsController,
                decoration: const InputDecoration(
                  labelText: 'Max Participants',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.people),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value != null && value.isNotEmpty) {
                    final number = int.tryParse(value);
                    if (number == null || number <= 0) {
                      return 'Please enter a valid number';
                    }
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Registration Required'),
                subtitle: const Text('Require participants to register'),
                value: _registrationRequired,
                onChanged: (value) {
                  setState(() {
                    _registrationRequired = value;
                  });
                },
              ),
              if (_registrationRequired) ...[
                const SizedBox(height: 16),
                InkWell(
                  onTap: () => _selectRegistrationDeadline(context),
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Registration Deadline',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.event),
                    ),
                    child: Text(
                      _registrationDeadline != null
                          ? DateFormat('MMM dd, yyyy').format(_registrationDeadline!)
                          : 'Not set',
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              TextFormField(
                controller: _feeAmountController,
                decoration: const InputDecoration(
                  labelText: 'Fee Amount',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.attach_money),
                ),
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  if (value != null && value.isNotEmpty) {
                    final amount = double.tryParse(value);
                    if (amount == null || amount < 0) {
                      return 'Please enter a valid amount';
                    }
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Public Event'),
                subtitle: const Text('Make this event visible to everyone'),
                value: _isPublic,
                onChanged: (value) {
                  setState(() {
                    _isPublic = value;
                  });
                },
              ),
              SwitchListTile(
                title: const Text('Liturgical Event'),
                subtitle: const Text('Mark as a liturgical/church event'),
                value: _isLiturgical,
                onChanged: (value) {
                  setState(() {
                    _isLiturgical = value;
                  });
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<RecurrencePattern>(
                value: _recurrencePattern,
                decoration: const InputDecoration(
                  labelText: 'Recurrence Pattern',
                  border: OutlineInputBorder(),
                ),
                items: RecurrencePattern.values.map((pattern) {
                  return DropdownMenuItem(
                    value: pattern,
                    child: Text(pattern.name),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _recurrencePattern = value!;
                  });
                },
              ),
              if (_recurrencePattern != RecurrencePattern.NONE) ...[
                const SizedBox(height: 16),
                InkWell(
                  onTap: () => _selectRecurrenceEndDate(context),
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Recurrence End Date',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.event_repeat),
                    ),
                    child: Text(
                      _recurrenceEndDate != null
                          ? DateFormat('MMM dd, yyyy').format(_recurrenceEndDate!)
                          : 'No end date',
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Additional Notes',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveEvent,
                  child: _isLoading
                      ? const CircularProgressIndicator()
                      : Text(widget.event == null ? 'Create Event' : 'Update Event'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _deleteEvent() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Event'),
        content: const Text('Are you sure you want to delete this event? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await widget.offlineApiService.deleteEvent(widget.event!.id);
        if (mounted) {
          Navigator.of(context).pop();
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Event deleted')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }
}
