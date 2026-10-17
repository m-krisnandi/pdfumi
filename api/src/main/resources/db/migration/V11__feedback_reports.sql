-- Feedback & Bug Reports table
CREATE TABLE feedback_report (
    id             UUID PRIMARY KEY,
    category       VARCHAR(32)  NOT NULL, -- 'BUG', 'FEATURE', 'FEEDBACK'
    subject        VARCHAR(200) NOT NULL,
    description    TEXT         NOT NULL,
    email          VARCHAR(255) NULL,
    account_id     UUID         NULL,
    status         VARCHAR(32)  NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    admin_notes    TEXT         NULL,
    reply_message  TEXT         NULL,
    replied_at     TIMESTAMP WITH TIME ZONE NULL,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_status_created ON feedback_report(status, created_at DESC);
CREATE INDEX idx_feedback_category ON feedback_report(category);
CREATE INDEX idx_feedback_email ON feedback_report(email);
