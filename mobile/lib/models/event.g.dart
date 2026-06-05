// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Event _$EventFromJson(Map<String, dynamic> json) => Event(
      id: json['id'] as String,
      parishId: json['parishId'] as String?,
      dioceseId: json['dioceseId'] as String?,
      scope: $enumDecode(_$EventScopeEnumMap, json['scope']),
      title: json['title'] as String,
      description: json['description'] as String?,
      eventType: $enumDecode(_$EventTypeEnumMap, json['eventType']),
      eventStatus: $enumDecode(_$EventStatusEnumMap, json['eventStatus']),
      startDate: DateTime.parse(json['startDate'] as String),
      startTime: json['startTime'] == null
          ? null
          : DateTime.parse(json['startTime'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      endTime: json['endTime'] == null
          ? null
          : DateTime.parse(json['endTime'] as String),
      location: json['location'] as String?,
      organizerId: json['organizerId'] as String?,
      organizerName: json['organizerName'] as String?,
      maxParticipants: (json['maxParticipants'] as num?)?.toInt(),
      currentParticipants: (json['currentParticipants'] as num?)?.toInt(),
      registrationRequired: json['registrationRequired'] as bool?,
      registrationDeadline: json['registrationDeadline'] == null
          ? null
          : DateTime.parse(json['registrationDeadline'] as String),
      feeAmount: (json['feeAmount'] as num?)?.toDouble(),
      isPublic: json['isPublic'] as bool?,
      isLiturgical: json['isLiturgical'] as bool?,
      recurrencePattern:
          $enumDecode(_$RecurrencePatternEnumMap, json['recurrencePattern']),
      recurrenceEndDate: json['recurrenceEndDate'] == null
          ? null
          : DateTime.parse(json['recurrenceEndDate'] as String),
      parentEventId: json['parentEventId'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      deletedAt: json['deletedAt'] == null
          ? null
          : DateTime.parse(json['deletedAt'] as String),
    );

Map<String, dynamic> _$EventToJson(Event instance) => <String, dynamic>{
      'id': instance.id,
      'parishId': instance.parishId,
      'dioceseId': instance.dioceseId,
      'scope': _$EventScopeEnumMap[instance.scope]!,
      'title': instance.title,
      'description': instance.description,
      'eventType': _$EventTypeEnumMap[instance.eventType]!,
      'eventStatus': _$EventStatusEnumMap[instance.eventStatus]!,
      'startDate': instance.startDate.toIso8601String(),
      'startTime': instance.startTime?.toIso8601String(),
      'endDate': instance.endDate.toIso8601String(),
      'endTime': instance.endTime?.toIso8601String(),
      'location': instance.location,
      'organizerId': instance.organizerId,
      'organizerName': instance.organizerName,
      'maxParticipants': instance.maxParticipants,
      'currentParticipants': instance.currentParticipants,
      'registrationRequired': instance.registrationRequired,
      'registrationDeadline': instance.registrationDeadline?.toIso8601String(),
      'feeAmount': instance.feeAmount,
      'isPublic': instance.isPublic,
      'isLiturgical': instance.isLiturgical,
      'recurrencePattern':
          _$RecurrencePatternEnumMap[instance.recurrencePattern]!,
      'recurrenceEndDate': instance.recurrenceEndDate?.toIso8601String(),
      'parentEventId': instance.parentEventId,
      'notes': instance.notes,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'deletedAt': instance.deletedAt?.toIso8601String(),
    };

const _$EventScopeEnumMap = {
  EventScope.DIOCESE: 'DIOCESE',
  EventScope.PARISH: 'PARISH',
};

const _$EventTypeEnumMap = {
  EventType.MASS: 'MASS',
  EventType.MEETING: 'MEETING',
  EventType.CONFERENCE: 'CONFERENCE',
  EventType.RETREAT: 'RETREAT',
  EventType.WORKSHOP: 'WORKSHOP',
  EventType.SOCIAL: 'SOCIAL',
  EventType.FUNDRAISING: 'FUNDRAISING',
  EventType.ANNIVERSARY: 'ANNIVERSARY',
  EventType.FEAST_DAY: 'FEAST_DAY',
  EventType.OTHER: 'OTHER',
};

const _$EventStatusEnumMap = {
  EventStatus.PLANNED: 'PLANNED',
  EventStatus.SCHEDULED: 'SCHEDULED',
  EventStatus.IN_PROGRESS: 'IN_PROGRESS',
  EventStatus.COMPLETED: 'COMPLETED',
  EventStatus.CANCELLED: 'CANCELLED',
  EventStatus.POSTPONED: 'POSTPONED',
};

const _$RecurrencePatternEnumMap = {
  RecurrencePattern.NONE: 'NONE',
  RecurrencePattern.DAILY: 'DAILY',
  RecurrencePattern.WEEKLY: 'WEEKLY',
  RecurrencePattern.MONTHLY: 'MONTHLY',
  RecurrencePattern.YEARLY: 'YEARLY',
  RecurrencePattern.CUSTOM: 'CUSTOM',
};

CreateEventRequest _$CreateEventRequestFromJson(Map<String, dynamic> json) =>
    CreateEventRequest(
      parishId: json['parishId'] as String?,
      dioceseId: json['dioceseId'] as String?,
      scope: $enumDecode(_$EventScopeEnumMap, json['scope']),
      title: json['title'] as String,
      description: json['description'] as String?,
      eventType: $enumDecode(_$EventTypeEnumMap, json['eventType']),
      startDate: DateTime.parse(json['startDate'] as String),
      startTime: json['startTime'] == null
          ? null
          : DateTime.parse(json['startTime'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      endTime: json['endTime'] == null
          ? null
          : DateTime.parse(json['endTime'] as String),
      location: json['location'] as String?,
      maxParticipants: (json['maxParticipants'] as num?)?.toInt(),
      registrationRequired: json['registrationRequired'] as bool?,
      registrationDeadline: json['registrationDeadline'] == null
          ? null
          : DateTime.parse(json['registrationDeadline'] as String),
      feeAmount: (json['feeAmount'] as num?)?.toDouble(),
      isPublic: json['isPublic'] as bool?,
      isLiturgical: json['isLiturgical'] as bool?,
      recurrencePattern:
          $enumDecode(_$RecurrencePatternEnumMap, json['recurrencePattern']),
      recurrenceEndDate: json['recurrenceEndDate'] == null
          ? null
          : DateTime.parse(json['recurrenceEndDate'] as String),
      notes: json['notes'] as String?,
    );

Map<String, dynamic> _$CreateEventRequestToJson(CreateEventRequest instance) =>
    <String, dynamic>{
      'parishId': instance.parishId,
      'dioceseId': instance.dioceseId,
      'scope': _$EventScopeEnumMap[instance.scope]!,
      'title': instance.title,
      'description': instance.description,
      'eventType': _$EventTypeEnumMap[instance.eventType]!,
      'startDate': instance.startDate.toIso8601String(),
      'startTime': instance.startTime?.toIso8601String(),
      'endDate': instance.endDate.toIso8601String(),
      'endTime': instance.endTime?.toIso8601String(),
      'location': instance.location,
      'maxParticipants': instance.maxParticipants,
      'registrationRequired': instance.registrationRequired,
      'registrationDeadline': instance.registrationDeadline?.toIso8601String(),
      'feeAmount': instance.feeAmount,
      'isPublic': instance.isPublic,
      'isLiturgical': instance.isLiturgical,
      'recurrencePattern':
          _$RecurrencePatternEnumMap[instance.recurrencePattern]!,
      'recurrenceEndDate': instance.recurrenceEndDate?.toIso8601String(),
      'notes': instance.notes,
    };

UpdateEventRequest _$UpdateEventRequestFromJson(Map<String, dynamic> json) =>
    UpdateEventRequest(
      title: json['title'] as String?,
      description: json['description'] as String?,
      eventType: $enumDecodeNullable(_$EventTypeEnumMap, json['eventType']),
      eventStatus:
          $enumDecodeNullable(_$EventStatusEnumMap, json['eventStatus']),
      startDate: json['startDate'] == null
          ? null
          : DateTime.parse(json['startDate'] as String),
      startTime: json['startTime'] == null
          ? null
          : DateTime.parse(json['startTime'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      endTime: json['endTime'] == null
          ? null
          : DateTime.parse(json['endTime'] as String),
      location: json['location'] as String?,
      maxParticipants: (json['maxParticipants'] as num?)?.toInt(),
      registrationRequired: json['registrationRequired'] as bool?,
      registrationDeadline: json['registrationDeadline'] == null
          ? null
          : DateTime.parse(json['registrationDeadline'] as String),
      feeAmount: (json['feeAmount'] as num?)?.toDouble(),
      isPublic: json['isPublic'] as bool?,
      isLiturgical: json['isLiturgical'] as bool?,
      recurrencePattern: $enumDecodeNullable(
          _$RecurrencePatternEnumMap, json['recurrencePattern']),
      recurrenceEndDate: json['recurrenceEndDate'] == null
          ? null
          : DateTime.parse(json['recurrenceEndDate'] as String),
      notes: json['notes'] as String?,
    );

Map<String, dynamic> _$UpdateEventRequestToJson(UpdateEventRequest instance) =>
    <String, dynamic>{
      'title': instance.title,
      'description': instance.description,
      'eventType': _$EventTypeEnumMap[instance.eventType],
      'eventStatus': _$EventStatusEnumMap[instance.eventStatus],
      'startDate': instance.startDate?.toIso8601String(),
      'startTime': instance.startTime?.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'endTime': instance.endTime?.toIso8601String(),
      'location': instance.location,
      'maxParticipants': instance.maxParticipants,
      'registrationRequired': instance.registrationRequired,
      'registrationDeadline': instance.registrationDeadline?.toIso8601String(),
      'feeAmount': instance.feeAmount,
      'isPublic': instance.isPublic,
      'isLiturgical': instance.isLiturgical,
      'recurrencePattern':
          _$RecurrencePatternEnumMap[instance.recurrencePattern],
      'recurrenceEndDate': instance.recurrenceEndDate?.toIso8601String(),
      'notes': instance.notes,
    };

EventParticipant _$EventParticipantFromJson(Map<String, dynamic> json) =>
    EventParticipant(
      id: json['id'] as String,
      eventId: json['eventId'] as String,
      memberId: json['memberId'] as String?,
      familyId: json['familyId'] as String?,
      participantName: json['participantName'] as String,
      participantPhone: json['participantPhone'] as String?,
      participantEmail: json['participantEmail'] as String?,
      registrationDate: DateTime.parse(json['registrationDate'] as String),
      feePaid: json['feePaid'] as bool?,
      feeAmount: (json['feeAmount'] as num?)?.toDouble(),
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$EventParticipantToJson(EventParticipant instance) =>
    <String, dynamic>{
      'id': instance.id,
      'eventId': instance.eventId,
      'memberId': instance.memberId,
      'familyId': instance.familyId,
      'participantName': instance.participantName,
      'participantPhone': instance.participantPhone,
      'participantEmail': instance.participantEmail,
      'registrationDate': instance.registrationDate.toIso8601String(),
      'feePaid': instance.feePaid,
      'feeAmount': instance.feeAmount,
      'notes': instance.notes,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };
