-- Attendance_Table
CREATE TABLE attendance_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    member_id UUID REFERENCES member(id) ON DELETE CASCADE,
    scc_id UUID REFERENCES scc(id) ON DELETE CASCADE,
    event_id UUID,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED')),
    check_in_time TIME,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (member_id IS NOT NULL OR scc_id IS NOT NULL OR event_id IS NOT NULL)
);
CREATE INDEX idx_attendance_parish_date ON attendance_record(parish_id, attendance_date);
CREATE INDEX idx_attendance_member ON attendance_record(member_id);
CREATE INDEX idx_attendance_scc ON attendance_record(scc_id);