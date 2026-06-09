-- Create notifications table for SMS, email, and in-app notifications
-- This integrates with Africa's Talking SMS gateway

CREATE TYPE notification_type AS ENUM ('SMS', 'EMAIL', 'IN_APP');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    reference_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_parish ON notifications(parish_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_status ON notifications(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(notification_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC) WHERE deleted_at IS NULL;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Notifications for SMS, email, and in-app messages';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: SMS, EMAIL, or IN_APP';
COMMENT ON COLUMN notifications.recipient IS 'Phone number for SMS, email address for email, user ID for in-app';
COMMENT ON COLUMN notifications.reference_id IS 'External reference ID from SMS provider (e.g., Africa''s Talking)';
COMMENT ON COLUMN notifications.error_message IS 'Error message if sending failed';
