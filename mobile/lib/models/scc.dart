class Scc {
  final String id;
  final String parishId;
  final String? clusterId;
  final String sccCode;
  final String sccName;
  final String? patronSaint;
  final String? leaderName;
  final String? locationDescription;
  final String? meetingDay;
  final String? meetingTime;
  final bool? isActive;
  final String? createdAt;
  final String? updatedAt;
  final String? deletedAt;

  Scc({
    required this.id,
    required this.parishId,
    this.clusterId,
    required this.sccCode,
    required this.sccName,
    this.patronSaint,
    this.leaderName,
    this.locationDescription,
    this.meetingDay,
    this.meetingTime,
    this.isActive,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory Scc.fromJson(Map<String, dynamic> json) {
    return Scc(
      id: json['id'],
      parishId: json['parish_id'],
      clusterId: json['cluster_id'],
      sccCode: json['scc_code'],
      sccName: json['scc_name'],
      patronSaint: json['patron_saint'],
      leaderName: json['leader_name'],
      locationDescription: json['location_description'],
      meetingDay: json['meeting_day'],
      meetingTime: json['meeting_time'],
      isActive: json['is_active'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
      deletedAt: json['deleted_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parish_id': parishId,
      'cluster_id': clusterId,
      'scc_code': sccCode,
      'scc_name': sccName,
      'patron_saint': patronSaint,
      'leader_name': leaderName,
      'location_description': locationDescription,
      'meeting_day': meetingDay,
      'meeting_time': meetingTime,
      'is_active': isActive,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'deleted_at': deletedAt,
    };
  }
}

class CreateSccRequest {
  final String parishId;
  final String? clusterId;
  final String sccCode;
  final String sccName;
  final String? patronSaint;
  final String? leaderName;
  final String? locationDescription;
  final String? meetingDay;
  final String? meetingTime;

  CreateSccRequest({
    required this.parishId,
    this.clusterId,
    required this.sccCode,
    required this.sccName,
    this.patronSaint,
    this.leaderName,
    this.locationDescription,
    this.meetingDay,
    this.meetingTime,
  });

  Map<String, dynamic> toJson() {
    return {
      'parish_id': parishId,
      'cluster_id': clusterId,
      'scc_code': sccCode,
      'scc_name': sccName,
      'patron_saint': patronSaint,
      'leader_name': leaderName,
      'location_description': locationDescription,
      'meeting_day': meetingDay,
      'meeting_time': meetingTime,
    };
  }
}
