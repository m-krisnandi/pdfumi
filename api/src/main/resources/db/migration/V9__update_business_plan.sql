-- Update BUSINESS plan to Pro Tahunan with 6000 docs (500/mo parity)
UPDATE pricing_plan
SET name = 'Pro Tahunan', monthly_document_limit = 6000, updated_at = CURRENT_TIMESTAMP
WHERE id = 'BUSINESS';
