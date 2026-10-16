-- V8: Promo & Voucher Codes + Unlimited VIP Plan
CREATE TABLE promo_code (
    code             VARCHAR(64) PRIMARY KEY,
    discount_percent INT NOT NULL,
    plan             VARCHAR(32) NOT NULL DEFAULT 'ALL',
    max_uses         INT NOT NULL DEFAULT 0,
    used_count       INT NOT NULL DEFAULT 0,
    expires_at       TIMESTAMP WITH TIME ZONE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Insert UNLIMITED plan into pricing_plan (admin only / VIP promo)
INSERT INTO pricing_plan (id, name, price_idr, price_usd, duration_days, monthly_document_limit, certificate_max_recipients, max_api_keys, brand_footer, badge, is_active, stripe_price_id, updated_at)
VALUES
('UNLIMITED', 'VIP Unlimited', 0, 0, 36500, 1000000, 10000, 50, FALSE, 'Akses Penuh Tanpa Batas', FALSE, '', CURRENT_TIMESTAMP);

-- Default sample promo codes
INSERT INTO promo_code (code, discount_percent, plan, max_uses, used_count, expires_at, is_active, created_at)
VALUES
('PDFUMIFREE', 100, 'ALL', 100, 0, NULL, TRUE, CURRENT_TIMESTAMP),
('DISKON50', 50, 'ALL', 500, 0, NULL, TRUE, CURRENT_TIMESTAMP);
