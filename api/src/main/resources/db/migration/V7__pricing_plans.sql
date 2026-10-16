-- Pricing Plans (Dynamic CRUD in Database)
CREATE TABLE pricing_plan (
    id                         VARCHAR(32) PRIMARY KEY,
    name                       VARCHAR(64) NOT NULL,
    price_idr                  INT NOT NULL,
    price_usd                  INT NOT NULL,
    duration_days              INT NOT NULL,
    monthly_document_limit     INT NOT NULL,
    certificate_max_recipients INT NOT NULL,
    max_api_keys               INT NOT NULL,
    brand_footer               BOOLEAN NOT NULL DEFAULT FALSE,
    badge                      VARCHAR(64),
    is_active                  BOOLEAN NOT NULL DEFAULT TRUE,
    stripe_price_id            VARCHAR(128),
    updated_at                 TIMESTAMP WITH TIME ZONE NOT NULL
);

INSERT INTO pricing_plan (id, name, price_idr, price_usd, duration_days, monthly_document_limit, certificate_max_recipients, max_api_keys, brand_footer, badge, is_active, stripe_price_id, updated_at)
VALUES
('PASS', 'Event Pass', 19000, 2, 7, 150, 100, 1, FALSE, 'Paling Pas untuk Acara & Deadline', TRUE, '', CURRENT_TIMESTAMP),
('PRO', 'Pro Bulanan', 29000, 5, 30, 500, 200, 1, FALSE, NULL, TRUE, '', CURRENT_TIMESTAMP),
('BUSINESS', 'Pro Tahunan', 149000, 15, 365, 6000, 500, 5, FALSE, 'Hemat 60% (1 Tahun)', TRUE, '', CURRENT_TIMESTAMP);
