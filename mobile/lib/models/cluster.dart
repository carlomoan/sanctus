class Cluster {
  final String id;
  final String parishId;
  final String clusterCode;
  final String clusterName;
  final String? locationDescription;
  final String? leaderName;
  final bool? isActive;
  final String? createdAt;
  final String? updatedAt;
  final String? deletedAt;

  Cluster({
    required this.id,
    required this.parishId,
    required this.clusterCode,
    required this.clusterName,
    this.locationDescription,
    this.leaderName,
    this.isActive,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory Cluster.fromJson(Map<String, dynamic> json) {
    return Cluster(
      id: json['id'],
      parishId: json['parish_id'],
      clusterCode: json['cluster_code'],
      clusterName: json['cluster_name'],
      locationDescription: json['location_description'],
      leaderName: json['leader_name'],
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
      'cluster_code': clusterCode,
      'cluster_name': clusterName,
      'location_description': locationDescription,
      'leader_name': leaderName,
      'is_active': isActive,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'deleted_at': deletedAt,
    };
  }
}

class CreateClusterRequest {
  final String parishId;
  final String clusterCode;
  final String clusterName;
  final String? locationDescription;
  final String? leaderName;

  CreateClusterRequest({
    required this.parishId,
    required this.clusterCode,
    required this.clusterName,
    this.locationDescription,
    this.leaderName,
  });

  Map<String, dynamic> toJson() {
    return {
      'parish_id': parishId,
      'cluster_code': clusterCode,
      'cluster_name': clusterName,
      'location_description': locationDescription,
      'leader_name': leaderName,
    };
  }
}
