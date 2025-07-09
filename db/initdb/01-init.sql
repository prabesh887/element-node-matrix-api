-- Create the redact_event table
CREATE TABLE IF NOT EXISTS redact_event (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(64)  NOT NULL,
    sender     VARCHAR(255) NOT NULL,
    content    JSONB,
    event_id   VARCHAR(255),
    room_id    VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_redact_event_type ON redact_event(type);
CREATE INDEX IF NOT EXISTS idx_redact_event_room_id ON redact_event(room_id);
CREATE INDEX IF NOT EXISTS idx_redact_event_created_at ON redact_event(created_at);
