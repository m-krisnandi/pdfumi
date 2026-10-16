-- QRIS Payment Orders (Midtrans / Local Indonesia)
CREATE TABLE payment_order (
    id                UUID PRIMARY KEY,
    account_id        UUID         NOT NULL,
    order_reference   VARCHAR(64)  NOT NULL,
    gateway           VARCHAR(32)  NOT NULL,
    plan              VARCHAR(32)  NOT NULL,
    duration_months   INT          NOT NULL DEFAULT 1,
    amount            INT          NOT NULL,
    status            VARCHAR(32)  NOT NULL DEFAULT 'UNPAID',
    qr_string         TEXT,
    qr_url            TEXT,
    checkout_url      TEXT,
    paid_at           TIMESTAMP WITH TIME ZONE,
    expires_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_payment_order_account FOREIGN KEY (account_id) REFERENCES account (id)
);

CREATE UNIQUE INDEX uq_payment_order_ref ON payment_order (order_reference);
CREATE INDEX idx_payment_order_account ON payment_order (account_id);
CREATE INDEX idx_payment_order_status ON payment_order (status);
