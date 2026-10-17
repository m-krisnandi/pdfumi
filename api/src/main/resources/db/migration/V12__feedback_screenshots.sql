-- Add screenshots support to feedback_report
ALTER TABLE feedback_report ADD COLUMN IF NOT EXISTS screenshots TEXT NULL;
