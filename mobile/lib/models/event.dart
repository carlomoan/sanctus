import 'package:json_annotation/json_annotation.dart';
import 'enums.dart';

part 'event.g.dart';

@JsonSerializable()
class Event {
  final String id;
  final String? parishId;
  final String? dioceseId;
  final EventScope scope;
  final String title;
  final String? description;
  final EventType eventType;
  final EventStatus eventStatus;
  final DateTime startDate;
  final DateTime? startTime;
  final DateTime endDate;
  final DateTime? endTime;
  final String? location;
  final String? organizerId;
  final String? organizerName;
  final int? maxParticipants;
  final int? currentParticipants;
  final bool? registrationRequired;
  final DateTime? registrationDeadline;
  final double? feeAmount;
  final bool? isPublic;
  final bool? isLiturgical;
  final RecurrencePattern recurrencePattern;
  final DateTime? recurrenceEndDate;
  final String? parentEventId;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;

  Event({
    required this.id,
    this.parishId,
    this.dioceseId,
    required this.scope,
    required this.title,
    this.description,
    required this.eventType,
    required this.eventStatus,
    required this.startDate,
    this.startTime,
    required this.endDate,
    this.endTime,
    this.location,
    this.organizerId,
    this.organizerName,
    this.maxParticipants,
    this.currentParticipants,
    this.registrationRequired,
    this.registrationDeadline,
    this.feeAmount,
    this.isPublic,
    this.isLiturgical,
    required this.recurrencePattern,
    this.recurrenceEndDate,
    this.parentEventId,
    this.notes,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);
  Map<String, dynamic> toJson() => _$EventToJson(this);

  Event copyWith({
    String? id,
    String? parishId,
    String? dioceseId,
    EventScope? scope,
    String? title,
    String? description,
    EventType? eventType,
    EventStatus? eventStatus,
    DateTime? startDate,
    DateTime? startTime,
    DateTime? endDate,
    DateTime? endTime,
    String? location,
    String? organizerId,
    String? organizerName,
    int? maxParticipants,
    int? currentParticipants,
    bool? registrationRequired,
    DateTime? registrationDeadline,
    double? feeAmount,
    bool? isPublic,
    bool? isLiturgical,
    RecurrencePattern? recurrencePattern,
    DateTime? recurrenceEndDate,
    String? parentEventId,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deletedAt,
  }) {
    return Event(
      id: id ?? this.id,
      parishId: parishId ?? this.parishId,
      dioceseId: dioceseId ?? this.dioceseId,
      scope: scope ?? this.scope,
      title: title ?? this.title,
      description: description ?? this.description,
      eventType: eventType ?? this.eventType,
      eventStatus: eventStatus ?? this.eventStatus,
      startDate: startDate ?? this.startDate,
      startTime: startTime ?? this.startTime,
      endDate: endDate ?? this.endDate,
      endTime: endTime ?? this.endTime,
      location: location ?? this.location,
      organizerId: organizerId ?? this.organizerId,
      organizerName: organizerName ?? this.organizerName,
      maxParticipants: maxParticipants ?? this.maxParticipants,
      currentParticipants: currentParticipants ?? this.currentParticipants,
      registrationRequired: registrationRequired ?? this.registrationRequired,
      registrationDeadline: registrationDeadline ?? this.registrationDeadline,
      feeAmount: feeAmount ?? this.feeAmount,
      isPublic: isPublic ?? this.isPublic,
      isLiturgical: isLiturgical ?? this.isLiturgical,
      recurrencePattern: recurrencePattern ?? this.recurrencePattern,
      recurrenceEndDate: recurrenceEndDate ?? this.recurrenceEndDate,
      parentEventId: parentEventId ?? this.parentEventId,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Event &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'Event{id: $id, title: $title, startDate: $startDate, scope: $scope}';
  }
}

@JsonSerializable()
class CreateEventRequest {
  final String? parishId;
  final String? dioceseId;
  final EventScope scope;
  final String title;
  final String? description;
  final EventType eventType;
  final DateTime startDate;
  final DateTime? startTime;
  final DateTime endDate;
  final DateTime? endTime;
  final String? location;
  final int? maxParticipants;
  final bool? registrationRequired;
  final DateTime? registrationDeadline;
  final double? feeAmount;
  final bool? isPublic;
  final bool? isLiturgical;
  final RecurrencePattern recurrencePattern;
  final DateTime? recurrenceEndDate;
  final String? notes;

  CreateEventRequest({
    this.parishId,
    this.dioceseId,
    required this.scope,
    required this.title,
    this.description,
    required this.eventType,
    required this.startDate,
    this.startTime,
    required this.endDate,
    this.endTime,
    this.location,
    this.maxParticipants,
    this.registrationRequired,
    this.registrationDeadline,
    this.feeAmount,
    this.isPublic,
    this.isLiturgical,
    required this.recurrencePattern,
    this.recurrenceEndDate,
    this.notes,
  });

  factory CreateEventRequest.fromJson(Map<String, dynamic> json) => _$CreateEventRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateEventRequestToJson(json);
}

@JsonSerializable()
class UpdateEventRequest {
  final String? title;
  final String? description;
  final EventType? eventType;
  final EventStatus? eventStatus;
  final DateTime? startDate;
  final DateTime? startTime;
  final DateTime? endDate;
  final DateTime? endTime;
  final String? location;
  final int? maxParticipants;
  final bool? registrationRequired;
  final DateTime? registrationDeadline;
  final double? feeAmount;
  final bool? isPublic;
  final bool? isLiturgical;
  final RecurrencePattern? recurrencePattern;
  final DateTime? recurrenceEndDate;
  final String? notes;

  UpdateEventRequest({
    this.title,
    this.description,
    this.eventType,
    this.eventStatus,
    this.startDate,
    this.startTime,
    this.endDate,
    this.endTime,
    this.location,
    this.maxParticipants,
    this.registrationRequired,
    this.registrationDeadline,
    this.feeAmount,
    this.isPublic,
    this.isLiturgical,
    this.recurrencePattern,
    this.recurrenceEndDate,
    this.notes,
  });

  factory UpdateEventRequest.fromJson(Map<String, dynamic> json) => _$UpdateEventRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateEventRequestToJson(json);
}

@JsonSerializable()
class EventParticipant {
  final String id;
  final String eventId;
  final String? memberId;
  final String? familyId;
  final String participantName;
  final String? participantPhone;
  final String? participantEmail;
  final DateTime registrationDate;
  final bool? feePaid;
  final double? feeAmount;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  EventParticipant({
    required this.id,
    required this.eventId,
    this.memberId,
    this.familyId,
    required this.participantName,
    this.participantPhone,
    this.participantEmail,
    required this.registrationDate,
    this.feePaid,
    this.feeAmount,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  factory EventParticipant.fromJson(Map<String, dynamic> json) => _$EventParticipantFromJson(json);
  Map<String, dynamic> toJson() => _$EventParticipantToJson(this);
}
